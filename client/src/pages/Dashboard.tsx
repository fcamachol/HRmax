import { StatCard } from "@/components/StatCard";
import { Users, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const recentActivity = [
    { id: 1, employee: "María García", action: "Registro de asistencia", time: "Hace 5 min" },
    { id: 2, employee: "Juan Pérez", action: "Nómina procesada", time: "Hace 15 min" },
    { id: 3, employee: "Ana Martínez", action: "Solicitud de vacaciones", time: "Hace 1 hora" },
    { id: 4, employee: "Carlos López", action: "Actualización de datos", time: "Hace 2 horas" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Resumen general del sistema de nómina
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Empleados"
          value={156}
          icon={Users}
          change="+12% vs mes anterior"
          changeType="positive"
        />
        <StatCard
          title="Nómina Mensual"
          value="$2,450,000"
          icon={DollarSign}
          change="+5% vs mes anterior"
          changeType="positive"
        />
        <StatCard
          title="Asistencias Hoy"
          value="142/156"
          icon={Calendar}
          change="91% asistencia"
          changeType="neutral"
        />
        <StatCard
          title="Eficiencia"
          value="94%"
          icon={TrendingUp}
          change="+2% vs mes anterior"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Tiempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((item) => (
                <TableRow key={item.id} data-testid={`row-activity-${item.id}`}>
                  <TableCell className="font-medium">{item.employee}</TableCell>
                  <TableCell>{item.action}</TableCell>
                  <TableCell className="text-muted-foreground">{item.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
