import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  Calculator,
  FileText,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  RefreshCw,
  DollarSign,
  FileDown,
  Download,
  Eye,
  Loader2
} from "lucide-react";
import type { SuaBimestre, Empresa, RegistroPatronal } from "@shared/schema";

interface CalculoResultado {
  totalesObrero: number;
  totalesPatronal: number;
  totalesGeneral: number;
  empleados: Array<{
    empleadoId: string;
    sbcDiario: number;
    diasCotizados: number;
    totalObrero: number;
    totalPatronal: number;
    total: number;
  }>;
  desglosePorRamo: Array<{
    ramo: string;
    obrero: number;
    patronal: number;
    total: number;
  }>;
}

const bimestreLabels: Record<number, string> = {
  1: "Ene-Feb",
  2: "Mar-Abr",
  3: "May-Jun",
  4: "Jul-Ago",
  5: "Sep-Oct",
  6: "Nov-Dic",
};

const estatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pendiente: { label: "Pendiente", variant: "secondary", icon: Clock },
  calculado: { label: "Calculado", variant: "outline", icon: Calculator },
  archivo_generado: { label: "Archivo Generado", variant: "outline", icon: FileText },
  pagado: { label: "Pagado", variant: "default", icon: CheckCircle2 },
  vencido: { label: "Vencido", variant: "destructive", icon: AlertCircle },
};

