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
import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@shared/schema";

export default function Dashboard() {
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const totalEmployees = employees.length;
  const totalNominaMensual = employees.reduce((sum, emp) => {
    const salario = parseFloat(emp.salarioBrutoMensual || "0");
    return sum + salario;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const recentEmployees = employees.slice(0, 5).map((emp, index) => ({
    id: index + 1,
    employee: `${emp.nombre} ${emp.apellidoPaterno}`,
    action: "Empleado activo",
    time: emp.puesto || "Sin puesto",
  }));

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
          value={totalEmployees}
          icon={Users}
          change="Empleados activos"
          changeType="positive"
        />
        <StatCard
          title="Nómina Mensual"
          value={formatCurrency(totalNominaMensual)}
          icon={DollarSign}
          change="Total bruto mensual"
          changeType="positive"
        />
        <StatCard
          title="Asistencias Hoy"
          value={`${totalEmployees}/${totalEmployees}`}
          icon={Calendar}
          change="100% asistencia"
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
          <CardTitle>Empleados Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Puesto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No hay empleados registrados
                  </TableCell>
                </TableRow>
              ) : (
                recentEmployees.map((item) => (
                  <TableRow key={item.id} data-testid={`row-activity-${item.id}`}>
                    <TableCell className="font-medium">{item.employee}</TableCell>
                    <TableCell>{item.action}</TableCell>
                    <TableCell className="text-muted-foreground">{item.time}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
