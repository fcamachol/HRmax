import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Filter,
  Plus,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
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
  Attendance,
  Employee,
  CentroTrabajo,
  InsertAttendance,
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAttendanceSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Attendance() {
  const [selectedCentro, setSelectedCentro] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: attendanceRecords = [], isLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
  });

  const filteredRecords = attendanceRecords.filter((record) => {
    const recordDate = new Date(record.date).toISOString().split("T")[0];
    const matchesDate = recordDate === selectedDate;
    const matchesCentro =
      selectedCentro === "all" || record.centroTrabajoId === selectedCentro;
    return matchesDate && matchesCentro;
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee
      ? `${employee.nombre} ${employee.apellidoPaterno} ${employee.apellidoMaterno || ""}`.trim()
      : "Empleado no encontrado";
  };

  const getCentroName = (centroId: string | null) => {
    if (!centroId) return "Sin asignar";
    const centro = centrosTrabajo.find((c) => c.id === centroId);
    return centro ? centro.nombre : "Sin asignar";
  };

  const getStatusBadge = (status: string) => {
    const config = {
      presente: { label: "Presente", variant: "default" as const },
      ausente: { label: "Ausente", variant: "destructive" as const },
      retardo: { label: "Retardo", variant: "secondary" as const },
      justificado: { label: "Justificado", variant: "outline" as const },
    };
    return config[status as keyof typeof config] || config.presente;
  };

  const statsToday = {
    total: filteredRecords.length,
    presente: filteredRecords.filter((r) => r.status === "presente").length,
    ausente: filteredRecords.filter((r) => r.status === "ausente").length,
    retardo: filteredRecords.filter((r) => r.status === "retardo").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Asistencia</h1>
          <p className="text-muted-foreground mt-2">
            Registra y monitorea la asistencia de empleados
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-registrar-asistencia">
              <Plus className="mr-2 h-4 w-4" />
              Registrar Asistencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Asistencia</DialogTitle>
              <DialogDescription>
                Registra la entrada/salida de un empleado
              </DialogDescription>
            </DialogHeader>
            <AttendanceForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registros
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsToday.total}</div>
            <p className="text-xs text-muted-foreground">
              {selectedDate === new Date().toISOString().split("T")[0]
                ? "Hoy"
                : format(new Date(selectedDate), "d MMM", { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statsToday.presente}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsToday.total > 0
                ? `${Math.round((statsToday.presente / statsToday.total) * 100)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retardos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {statsToday.retardo}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsToday.total > 0
                ? `${Math.round((statsToday.retardo / statsToday.total) * 100)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausencias</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {statsToday.ausente}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsToday.total > 0
                ? `${Math.round((statsToday.ausente / statsToday.total) * 100)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Registros de Asistencia</CardTitle>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                  data-testid="input-filter-date"
                />
              </div>
              <Select value={selectedCentro} onValueChange={setSelectedCentro}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-centro">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Centro de Trabajo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los centros</SelectItem>
                  {centrosTrabajo.map((centro) => (
                    <SelectItem key={centro.id} value={centro.id!}>
                      {centro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay registros de asistencia
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                No se encontraron registros para la fecha y filtros seleccionados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Centro de Trabajo</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Horas Trabajadas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    data-testid={`row-attendance-${record.id}`}
                  >
                    <TableCell>
                      <p className="font-medium">
                        {getEmployeeName(record.employeeId)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getCentroName(record.centroTrabajoId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {record.clockIn || "-"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {record.clockOut || "-"}
                    </TableCell>
                    <TableCell>
                      {record.horasTrabajadas
                        ? `${record.horasTrabajadas} hrs`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(record.status).variant}>
                        {getStatusBadge(record.status).label}
                      </Badge>
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

function AttendanceForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
  });

  const form = useForm<InsertAttendance>({
    resolver: zodResolver(insertAttendanceSchema),
    defaultValues: {
      employeeId: "",
      date: new Date().toISOString().split("T")[0],
      status: "presente",
      clockIn: "",
      clockOut: "",
      centroTrabajoId: "",
      horasTrabajadas: "",
      tipoJornada: "ordinaria",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertAttendance) => {
      return await apiRequest("POST", "/api/attendance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Asistencia registrada",
        description: "El registro de asistencia ha sido creado correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la asistencia",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAttendance) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employeeId"
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

        <FormField
          control={form.control}
          name="centroTrabajoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Centro de Trabajo</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-centro-trabajo">
                    <SelectValue placeholder="Selecciona un centro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {centrosTrabajo.map((centro) => (
                    <SelectItem key={centro.id} value={centro.id!}>
                      {centro.nombre}
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
            name="date"
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="presente">Presente</SelectItem>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="retardo">Retardo</SelectItem>
                    <SelectItem value="justificado">Justificado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="clockIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Entrada</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    type="time"
                    data-testid="input-check-in"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clockOut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Salida (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    type="time"
                    data-testid="input-check-out"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="horasTrabajadas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horas Trabajadas (Opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  type="text"
                  placeholder="8.5"
                  data-testid="input-horas-trabajadas"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Notas adicionales sobre la asistencia"
                  data-testid="textarea-notes"
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
            data-testid="button-guardar-asistencia"
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
