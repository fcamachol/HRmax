import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, DollarSign, AlertCircle } from "lucide-react";
import type { PrestamoInterno, Employee } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPrestamoInternoSchema } from "@shared/schema";
import type { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format, addDays } from "date-fns";

type FormData = z.infer<typeof insertPrestamoInternoSchema>;

interface PrestamosInternosTabProps {
  prestamos: PrestamoInterno[];
  employees: Employee[];
  isLoading: boolean;
}

export function PrestamosInternosTab({ prestamos, employees, isLoading }: PrestamosInternosTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrestamo, setEditingPrestamo] = useState<PrestamoInterno | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertPrestamoInternoSchema),
    defaultValues: {
      estado: "ACTIVO",
      descuentoAutomatico: true,
      tipoPlazo: "QUINCENAS",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/prestamos-internos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prestamos-internos"] });
      toast({ title: "Préstamo creado exitosamente" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error al crear préstamo", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      return await apiRequest("PATCH", `/api/prestamos-internos/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prestamos-internos"] });
      toast({ title: "Préstamo actualizado exitosamente" });
      setIsDialogOpen(false);
      setEditingPrestamo(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error al actualizar préstamo", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/prestamos-internos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prestamos-internos"] });
      toast({ title: "Préstamo eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al eliminar préstamo", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingPrestamo) {
      updateMutation.mutate({ id: editingPrestamo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (prestamo: PrestamoInterno) => {
    setEditingPrestamo(prestamo);
    form.reset({
      empleadoId: prestamo.empleadoId,
      montoTotal: prestamo.montoTotal.toString(),
      plazo: prestamo.plazo,
      tipoPlazo: prestamo.tipoPlazo as any,
      montoPorPeriodo: prestamo.montoPorPeriodo.toString(),
      saldoPendiente: prestamo.saldoPendiente.toString(),
      fechaOtorgamiento: prestamo.fechaOtorgamiento,
      fechaInicio: prestamo.fechaInicio,
      fechaEstimadaTermino: prestamo.fechaEstimadaTermino,
      fechaTermino: prestamo.fechaTermino || undefined,
      descuentoAutomatico: prestamo.descuentoAutomatico ?? true,
      estado: prestamo.estado as any,
      concepto: prestamo.concepto || "",
      notas: prestamo.notas || "",
      autorizadoPor: prestamo.autorizadoPor || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este préstamo?")) {
      deleteMutation.mutate(id);
    }
  };

  // Auto-calcular valores
  const montoTotal = parseFloat(form.watch("montoTotal") || "0");
  const plazo = parseInt(form.watch("plazo")?.toString() || "0");
  const fechaInicio = form.watch("fechaInicio");

  // Auto-calcular monto por periodo
  const handleCalcularMontoPeriodo = () => {
    if (montoTotal > 0 && plazo > 0) {
      const montoPorPeriodo = montoTotal / plazo;
      form.setValue("montoPorPeriodo", montoPorPeriodo.toFixed(2));
      form.setValue("saldoPendiente", montoTotal.toFixed(2));
    }
  };

  // Auto-calcular fecha estimada de término
  const handleCalcularFechaTermino = () => {
    if (fechaInicio && plazo > 0) {
      const tipoPlazo = form.watch("tipoPlazo");
      const diasPorPeriodo = tipoPlazo === "QUINCENAS" ? 15 : 30;
      const fechaTermino = addDays(new Date(fechaInicio), plazo * diasPorPeriodo);
      form.setValue("fechaEstimadaTermino", format(fechaTermino, "yyyy-MM-dd"));
    }
  };

  // Filtrar préstamos
  const filteredPrestamos = prestamos.filter((prestamo) => {
    const empleado = employees.find(e => e.id === prestamo.empleadoId);
    const nombreCompleto = empleado 
      ? `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ""}`.toLowerCase()
      : "";
    return nombreCompleto.includes(searchTerm.toLowerCase()) || 
           prestamo.concepto?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "ACTIVO":
        return <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>;
      case "TERMINADO":
        return <Badge variant="secondary">Terminado</Badge>;
      case "SUSPENDIDO":
        return <Badge>Suspendido</Badge>;
      case "CANCELADO":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestión de Préstamos Internos</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingPrestamo(null);
                    form.reset({
                      estado: "ACTIVO",
                      descuentoAutomatico: true,
                      tipoPlazo: "QUINCENAS",
                    });
                  }}
                  data-testid="button-nuevo-prestamo"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Préstamo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrestamo ? "Editar Préstamo Interno" : "Nuevo Préstamo Interno"}
                  </DialogTitle>
                  <DialogDescription>
                    Registra préstamos internos con descuento automático en nómina
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="empleadoId"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Empleado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-empleado">
                                  <SelectValue placeholder="Selecciona empleado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {employees.map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.nombre} {emp.apellidoPaterno} {emp.apellidoMaterno}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="montoTotal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto Total</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                data-testid="input-monto-total"
                                onBlur={handleCalcularMontoPeriodo}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="plazo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plazo (períodos)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                placeholder="12" 
                                data-testid="input-plazo"
                                onBlur={() => {
                                  handleCalcularMontoPeriodo();
                                  handleCalcularFechaTermino();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tipoPlazo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Plazo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-tipo-plazo">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="QUINCENAS">Quincenas</SelectItem>
                                <SelectItem value="MESES">Meses</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="montoPorPeriodo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto por Periodo</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                data-testid="input-monto-periodo"
                                readOnly
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Calculado automáticamente</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="saldoPendiente"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Saldo Pendiente</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                data-testid="input-saldo-pendiente"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaOtorgamiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Otorgamiento</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-fecha-otorgamiento" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaInicio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Inicio de Descuentos</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date" 
                                data-testid="input-fecha-inicio"
                                onBlur={handleCalcularFechaTermino}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaEstimadaTermino"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Estimada de Término</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-fecha-estimada" readOnly />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Calculado automáticamente</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-estado">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ACTIVO">Activo</SelectItem>
                                <SelectItem value="TERMINADO">Terminado</SelectItem>
                                <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                                <SelectItem value="CANCELADO">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="autorizadoPor"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Autorizado Por</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nombre de quien autorizó" data-testid="input-autorizado-por" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="concepto"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Concepto</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Motivo del préstamo" data-testid="input-concepto" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notas"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} placeholder="Notas adicionales..." data-testid="textarea-notas" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingPrestamo(null);
                          form.reset();
                        }}
                        data-testid="button-cancelar"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-guardar-prestamo"
                      >
                        {editingPrestamo ? "Actualizar" : "Crear"} Préstamo
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por empleado o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-prestamos"
              />
            </div>

            {/* Tabla */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Monto/Periodo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : filteredPrestamos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No se encontraron préstamos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrestamos.map((prestamo) => {
                      const empleado = employees.find(e => e.id === prestamo.empleadoId);
                      return (
                        <TableRow key={prestamo.id} data-testid={`row-prestamo-${prestamo.id}`}>
                          <TableCell>
                            {empleado 
                              ? `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ""}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{prestamo.concepto || "N/A"}</TableCell>
                          <TableCell>
                            ${parseFloat(prestamo.montoTotal.toString()).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            ${parseFloat(prestamo.montoPorPeriodo.toString()).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            ${parseFloat(prestamo.saldoPendiente.toString()).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {prestamo.plazo} {prestamo.tipoPlazo === "QUINCENAS" ? "quincenas" : "meses"}
                          </TableCell>
                          <TableCell>{getEstadoBadge(prestamo.estado)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(prestamo)}
                                data-testid={`button-edit-${prestamo.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(prestamo.id)}
                                data-testid={`button-delete-${prestamo.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
