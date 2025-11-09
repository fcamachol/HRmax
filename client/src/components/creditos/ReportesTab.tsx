import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, AlertTriangle, TrendingDown } from "lucide-react";
import type { CreditoLegal, PrestamoInterno, Employee } from "@shared/schema";

interface ReportesTabProps {
  creditosLegales: CreditoLegal[];
  prestamosInternos: PrestamoInterno[];
  employees: Employee[];
}

export function ReportesTab({ creditosLegales, prestamosInternos, employees }: ReportesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");

  // Crear resumen por empleado
  const resumenPorEmpleado = employees.map((empleado) => {
    const creditosEmpleado = creditosLegales.filter(c => c.empleadoId === empleado.id);
    const prestamosEmpleado = prestamosInternos.filter(p => p.empleadoId === empleado.id);

    const creditosActivos = creditosEmpleado.filter(c => c.estado === "ACTIVO");
    const prestamosActivos = prestamosEmpleado.filter(p => p.estado === "ACTIVO");

    const totalDescuentosMensuales = 
      creditosActivos.reduce((sum, c) => sum + parseFloat(c.montoPorPeriodo?.toString() || "0"), 0) +
      prestamosActivos.reduce((sum, p) => sum + parseFloat(p.montoPorPeriodo.toString()), 0);

    const saldoTotalCreditos = creditosActivos.reduce((sum, c) => sum + parseFloat(c.saldoRestante?.toString() || "0"), 0);
    const saldoTotalPrestamos = prestamosActivos.reduce((sum, p) => sum + parseFloat(p.saldoPendiente.toString()), 0);

    return {
      empleado,
      creditosActivos: creditosActivos.length,
      prestamosActivos: prestamosActivos.length,
      totalDescuentosMensuales,
      saldoTotal: saldoTotalCreditos + saldoTotalPrestamos,
      detalles: [...creditosActivos, ...prestamosActivos],
    };
  }).filter(item => 
    item.creditosActivos > 0 || item.prestamosActivos > 0
  );

  // Filtrar empleados
  const filteredResumen = resumenPorEmpleado.filter((item) => {
    const nombreCompleto = `${item.empleado.nombre} ${item.empleado.apellidoPaterno} ${item.empleado.apellidoMaterno || ""}`.toLowerCase();
    const matchesSearch = nombreCompleto.includes(searchTerm.toLowerCase());
    
    let matchesEstado = true;
    if (filterEstado === "activos") {
      matchesEstado = item.creditosActivos > 0 || item.prestamosActivos > 0;
    } else if (filterEstado === "sin-descuentos") {
      matchesEstado = item.creditosActivos === 0 && item.prestamosActivos === 0;
    }
    
    return matchesSearch && matchesEstado;
  });

  // Calcular totales generales
  const totalesGenerales = {
    totalCreditos: creditosLegales.filter(c => c.estado === "ACTIVO").length,
    totalPrestamos: prestamosInternos.filter(p => p.estado === "ACTIVO").length,
    totalSaldoCreditos: creditosLegales
      .filter(c => c.estado === "ACTIVO")
      .reduce((sum, c) => sum + parseFloat(c.saldoRestante?.toString() || "0"), 0),
    totalSaldoPrestamos: prestamosInternos
      .filter(p => p.estado === "ACTIVO")
      .reduce((sum, p) => sum + parseFloat(p.saldoPendiente.toString()), 0),
  };

  // Alertas - créditos/préstamos próximos a terminar
  const alertasProximasTerminar = [
    ...creditosLegales.filter(c => {
      if (c.estado !== "ACTIVO" || !c.saldoRestante || !c.montoPorPeriodo) return false;
      const saldo = parseFloat(c.saldoRestante.toString());
      const montoPeriodo = parseFloat(c.montoPorPeriodo.toString());
      return saldo > 0 && saldo <= montoPeriodo * 3; // Faltan 3 periodos o menos
    }),
    ...prestamosInternos.filter(p => {
      if (p.estado !== "ACTIVO") return false;
      const saldo = parseFloat(p.saldoPendiente.toString());
      const montoPeriodo = parseFloat(p.montoPorPeriodo.toString());
      return saldo > 0 && saldo <= montoPeriodo * 3; // Faltan 3 periodos o menos
    }),
  ];

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Créditos Activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalesGenerales.totalCreditos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo: ${totalesGenerales.totalSaldoCreditos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Préstamos Activos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalesGenerales.totalPrestamos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo: ${totalesGenerales.totalSaldoPrestamos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ${(totalesGenerales.totalSaldoCreditos + totalesGenerales.totalSaldoPrestamos).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{alertasProximasTerminar.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos a terminar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alertasProximasTerminar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas - Próximos a Terminar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertasProximasTerminar.map((item) => {
                const empleado = employees.find(e => e.id === ("empleadoId" in item ? item.empleadoId : ""));
                const isCreditoLegal = "tipoCredito" in item;
                const saldo = isCreditoLegal 
                  ? parseFloat(item.saldoRestante?.toString() || "0")
                  : parseFloat((item as PrestamoInterno).saldoPendiente.toString());
                const montoPeriodo = isCreditoLegal
                  ? parseFloat(item.montoPorPeriodo?.toString() || "0")
                  : parseFloat((item as PrestamoInterno).montoPorPeriodo.toString());
                const periodosRestantes = Math.ceil(saldo / montoPeriodo);

                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                    data-testid={`alerta-${item.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {empleado 
                          ? `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ""}`
                          : "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isCreditoLegal 
                          ? `${(item as CreditoLegal).tipoCredito} - ${(item as CreditoLegal).numeroCredito || "N/A"}`
                          : `Préstamo - ${(item as PrestamoInterno).concepto || "N/A"}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${saldo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                      <p className="text-sm text-muted-foreground">
                        {periodosRestantes} {periodosRestantes === 1 ? "periodo" : "periodos"} restantes
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen por empleado */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Descuentos por Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-reportes"
                />
              </div>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activos">Con descuentos activos</SelectItem>
                  <SelectItem value="sin-descuentos">Sin descuentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabla */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Créditos Activos</TableHead>
                    <TableHead>Préstamos Activos</TableHead>
                    <TableHead>Descuento Mensual</TableHead>
                    <TableHead>Saldo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResumen.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No se encontraron empleados con descuentos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResumen.map((item) => (
                      <TableRow key={item.empleado.id} data-testid={`row-empleado-${item.empleado.id}`}>
                        <TableCell className="font-medium">
                          {item.empleado.nombre} {item.empleado.apellidoPaterno} {item.empleado.apellidoMaterno || ""}
                        </TableCell>
                        <TableCell>
                          {item.creditosActivos > 0 ? (
                            <Badge variant="default">{item.creditosActivos}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.prestamosActivos > 0 ? (
                            <Badge variant="secondary">{item.prestamosActivos}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          ${item.totalDescuentosMensuales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${item.saldoTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))
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
