import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, LogIn, LogOut, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Employee, Attendance, CentroTrabajo, InsertAttendance } from "@shared/schema";

export default function RelojChecador() {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Update current time every second
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
  });

  const { data: todayAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
    select: (data) => {
      const today = new Date().toISOString().split("T")[0];
      return data.filter((record) => record.date === today);
    },
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      employeeSearch &&
      (emp.numeroEmpleado.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ""}`
          .toLowerCase()
          .includes(employeeSearch.toLowerCase()))
  );

  const clockInMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const now = new Date();
      const timeString = format(now, "HH:mm");
      
      const assignedCentro = centrosTrabajo[0]; // Default to first work center for now

      const data: InsertAttendance = {
        employeeId,
        date: format(now, "yyyy-MM-dd"),
        status: "presente",
        clockIn: timeString,
        centroTrabajoId: assignedCentro?.id || null,
        tipoJornada: "ordinaria",
      };

      return await apiRequest("POST", "/api/attendance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Entrada registrada",
        description: `Bienvenido, ${selectedEmployee?.nombre}`,
      });
      setSelectedEmployee(null);
      setEmployeeSearch("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la entrada",
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const now = new Date();
      const timeString = format(now, "HH:mm");

      return await apiRequest("PATCH", `/api/attendance/${attendanceId}`, {
        clockOut: timeString,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Salida registrada",
        description: `Hasta luego, ${selectedEmployee?.nombre}`,
      });
      setSelectedEmployee(null);
      setEmployeeSearch("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la salida",
        variant: "destructive",
      });
    },
  });

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearch("");
  };

  const handleClockIn = () => {
    if (selectedEmployee) {
      clockInMutation.mutate(selectedEmployee.id!);
    }
  };

  const handleClockOut = () => {
    if (selectedEmployee) {
      const todayRecord = todayAttendance.find(
        (record) => record.employeeId === selectedEmployee.id && !record.clockOut
      );

      if (todayRecord) {
        clockOutMutation.mutate(todayRecord.id!);
      } else {
        toast({
          title: "Error",
          description: "No se encontró un registro de entrada para hoy",
          variant: "destructive",
        });
      }
    }
  };

  const getEmployeeStatus = (employeeId: string) => {
    const todayRecord = todayAttendance.find(
      (record) => record.employeeId === employeeId
    );

    if (!todayRecord) return { status: "sin_registro", label: "Sin registro" };
    if (!todayRecord.clockOut) return { status: "en_trabajo", label: "En el trabajo" };
    return { status: "salida_registrada", label: "Salida registrada" };
  };

  const recentRecords = todayAttendance
    .slice()
    .sort((a, b) => {
      const timeA = a.clockOut || a.clockIn || "";
      const timeB = b.clockOut || b.clockIn || "";
      return timeB.localeCompare(timeA);
    })
    .slice(0, 10);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Reloj Checador</CardTitle>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-xl font-mono">
                {format(currentTime, "HH:mm:ss")}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre o número de empleado..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="pl-10 text-lg h-12"
                data-testid="input-employee-search"
              />
            </div>

            {employeeSearch && filteredEmployees.length > 0 && (
              <Card>
                <CardContent className="p-2 max-h-60 overflow-auto">
                  {filteredEmployees.map((employee) => {
                    const status = getEmployeeStatus(employee.id!);
                    return (
                      <button
                        key={employee.id}
                        onClick={() => handleEmployeeSelect(employee)}
                        className="w-full text-left p-3 hover-elevate active-elevate-2 rounded-md flex items-center justify-between"
                        data-testid={`button-select-employee-${employee.id}`}
                      >
                        <div>
                          <p className="font-medium">
                            {employee.nombre} {employee.apellidoPaterno}{" "}
                            {employee.apellidoMaterno || ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            #{employee.numeroEmpleado}
                          </p>
                        </div>
                        <Badge
                          variant={
                            status.status === "en_trabajo"
                              ? "default"
                              : status.status === "salida_registrada"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {status.label}
                        </Badge>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {selectedEmployee && (
              <Card className="border-primary">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {selectedEmployee.nombre[0]}
                          {selectedEmployee.apellidoPaterno[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">
                          {selectedEmployee.nombre} {selectedEmployee.apellidoPaterno}{" "}
                          {selectedEmployee.apellidoMaterno || ""}
                        </h3>
                        <p className="text-muted-foreground">
                          Empleado #{selectedEmployee.numeroEmpleado}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        size="lg"
                        onClick={handleClockIn}
                        disabled={
                          clockInMutation.isPending ||
                          getEmployeeStatus(selectedEmployee.id!).status === "en_trabajo" ||
                          getEmployeeStatus(selectedEmployee.id!).status === "salida_registrada"
                        }
                        className="h-16"
                        data-testid="button-clock-in"
                      >
                        <LogIn className="mr-2 h-5 w-5" />
                        Registrar Entrada
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleClockOut}
                        disabled={
                          clockOutMutation.isPending ||
                          getEmployeeStatus(selectedEmployee.id!).status !== "en_trabajo"
                        }
                        className="h-16"
                        data-testid="button-clock-out"
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Registrar Salida
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => setSelectedEmployee(null)}
                      className="w-full"
                      data-testid="button-cancel-selection"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Registros de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentRecords.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay registros para hoy
                </p>
              </div>
            ) : (
              recentRecords.map((record) => {
                const employee = employees.find((e) => e.id === record.employeeId);
                return (
                  <Card key={record.id} className="hover-elevate">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {employee
                              ? `${employee.nombre} ${employee.apellidoPaterno} ${employee.apellidoMaterno || ""}`
                              : "Empleado no encontrado"}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <LogIn className="h-3 w-3" />
                              {record.clockIn || "-"}
                            </span>
                            {record.clockOut && (
                              <span className="flex items-center gap-1">
                                <LogOut className="h-3 w-3" />
                                {record.clockOut}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={record.clockOut ? "outline" : "default"}
                        >
                          {record.clockOut ? "Completado" : "En progreso"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
