import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  Plus,
  Check,
  X,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  HoraExtra,
  Employee,
  InsertHoraExtra,
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHoraExtraSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HorasExtras() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: horasExtras = [], isLoading } = useQuery<HoraExtra[]>({
    queryKey: ["/api/horas-extras"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const filteredHoras = horasExtras.filter((hora) => {
    if (statusFilter === "all") return true;
    return hora.autorizado === statusFilter;
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee
      ? `${employee.nombre} ${employee.apellidoPaterno} ${employee.apellidoMaterno || ""}`.trim()
      : "Empleado no encontrado";
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pendiente: { label: "Pendiente", variant: "secondary" as const },
      autorizado: { label: "Autorizado", variant: "default" as const },
      rechazado: { label: "Rechazado", variant: "destructive" as const },
    };
    return config[status as keyof typeof config] || config.pendiente;
  };

  const getTipoLabel = (tipo: string) => {
    const config = {
      doble: "Doble",
      triple: "Triple",
    };
    return config[tipo as keyof typeof config] || tipo;
  };

  const authorizeMutation = useMutation({
    mutationFn: async ({ id, autorizado }: { id: string; autorizado: string }) => {
      return await apiRequest("PATCH", `/api/horas-extras/${id}`, {
        autorizado,
        autorizadoPor: "Sistema", // In a real app, this would be the current user
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horas-extras"] });
      toast({
        title: "Hora extra actualizada",
        description: "El estado de la hora extra ha sido actualizado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la hora extra",
        variant: "destructive",
      });
    },
  });

  const stats = {
    total: filteredHoras.length,
    pendiente: horasExtras.filter((h) => h.autorizado === "pendiente").length,
    autorizado: horasExtras.filter((h) => h.autorizado === "autorizado").length,
    rechazado: horasExtras.filter((h) => h.autorizado === "rechazado").length,
    totalHoras: filteredHoras.reduce((sum, h) => sum + parseFloat(h.horas || "0"), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Horas Extras</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona y autoriza las horas extras
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-registrar-hora-extra">
              <Plus className="mr-2 h-4 w-4" />
              Registrar Hora Extra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Hora Extra</DialogTitle>
              <DialogDescription>
                Registra las horas extras trabajadas por un empleado
              </DialogDescription>
            </DialogHeader>
            <HoraExtraForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Horas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoras.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total} registro(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pendiente}
            </div>
            <p className="text-xs text-muted-foreground">
              Por autorizar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autorizadas</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.autorizado}
            </div>
            <p className="text-xs text-muted-foreground">
              Aprobadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.rechazado}
            </div>
            <p className="text-xs text-muted-foreground">
              No aprobadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Registros de Horas Extras</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-status">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="autorizado">Autorizado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredHoras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay horas extras registradas
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                No se encontraron registros con los filtros seleccionados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoras.map((hora) => (
                  <TableRow
                    key={hora.id}
                    data-testid={`row-hora-extra-${hora.id}`}
                  >
                    <TableCell>
                      <p className="font-medium">
                        {getEmployeeName(hora.empleadoId)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(hora.fecha), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTipoLabel(hora.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {hora.horas} hrs
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {hora.motivo || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(hora.autorizado).variant}>
                        {getStatusBadge(hora.autorizado).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hora.autorizado === "pendiente" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              authorizeMutation.mutate({
                                id: hora.id!,
                                autorizado: "autorizado",
                              })
                            }
                            disabled={authorizeMutation.isPending}
                            data-testid={`button-autorizar-${hora.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              authorizeMutation.mutate({
                                id: hora.id!,
                                autorizado: "rechazado",
                              })
                            }
                            disabled={authorizeMutation.isPending}
                            data-testid={`button-rechazar-${hora.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HoraExtraForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertHoraExtra>({
    resolver: zodResolver(insertHoraExtraSchema),
    defaultValues: {
      empleadoId: "",
      fecha: new Date().toISOString().split("T")[0],
      horas: "",
      tipo: "doble",
      autorizado: "pendiente",
      motivo: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertHoraExtra) => {
      return await apiRequest("POST", "/api/horas-extras", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horas-extras"] });
      toast({
        title: "Hora extra registrada",
        description: "La hora extra ha sido registrada correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la hora extra",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertHoraExtra) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="empleadoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empleado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-empleado">
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id!}>
                      {employee.nombre} {employee.apellidoPaterno} {employee.apellidoMaterno || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-fecha" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Hora Extra</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-tipo">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="doble">Doble</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="horas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de Horas</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="2.5"
                  data-testid="input-horas"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Describe el motivo de las horas extras"
                  data-testid="textarea-motivo"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-guardar-hora-extra"
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Registrar
          </Button>
        </div>
      </form>
    </Form>
  );
}
