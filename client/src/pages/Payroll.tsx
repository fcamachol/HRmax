import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calculator, Download, Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Payroll() {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("quincenal");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  // Mock payroll data for multiple employees
  const payrollEmployees = [
    {
      id: "1",
      name: "María García López",
      rfc: "GACM850101AB1",
      salary: 15000,
      earnings: 18500,
      deductions: 3050,
      netPay: 15450,
    },
    {
      id: "2",
      name: "Juan Pérez Martínez",
      rfc: "PEXJ900215CD2",
      salary: 12000,
      earnings: 14200,
      deductions: 2340,
      netPay: 11860,
    },
    {
      id: "3",
      name: "Ana Martínez Sánchez",
      rfc: "MASA920310EF3",
      salary: 18000,
      earnings: 21500,
      deductions: 3680,
      netPay: 17820,
    },
    {
      id: "4",
      name: "Laura Hernández Torres",
      rfc: "HETL950705IJ5",
      salary: 10000,
      earnings: 11800,
      deductions: 1920,
      netPay: 9880,
    },
  ];

  const totalSalary = payrollEmployees.reduce((sum, emp) => sum + emp.salary, 0);
  const totalEarnings = payrollEmployees.reduce((sum, emp) => sum + emp.earnings, 0);
  const totalDeductions = payrollEmployees.reduce((sum, emp) => sum + emp.deductions, 0);
  const totalNetPay = payrollEmployees.reduce((sum, emp) => sum + emp.netPay, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Nómina</h1>
        <p className="text-muted-foreground mt-2">
          Procesa la nómina para grupos de empleados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuración de Nómina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia de Pago</Label>
                <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                  <SelectTrigger id="frequency" data-testid="select-frequency">
                    <SelectValue placeholder="Selecciona frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Periodo de Nómina</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger id="period" data-testid="select-period">
                    <SelectValue placeholder="Selecciona periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">1-15 Nov 2025</SelectItem>
                    <SelectItem value="prev">16-31 Oct 2025</SelectItem>
                    <SelectItem value="prev2">1-15 Oct 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" data-testid="button-calculate">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Nómina para {payrollEmployees.length} Empleados
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-4">Tasas Fiscales Aplicadas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tasa ISR</p>
                  <p className="font-mono">10.88%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasa IMSS</p>
                  <p className="font-mono">5.00%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasa Infonavit</p>
                  <p className="font-mono">3.00%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">UMA Diaria</p>
                  <p className="font-mono">$108.57</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Empleados</span>
                <span className="font-semibold" data-testid="text-total-employees">
                  {payrollEmployees.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Salarios Base</span>
                <span className="font-mono">{formatCurrency(totalSalary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Percepciones</span>
                <span className="font-mono text-primary">{formatCurrency(totalEarnings)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Deducciones</span>
                <span className="font-mono text-destructive">{formatCurrency(totalDeductions)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Neto Total a Pagar</span>
                <span className="font-mono font-bold text-lg text-primary" data-testid="text-total-net-pay">
                  {formatCurrency(totalNetPay)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button className="w-full" variant="outline" data-testid="button-download">
                <Download className="h-4 w-4 mr-2" />
                Descargar Recibos
              </Button>
              <Button className="w-full" data-testid="button-send">
                <Send className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>RFC</TableHead>
                <TableHead className="text-right">Salario Base</TableHead>
                <TableHead className="text-right">Percepciones</TableHead>
                <TableHead className="text-right">Deducciones</TableHead>
                <TableHead className="text-right">Neto a Pagar</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollEmployees.map((employee) => (
                <TableRow key={employee.id} data-testid={`row-payroll-${employee.id}`}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm uppercase tracking-wide">
                      {employee.rfc}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(employee.salary)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-primary">
                    {formatCurrency(employee.earnings)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {formatCurrency(employee.deductions)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(employee.netPay)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" data-testid={`badge-status-${employee.id}`}>
                      Calculado
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={2}>TOTALES</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totalSalary)}
                </TableCell>
                <TableCell className="text-right font-mono text-primary">
                  {formatCurrency(totalEarnings)}
                </TableCell>
                <TableCell className="text-right font-mono text-destructive">
                  {formatCurrency(totalDeductions)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-lg">
                  {formatCurrency(totalNetPay)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