export default function SuaBimestres() {
  const { toast } = useToast();
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [selectedRegistroPatronal, setSelectedRegistroPatronal] = useState<string>("");
  const [selectedEjercicio, setSelectedEjercicio] = useState<string>(new Date().getFullYear().toString());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"calcular" | "generar" | "pago" | "preview">("calcular");
  const [selectedBimestre, setSelectedBimestre] = useState<SuaBimestre | null>(null);
  const [calculoResultado, setCalculoResultado] = useState<CalculoResultado | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [pagoData, setPagoData] = useState({
    fechaPago: "",
    lineaCaptura: "",
    bancoRecaudador: "",
    folioComprobante: "",
    importePagadoDecimal: "",
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const { data: registrosPatronales = [] } = useQuery<RegistroPatronal[]>({
    queryKey: ["/api/registros-patronales", { empresaId: selectedEmpresa }],
    enabled: !!selectedEmpresa,
  });

  const { data: bimestres = [], isLoading, refetch } = useQuery<SuaBimestre[]>({
    queryKey: ["/api/sua/bimestres", { 
      registroPatronalId: selectedRegistroPatronal || undefined,
      empresaId: !selectedRegistroPatronal ? selectedEmpresa : undefined,
      ejercicio: selectedEjercicio 
    }],
    enabled: !!selectedEmpresa,
  });

  const calcularMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/sua/bimestres/${id}/calcular`),
    onSuccess: () => {
      refetch();
      toast({ title: "Bimestre calculado", description: "Las cuotas han sido calculadas correctamente" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const generarArchivoMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/sua/bimestres/${id}/generar-archivo`, {
      archivoNombre: `SUA_${selectedEjercicio}_B${selectedBimestre?.bimestre}.txt`,
      archivoPath: `/sua/${selectedEjercicio}/`,
    }),
    onSuccess: () => {
      refetch();
      toast({ title: "Archivo generado", description: "El archivo SUA ha sido generado correctamente" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const registrarPagoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof pagoData }) => 
      apiRequest("POST", `/api/sua/bimestres/${id}/registrar-pago`, {
        ...data,
        importePagadoDecimal: parseFloat(data.importePagadoDecimal),
      }),
    onSuccess: () => {
      refetch();
      toast({ title: "Pago registrado", description: "El pago ha sido registrado correctamente" });
      setDialogOpen(false);
      setPagoData({ fechaPago: "", lineaCaptura: "", bancoRecaudador: "", folioComprobante: "", importePagadoDecimal: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (value: string | number | bigint | null) => {
    if (!value) return "-";
    let num: number;
    if (typeof value === 'bigint') {
      num = Number(value) / 10000;
    } else if (typeof value === 'string') {
      num = parseFloat(value);
    } else {
      num = value;
    }
    return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const openActionDialog = (bimestre: SuaBimestre, type: "calcular" | "generar" | "pago" | "preview") => {
    setSelectedBimestre(bimestre);
    setDialogType(type);
    setCalculoResultado(null);
    setDialogOpen(true);
    
    if (type === "calcular" || type === "preview") {
      calcularCuotasBimestre(bimestre);
    }
  };

  const calcularCuotasBimestre = async (bimestre: SuaBimestre) => {
    setIsCalculating(true);
    try {
      const empleadosRes = await apiRequest("GET", `/api/employees?empresaId=${selectedEmpresa}&activo=true`);
      const empleadosData = (empleadosRes as any[]) || [];
      
      const empleadosIMSS = empleadosData.map((e: any) => ({
        empleadoId: e.id,
        sbcDiario: parseFloat(e.sbc || e.salarioDiario || "0"),
        diasCotizados: 61,
        empresaId: selectedEmpresa,
      }));

      if (empleadosIMSS.length === 0) {
        toast({ 
          title: "Sin empleados", 
          description: "No hay empleados activos para calcular",
          variant: "destructive" 
        });
        setIsCalculating(false);
        return;
      }

      const resultado = await apiRequest("POST", "/api/imss/calcular-bimestre", {
        empresaId: selectedEmpresa,
        empleados: empleadosIMSS,
        ejercicio: parseInt(selectedEjercicio),
        bimestre: bimestre.bimestre,
      });

      setCalculoResultado(resultado as CalculoResultado);
    } catch (error: any) {
      toast({ 
        title: "Error al calcular", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDialogConfirm = async () => {
    if (!selectedBimestre) return;
    
    switch (dialogType) {
      case "calcular":
        if (calculoResultado) {
          await apiRequest("PATCH", `/api/sua/bimestres/${selectedBimestre.id}`, {
            estatus: "calculado",
            fechaCalculo: new Date().toISOString(),
            importeObreroDecimal: calculoResultado.totalesObrero.toString(),
            importePatronalDecimal: calculoResultado.totalesPatronal.toString(),
            importeTotalDecimal: calculoResultado.totalesGeneral.toString(),
            numEmpleados: calculoResultado.empleados.length,
          });
          refetch();
          toast({ title: "Bimestre calculado", description: "Las cuotas han sido calculadas y guardadas correctamente" });
          setDialogOpen(false);
        }
        break;
      case "generar":
        generarArchivoMutation.mutate(selectedBimestre.id);
        break;
      case "pago":
        registrarPagoMutation.mutate({ id: selectedBimestre.id, data: pagoData });
        break;
      case "preview":
        setDialogOpen(false);
        break;
    }
  };

  const downloadCSV = () => {
    if (!calculoResultado || !selectedBimestre) return;
    
    let csv = "Ramo,Cuota Obrero,Cuota Patronal,Total\n";
    for (const ramo of calculoResultado.desglosePorRamo) {
      csv += `${ramo.ramo},${ramo.obrero.toFixed(2)},${ramo.patronal.toFixed(2)},${ramo.total.toFixed(2)}\n`;
    }
    csv += `\nTOTALES,${calculoResultado.totalesObrero.toFixed(2)},${calculoResultado.totalesPatronal.toFixed(2)},${calculoResultado.totalesGeneral.toFixed(2)}\n`;
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cuotas_imss_${selectedEjercicio}_b${selectedBimestre.bimestre}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const countByEstatus = (estatus: string) => 
    bimestres.filter(b => b.estatus === estatus).length;

  const totalCalculado = bimestres.reduce((sum, b) => {
    if (b.importeTotalDecimal) {
      return sum + parseFloat(b.importeTotalDecimal.toString());
    }
    return sum;
  }, 0);

  const totalPagado = bimestres.reduce((sum, b) => {
    if (b.importePagadoDecimal) {
      return sum + parseFloat(b.importePagadoDecimal.toString());
    }
    return sum;
  }, 0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-sua-bimestres-title">SUA Bimestres</h1>
        <p className="text-muted-foreground mt-2">
          Control y seguimiento de cuotas bimestrales IMSS por registro patronal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByEstatus("pendiente")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Pagados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByEstatus("pagado")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-500" />
              Total Calculado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalCalculado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Total Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalPagado)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Empresa</Label>
              <Select value={selectedEmpresa} onValueChange={(v) => { setSelectedEmpresa(v); setSelectedRegistroPatronal(""); }}>
                <SelectTrigger data-testid="select-empresa">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[220px]">
              <Label>Registro Patronal</Label>
              <Select value={selectedRegistroPatronal || "all"} onValueChange={(v) => setSelectedRegistroPatronal(v === "all" ? "" : v)} disabled={!selectedEmpresa}>
                <SelectTrigger data-testid="select-registro-patronal">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {registrosPatronales.map((rp) => (
                    <SelectItem key={rp.id} value={rp.id}>
                      {rp.numeroRegistroPatronal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[120px]">
              <Label>Ejercicio</Label>
              <Select value={selectedEjercicio} onValueChange={setSelectedEjercicio}>
                <SelectTrigger data-testid="select-ejercicio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {!selectedEmpresa ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecciona una empresa para ver los bimestres SUA</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : bimestres.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay bimestres registrados para este ejercicio</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Bimestre</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Empleados</TableHead>
                <TableHead>Importe Total</TableHead>
                <TableHead>Importe Pagado</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Fecha Pago</TableHead>
                <TableHead className="w-40 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bimestres.map((bim) => {
                const EstatusIcon = estatusLabels[bim.estatus]?.icon || Clock;
                return (
                  <TableRow key={bim.id} data-testid={`row-bimestre-${bim.id}`}>
                    <TableCell className="font-medium">
                      {bimestreLabels[bim.bimestre] || `B${bim.bimestre}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(bim.fechaInicioPeriodo)} - {formatDate(bim.fechaFinPeriodo)}
                    </TableCell>
                    <TableCell>{bim.numEmpleados || "-"}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(bim.importeTotalDecimal)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(bim.importePagadoDecimal)}</TableCell>
                    <TableCell>
                      <Badge variant={estatusLabels[bim.estatus]?.variant || "secondary"} className="gap-1">
                        <EstatusIcon className="h-3 w-3" />
                        {estatusLabels[bim.estatus]?.label || bim.estatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(bim.fechaLimitePago)}</TableCell>
                    <TableCell>{formatDate(bim.fechaPago)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {bim.estatus === "pendiente" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openActionDialog(bim, "calcular")}
                            data-testid={`button-calcular-${bim.id}`}
                            title="Calcular cuotas"
                          >
                            <Calculator className="h-3 w-3" />
                          </Button>
                        )}
                        {(bim.estatus === "calculado" || bim.estatus === "archivo_generado" || bim.estatus === "pagado") && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openActionDialog(bim, "preview")}
                            data-testid={`button-preview-${bim.id}`}
                            title="Ver detalle de cuotas"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {bim.estatus === "calculado" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openActionDialog(bim, "generar")}
                            data-testid={`button-generar-${bim.id}`}
                            title="Generar archivo SUA"
                          >
                            <FileDown className="h-3 w-3" />
                          </Button>
                        )}
                        {(bim.estatus === "calculado" || bim.estatus === "archivo_generado") && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openActionDialog(bim, "pago")}
                            data-testid={`button-pago-${bim.id}`}
                            title="Registrar pago"
                          >
                            <CreditCard className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={dialogType === "calcular" || dialogType === "preview" ? "max-w-3xl" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "calcular" && "Calcular Cuotas del Bimestre"}
              {dialogType === "preview" && "Detalle de Cuotas Calculadas"}
              {dialogType === "generar" && "Generar Archivo SUA"}
              {dialogType === "pago" && "Registrar Pago"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "calcular" && "Cuotas IMSS calculadas con tasas progresivas 2025"}
              {dialogType === "preview" && `Bimestre ${selectedBimestre?.bimestre} - ${selectedEjercicio}`}
              {dialogType === "generar" && "Se generará el archivo de texto para importar en el sistema SUA."}
              {dialogType === "pago" && "Registra los datos del pago realizado ante el banco."}
            </DialogDescription>
          </DialogHeader>
          
          {(dialogType === "calcular" || dialogType === "preview") && (
            <div className="space-y-4">
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Calculando cuotas con tasas progresivas...</p>
                </div>
              ) : calculoResultado ? (
                <Tabs defaultValue="resumen" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="resumen">Resumen por Ramo</TabsTrigger>
                    <TabsTrigger value="empleados">Detalle Empleados</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="resumen" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">Cuota Obrero</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-bold">{formatCurrency(calculoResultado.totalesObrero)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">Cuota Patronal</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-bold">{formatCurrency(calculoResultado.totalesPatronal)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">Total a Pagar</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-bold text-primary">{formatCurrency(calculoResultado.totalesGeneral)}</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Separator />
                    
                    <ScrollArea className="h-[250px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ramo de Seguro</TableHead>
                            <TableHead className="text-right">Obrero</TableHead>
                            <TableHead className="text-right">Patronal</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculoResultado.desglosePorRamo.map((ramo) => (
                            <TableRow key={ramo.ramo}>
                              <TableCell className="font-medium capitalize">
                                {ramo.ramo.replace(/_/g, ' ')}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(ramo.obrero)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(ramo.patronal)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatCurrency(ramo.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="empleados">
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empleado</TableHead>
                            <TableHead className="text-right">SBC Diario</TableHead>
                            <TableHead className="text-right">Días</TableHead>
                            <TableHead className="text-right">Obrero</TableHead>
                            <TableHead className="text-right">Patronal</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculoResultado.empleados.slice(0, 50).map((emp) => (
                            <TableRow key={emp.empleadoId}>
                              <TableCell className="font-medium text-xs">
                                {emp.empleadoId.slice(0, 8)}...
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(emp.sbcDiario)}
                              </TableCell>
                              <TableCell className="text-right">
                                {emp.diasCotizados}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(emp.totalObrero)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(emp.totalPatronal)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatCurrency(emp.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {calculoResultado.empleados.length > 50 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
                                ... y {calculoResultado.empleados.length - 50} empleados más
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay datos de cálculo disponibles</p>
              )}
            </div>
          )}
          
          {dialogType === "pago" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fechaPago">Fecha de Pago</Label>
                <Input
                  id="fechaPago"
                  type="date"
                  value={pagoData.fechaPago}
                  onChange={(e) => setPagoData({ ...pagoData, fechaPago: e.target.value })}
                  data-testid="input-fecha-pago"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="importePagadoDecimal">Importe Pagado</Label>
                <Input
                  id="importePagadoDecimal"
                  type="number"
                  step="0.01"
                  value={pagoData.importePagadoDecimal}
                  onChange={(e) => setPagoData({ ...pagoData, importePagadoDecimal: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-importe-pagado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineaCaptura">Línea de Captura</Label>
                <Input
                  id="lineaCaptura"
                  value={pagoData.lineaCaptura}
                  onChange={(e) => setPagoData({ ...pagoData, lineaCaptura: e.target.value })}
                  data-testid="input-linea-captura"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bancoRecaudador">Banco Recaudador</Label>
                <Input
                  id="bancoRecaudador"
                  value={pagoData.bancoRecaudador}
                  onChange={(e) => setPagoData({ ...pagoData, bancoRecaudador: e.target.value })}
                  data-testid="input-banco-recaudador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folioComprobante">Folio del Comprobante</Label>
                <Input
                  id="folioComprobante"
                  value={pagoData.folioComprobante}
                  onChange={(e) => setPagoData({ ...pagoData, folioComprobante: e.target.value })}
                  data-testid="input-folio-comprobante"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            {(dialogType === "calcular" || dialogType === "preview") && calculoResultado && (
              <Button variant="outline" onClick={downloadCSV} data-testid="button-download-csv">
                <Download className="h-4 w-4 mr-2" />
                Descargar CSV
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {dialogType === "preview" ? "Cerrar" : "Cancelar"}
            </Button>
            {dialogType !== "preview" && (
              <Button 
                onClick={handleDialogConfirm}
                disabled={
                  (dialogType === "calcular" && (isCalculating || !calculoResultado)) ||
                  (dialogType === "pago" && (!pagoData.fechaPago || !pagoData.importePagadoDecimal))
                }
                data-testid="button-dialog-confirm"
              >
                {isCalculating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {dialogType === "calcular" ? "Guardar Cálculo" : "Confirmar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
