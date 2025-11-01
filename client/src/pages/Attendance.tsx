import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Attendance() {
  const today = new Date();
  
  const mockRecords = [
    { date: new Date(today.getFullYear(), today.getMonth(), 1), status: "present" as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 2), status: "present" as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 3), status: "late" as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 4), status: "present" as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 5), status: "vacation" as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 8), status: "present" as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 9), status: "present" as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 10), status: "absent" as const },
  ];

  const todayAttendance = [
    { id: 1, name: "María García", department: "Ventas", clockIn: "08:45", status: "present" },
    { id: 2, name: "Juan Pérez", department: "IT", clockIn: "09:15", status: "late" },
    { id: 3, name: "Ana Martínez", department: "RRHH", clockIn: "08:30", status: "present" },
    { id: 4, name: "Carlos López", department: "Finanzas", clockIn: "-", status: "vacation" },
    { id: 5, name: "Laura Hernández", department: "Operaciones", clockIn: "08:50", status: "present" },
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      present: { label: "Presente", variant: "default" as const },
      absent: { label: "Ausente", variant: "destructive" as const },
      late: { label: "Tarde", variant: "secondary" as const },
      vacation: { label: "Vacaciones", variant: "outline" as const },
    };
    return config[status as keyof typeof config] || config.present;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Asistencia</h1>
        <p className="text-muted-foreground mt-2">
          Registra y monitorea la asistencia de empleados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceCalendar records={mockRecords} />

        <Card>
          <CardHeader>
            <CardTitle>Asistencia de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAttendance.map((record) => (
                  <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.name}</p>
                        <p className="text-sm text-muted-foreground">{record.department}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{record.clockIn}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(record.status).variant}>
                        {getStatusBadge(record.status).label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
