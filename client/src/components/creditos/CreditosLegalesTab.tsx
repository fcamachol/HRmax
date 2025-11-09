import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit2, Trash2, FileText } from "lucide-react";
import type { CreditoLegal, Employee } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCreditoLegalSchema } from "@shared/schema";
import type { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type FormData = z.infer<typeof insertCreditoLegalSchema>;

interface CreditosLegalesTabProps {
  creditos: CreditoLegal[];
  employees: Employee[];
  isLoading: boolean;
}

export function CreditosLegalesTab({ creditos, employees, isLoading }: CreditosLegalesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredito, setEditingCredito] = useState<CreditoLegal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertCreditoLegalSchema),
    defaultValues: {
      tipoCredito: "INFONAVIT",
      estado: "ACTIVO",
      descuentoAutomatico: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/creditos-legales", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creditos-legales"] });
      toast({ title: "Crédito creado exitosamente" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error al crear crédito", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      return await apiRequest("PATCH", `/api/creditos-legales/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creditos-legales"] });
      toast({ title: "Crédito actualizado exitosamente" });
      setIsDialogOpen(false);
      setEditingCredito(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error al actualizar crédito", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/creditos-legales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creditos-legales"] });
      toast({ title: "Crédito eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al eliminar crédito", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingCredito) {
      updateMutation.mutate({ id: editingCredito.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (credito: CreditoLegal) => {
    setEditingCredito(credito);
    form.reset({
      empleadoId: credito.empleadoId,
      tipoCredito: credito.tipoCredito as any,
      numeroCredito: credito.numeroCredito || "",
      tipoCalculoInfonavit: credito.tipoCalculoInfonavit as any || undefined,
      valorDescuento: credito.valorDescuento?.toString() || "",
      montoTotal: credito.montoTotal?.toString() || "",
      montoPorPeriodo: credito.montoPorPeriodo?.toString() || "",
      saldoRestante: credito.saldoRestante?.toString() || "",
      fechaInicio: credito.fechaInicio,
      fechaTermino: credito.fechaTermino || undefined,
      beneficiario: credito.beneficiario || "",
      documentoLegal: credito.documentoLegal || "",
      estado: credito.estado as any,
      descuentoAutomatico: credito.descuentoAutomatico ?? true,
      notas: credito.notas || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este crédito?")) {
      deleteMutation.mutate(id);
    }
  };

  const tipoCredito = form.watch("tipoCredito");

  // Filtrar créditos
  const filteredCreditos = creditos.filter((credito) => {
    const empleado = employees.find(e => e.id === credito.empleadoId);
    const nombreCompleto = empleado 
      ? `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ""}`.toLowerCase()
      : "";
    const matchesSearch = nombreCompleto.includes(searchTerm.toLowerCase()) || 
                         (credito.numeroCredito?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTipo = filterTipo === "all" || credito.tipoCredito === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "INFONAVIT":
        return <Badge variant="default">INFONAVIT</Badge>;
      case "FONACOT":
        return <Badge variant="secondary">FONACOT</Badge>;
      case "PENSION_ALIMENTICIA":
        return <Badge>Pensión Alimenticia</Badge>;
      case "EMBARGO":
        return <Badge variant="destructive">Embargo</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

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
            <CardTitle>Gestión de Créditos Legales</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingCredito(null);
                    form.reset({
                      tipoCredito: "INFONAVIT",
                      estado: "ACTIVO",
                      descuentoAutomatico: true,
                    });
                  }}
                  data-testid="button-nuevo-credito"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Crédito
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCredito ? "Editar Crédito Legal" : "Nuevo Crédito Legal"}
                  </DialogTitle>
                  <DialogDescription>
                    Registra créditos INFONAVIT, FONACOT, pensión alimenticia o embargos
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
                        name="tipoCredito"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Crédito</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-tipo-credito">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="INFONAVIT">INFONAVIT</SelectItem>
                                <SelectItem value="FONACOT">FONACOT</SelectItem>
                                <SelectItem value="PENSION_ALIMENTICIA">Pensión Alimenticia</SelectItem>
                                <SelectItem value="EMBARGO">Embargo</SelectItem>
                              </SelectContent>
                            </Select>
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

                      {(tipoCredito === "INFONAVIT" || tipoCredito === "FONACOT") && (
                        <FormField
                          control={form.control}
                          name="numeroCredito"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Crédito</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="123456789" data-testid="input-numero-credito" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {tipoCredito === "INFONAVIT" && (
                        <FormField
                          control={form.control}
                          name="tipoCalculoInfonavit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Cálculo</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-tipo-calculo">
                                    <SelectValue placeholder="Selecciona tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="CUOTA_FIJA">Cuota Fija</SelectItem>
                                  <SelectItem value="PORCENTAJE">Porcentaje</SelectItem>
                                  <SelectItem value="FACTOR_DESCUENTO">Factor de Descuento</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {tipoCredito === "INFONAVIT" && (
                        <FormField
                          control={form.control}
                          name="valorDescuento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor del Descuento</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  data-testid="input-valor-descuento"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

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
                              />
                            </FormControl>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="saldoRestante"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Saldo Restante</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                data-testid="input-saldo-restante"
                              />
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
                            <FormLabel>Fecha Inicio</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-fecha-inicio" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaTermino"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Término (Opcional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-fecha-termino" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {(tipoCredito === "PENSION_ALIMENTICIA" || tipoCredito === "EMBARGO") && (
                        <FormField
                          control={form.control}
                          name="beneficiario"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Beneficiario</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nombre del beneficiario" data-testid="input-beneficiario" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

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
                          setEditingCredito(null);
                          form.reset();
                        }}
                        data-testid="button-cancelar"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-guardar-credito"
                      >
                        {editingCredito ? "Actualizar" : "Crear"} Crédito
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
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por empleado o número de crédito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-creditos"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-tipo">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="INFONAVIT">INFONAVIT</SelectItem>
                  <SelectItem value="FONACOT">FONACOT</SelectItem>
                  <SelectItem value="PENSION_ALIMENTICIA">Pensión Alimenticia</SelectItem>
                  <SelectItem value="EMBARGO">Embargo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabla */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Monto/Periodo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : filteredCreditos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No se encontraron créditos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCreditos.map((credito) => {
                      const empleado = employees.find(e => e.id === credito.empleadoId);
                      return (
                        <TableRow key={credito.id} data-testid={`row-credito-${credito.id}`}>
                          <TableCell>
                            {empleado 
                              ? `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ""}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{getTipoBadge(credito.tipoCredito)}</TableCell>
                          <TableCell>{credito.numeroCredito || "N/A"}</TableCell>
                          <TableCell>
                            ${parseFloat(credito.montoPorPeriodo?.toString() || "0").toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            ${parseFloat(credito.saldoRestante?.toString() || "0").toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{getEstadoBadge(credito.estado)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(credito)}
                                data-testid={`button-edit-${credito.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(credito.id)}
                                data-testid={`button-delete-${credito.id}`}
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
