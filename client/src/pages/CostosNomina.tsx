/**
 * Costos de Nomina Page
 *
 * Displays aggregated payroll costs with:
 * - Date range selection
 * - Summary cards for key metrics
 * - Breakdown by empresa
 * - ISN breakdown by state (for multi-state operations)
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
  Download,
  Filter,
  MapPin,
  Calculator,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { Empresa } from "@shared/schema";

// Types matching backend response
interface TotalesCostos {
  isrRetenido: number;
  imssObrero: number;
  totalDeduccionesEmpleado: number;
  imssPatronal: number;
  isn: number;
  totalPercepcionesGravadas: number;
  totalPercepciones: number;
  subsidioAplicado: number;
  totalNetoEmpleados: number;
  costoTotalEmpresa: number;
  empleadosUnicos: number;
  periodosIncluidos: number;
}

interface CostosEmpresa extends TotalesCostos {
  empresaId: string;
  empresaNombre: string;
  empresaRfc: string;
}

interface CostosPorEstado {
  estado: string;
  tasaBp: number;
  tasaPorcentaje: number;
  baseGravable: number;
  isnMonto: number;
  empleadosCount: number;
}

interface ResumenCostosNomina {
  filtros: {
    clienteId: string;
    empresaId?: string;
    fechaInicio: string;
    fechaFin: string;
  };
  totales: TotalesCostos;
  porEmpresa: CostosEmpresa[];
  isnPorEstado: CostosPorEstado[];
  incluyeEstimaciones: boolean;
  periodosEstimados: string[];
}

export default function CostosNomina() {
  // Default to current month
  const [fechaInicio, setFechaInicio] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [fechaFin, setFechaFin] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [empresaFilter, setEmpresaFilter] = useState<string>("all");

  // Quick date range presets
  const setPreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case "current_month":
        setFechaInicio(format(startOfMonth(now), "yyyy-MM-dd"));
        setFechaFin(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "last_month":
        const lastMonth = subMonths(now, 1);
        setFechaInicio(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
        setFechaFin(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
        break;
      case "last_3_months":
        setFechaInicio(format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"));
        setFechaFin(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "ytd":
        setFechaInicio(`${now.getFullYear()}-01-01`);
        setFechaFin(format(now, "yyyy-MM-dd"));
        break;
    }
  };

  // Fetch empresas for filter
  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("fechaInicio", fechaInicio);
    params.set("fechaFin", fechaFin);
    if (empresaFilter !== "all") {
      params.set("empresaId", empresaFilter);
    }
    return params.toString();
  }, [fechaInicio, fechaFin, empresaFilter]);

  // Fetch costs data
  const {
    data: costos,
    isLoading,
    error,
  } = useQuery<ResumenCostosNomina>({
    queryKey: [`/api/costos-nomina?${queryParams}`],
    enabled: Boolean(fechaInicio && fechaFin),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-MX").format(num);
  };

  const formatEstado = (estado: string) => {
    return estado.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Costos de Nomina</h1>
          <p className="text-muted-foreground mt-1">
            Analisis de costos laborales y obligaciones fiscales
          </p>
        </div>
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombreComercial || emp.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Periodo Rapido</Label>
              <Select onValueChange={setPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mes actual</SelectItem>
                  <SelectItem value="last_month">Mes anterior</SelectItem>
                  <SelectItem value="last_3_months">Ultimos 3 meses</SelectItem>
                  <SelectItem value="ytd">Ano actual (YTD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {costos && costos.totales && (
        <>
          {/* Employer Costs Section */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Costos Patronales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Costo Total Empresa"
                value={formatCurrency(costos.totales.costoTotalEmpresa)}
                icon={DollarSign}
                change="Percepciones + IMSS + ISN"
                changeType="neutral"
              />
              <StatCard
                title="IMSS Patronal"
                value={formatCurrency(costos.totales.imssPatronal)}
                icon={Building2}
                change={
                  costos.totales.totalPercepcionesGravadas > 0
                    ? `${((costos.totales.imssPatronal / costos.totales.totalPercepcionesGravadas) * 100).toFixed(1)}% del bruto gravado`
                    : "Sin datos"
                }
                changeType="neutral"
              />
              <StatCard
                title="ISN (Impuesto Estatal)"
                value={formatCurrency(costos.totales.isn)}
                icon={MapPin}
                change="Impuesto sobre nomina"
                changeType="neutral"
              />
              <StatCard
                title="Empleados"
                value={formatNumber(costos.totales.empleadosUnicos)}
                icon={Users}
                change={`${costos.totales.periodosIncluidos} periodo(s)`}
                changeType="neutral"
              />
            </div>
          </div>

          {/* Employee Deductions Section */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Retenciones a Empleados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="ISR Retenido"
                value={formatCurrency(costos.totales.isrRetenido)}
                icon={Calculator}
                change="Impuesto sobre la renta"
                changeType="neutral"
              />
              <StatCard
                title="IMSS Obrero"
                value={formatCurrency(costos.totales.imssObrero)}
                icon={TrendingDown}
                change="Cuotas trabajador"
                changeType="neutral"
              />
              <StatCard
                title="Subsidio al Empleo"
                value={formatCurrency(costos.totales.subsidioAplicado)}
                icon={TrendingUp}
                change="Subsidio aplicado"
                changeType="positive"
              />
              <StatCard
                title="Neto a Empleados"
                value={formatCurrency(costos.totales.totalNetoEmpleados)}
                icon={DollarSign}
                change="Total pagado"
                changeType="neutral"
              />
            </div>
          </div>

          {/* ISN by State Table */}
          {costos.isnPorEstado && costos.isnPorEstado.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  ISN por Estado
                  <Badge variant="secondary" className="ml-2">
                    {costos.isnPorEstado.length} estado(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  El ISN se paga en el estado donde trabaja el empleado. Use esta tabla para sus declaraciones estatales.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Empleados</TableHead>
                      <TableHead className="text-right">Base Gravable</TableHead>
                      <TableHead className="text-right">Tasa</TableHead>
                      <TableHead className="text-right">ISN a Pagar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costos.isnPorEstado.map((estado) => (
                      <TableRow key={estado.estado}>
                        <TableCell className="font-medium">
                          {formatEstado(estado.estado)}
                        </TableCell>
                        <TableCell className="text-right">
                          {estado.empleadosCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(estado.baseGravable)}
                        </TableCell>
                        <TableCell className="text-right">
                          {estado.tasaPorcentaje.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(estado.isnMonto)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {costos.isnPorEstado.reduce((sum, e) => sum + e.empleadosCount, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(costos.isnPorEstado.reduce((sum, e) => sum + e.baseGravable, 0))}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(costos.totales.isn)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Breakdown by Empresa */}
          {costos.porEmpresa && costos.porEmpresa.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Desglose por Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Percepciones</TableHead>
                      <TableHead className="text-right">IMSS Patronal</TableHead>
                      <TableHead className="text-right">ISN</TableHead>
                      <TableHead className="text-right">ISR Retenido</TableHead>
                      <TableHead className="text-right">IMSS Obrero</TableHead>
                      <TableHead className="text-right">Costo Total</TableHead>
                      <TableHead className="text-right">Empleados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costos.porEmpresa.map((emp) => (
                      <TableRow key={emp.empresaId}>
                        <TableCell>
                          <div className="font-medium">{emp.empresaNombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {emp.empresaRfc}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(emp.totalPercepciones)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(emp.imssPatronal)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(emp.isn)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(emp.isrRetenido)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(emp.imssObrero)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(emp.costoTotalEmpresa)}
                        </TableCell>
                        <TableCell className="text-right">
                          {emp.empleadosUnicos}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Single Empresa Detail (when filtered or only one) */}
          {costos.porEmpresa && costos.porEmpresa.length === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Detalle: {costos.porEmpresa[0].empresaNombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Percepciones Totales
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(costos.porEmpresa[0].totalPercepciones)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Percepciones Gravadas
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(
                        costos.porEmpresa[0].totalPercepcionesGravadas
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Total Deducciones
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(
                        costos.porEmpresa[0].totalDeduccionesEmpleado
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Periodos Incluidos
                    </p>
                    <p className="text-lg font-semibold">
                      {costos.porEmpresa[0].periodosIncluidos}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No data state */}
      {(!costos || !costos.totales || costos.totales.empleadosUnicos === 0) &&
        !isLoading && (
          <Card>
            <CardContent className="py-10 text-center">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay datos de nomina procesados para el periodo seleccionado.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Los costos se calculan a partir de nominas procesadas. Asegurese de
                tener periodos con nominas calculadas en el rango de fechas.
              </p>
            </CardContent>
          </Card>
        )}

      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <p className="text-destructive">
              Error al cargar los costos: {(error as Error).message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
