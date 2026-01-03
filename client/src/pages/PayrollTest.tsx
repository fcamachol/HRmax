import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calculator, User, Calendar, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestIncident {
  tipo: string;
  cantidad: number;
  datos?: any;
}

interface PayrollResult {
  empleadoId: string;
  periodoId: string;
  percepciones: Array<{
    codigo: string;
    nombre: string;
    monto: number;
    gravado: number;
    exento: number;
  }>;
  deducciones: Array<{
    codigo: string;
    nombre: string;
    monto: number;
  }>;
  otrosPagos: Array<{
    codigo: string;
    nombre: string;
    monto: number;
  }>;
  totalPercepciones: number;
  totalDeducciones: number;
  netoPagar: number;
  auditTrail: Array<{
    phase: string;
    action: string;
    timestamp: string;
    duration?: number;
  }>;
}

export default function PayrollTest() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PayrollResult | null>(null);

  // Employee data
  const [salarioDiario, setSalarioDiario] = useState("600");
  const [salarioDiarioIntegrado, setSalarioDiarioIntegrado] = useState("690");
  const [estatus, setEstatus] = useState("activo");

  // Period data
  const [frecuencia, setFrecuencia] = useState<"quincenal" | "mensual" | "semanal">("quincenal");
  const [diasLaborales, setDiasLaborales] = useState("11");
  const [anio, setAnio] = useState("2026");
  const [mes, setMes] = useState("1");

  // Incidents
  const [incidents, setIncidents] = useState<TestIncident[]>([]);
  const [incidentTipo, setIncidentTipo] = useState("");
  const [incidentCantidad, setIncidentCantidad] = useState("");
  const [horasDobles, setHorasDobles] = useState("");
  const [horasTriples, setHorasTriples] = useState("");

  const addIncident = () => {
    if (!incidentTipo || !incidentCantidad) {
      toast({
        title: "Error",
        description: "Por favor completa el tipo y cantidad de la incidencia",
        variant: "destructive",
      });
      return;
    }

    const newIncident: TestIncident = {
      tipo: incidentTipo,
      cantidad: parseFloat(incidentCantidad),
    };

    if (incidentTipo === "horas_extra") {
      newIncident.datos = {
        horasDobles: parseFloat(horasDobles) || 0,
        horasTriples: parseFloat(horasTriples) || 0,
      };
    }

    setIncidents([...incidents, newIncident]);
    setIncidentTipo("");
    setIncidentCantidad("");
    setHorasDobles("");
    setHorasTriples("");

    toast({
      title: "Incidencia agregada",
      description: `${incidentTipo} - ${incidentCantidad} agregado`,
    });
  };

  const removeIncident = (index: number) => {
    setIncidents(incidents.filter((_, i) => i !== index));
  };

  const calculatePayroll = async () => {
    setLoading(true);
    setResult(null);

    try {
      const employeeData = {
        id: "test-emp-001",
        numeroEmpleado: "0001",
        nombre: "Juan",
        apellidoPaterno: "Pérez",
        apellidoMaterno: "García",
        rfc: "PEGJ850101XXX",
        curp: "PEGJ850101HDFRNN01",
        nss: "12345678901",
        salarioDiario: parseFloat(salarioDiario),
        salarioDiarioIntegrado: parseFloat(salarioDiarioIntegrado),
        estatus,
        clienteId: "test-client",
        empresaId: "test-empresa",
        centroTrabajoId: "test-ct",
      };

      const periodData = {
        id: "test-period-001",
        clienteId: "test-client",
        nombre: `${frecuencia} ${mes}/${anio}`,
        frecuencia,
        tipoPeriodo: frecuencia,
        anio: parseInt(anio),
        mes: parseInt(mes),
        numero: 1,
        fechaInicio: `${anio}-${mes.padStart(2, '0')}-01`,
        fechaFin: `${anio}-${mes.padStart(2, '0')}-15`,
        fechaPago: `${anio}-${mes.padStart(2, '0')}-16`,
        diasLaborales: parseInt(diasLaborales),
        diasPeriodo: frecuencia === "quincenal" ? 15 : frecuencia === "mensual" ? 30 : 7,
        estatus: "abierto",
        tipo: "ordinaria",
      };

      const incidentsData = incidents.map((inc, idx) => ({
        id: `test-inc-${idx}`,
        empleadoId: "test-emp-001",
        periodoId: "test-period-001",
        tipo: inc.tipo,
        fecha: periodData.fechaInicio,
        cantidad: inc.cantidad,
        datos: inc.datos,
        aprobado: true,
        clienteId: "test-client",
      }));

      const response = await fetch("/api/payroll/test-calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee: employeeData,
          period: periodData,
          incidents: incidentsData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al calcular nómina");
      }

      const data = await response.json();
      setResult(data);

      toast({
        title: "Cálculo completado",
        description: `Neto a pagar: $${data.netoPagar.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: string) => {
    switch (preset) {
      case "basic":
        setSalarioDiario("600");
        setSalarioDiarioIntegrado("690");
        setEstatus("activo");
        setFrecuencia("quincenal");
        setDiasLaborales("11");
        setIncidents([]);
        break;
      case "overtime":
        setSalarioDiario("600");
        setSalarioDiarioIntegrado("690");
        setEstatus("activo");
        setFrecuencia("quincenal");
        setDiasLaborales("11");
        setIncidents([
          {
            tipo: "horas_extra",
            cantidad: 5,
            datos: { horasDobles: 5, horasTriples: 0 },
          },
        ]);
        break;
      case "absence":
        setSalarioDiario("600");
        setSalarioDiarioIntegrado("690");
        setEstatus("activo");
        setFrecuencia("quincenal");
        setDiasLaborales("9");
        setIncidents([
          {
            tipo: "falta",
            cantidad: 2,
          },
        ]);
        break;
      case "high-salary":
        setSalarioDiario("2000");
        setSalarioDiarioIntegrado("2300");
        setEstatus("activo");
        setFrecuencia("quincenal");
        setDiasLaborales("11");
        setIncidents([]);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Calculator className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HRMax Payroll Engine V2
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Test Environment - No Login Required
          </p>
          <Badge variant="outline" className="mt-2">
            2026 Fiscal Compliance • NOI-Level Accuracy
          </Badge>
        </div>

        {/* Quick Presets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Escenarios de Prueba Rápidos
            </CardTitle>
            <CardDescription>
              Carga datos de ejemplo para probar diferentes escenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => loadPreset("basic")}>
                Básico
              </Button>
              <Button variant="outline" onClick={() => loadPreset("overtime")}>
                Con Horas Extra
              </Button>
              <Button variant="outline" onClick={() => loadPreset("absence")}>
                Con Faltas
              </Button>
              <Button variant="outline" onClick={() => loadPreset("high-salary")}>
                Salario Alto
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Employee Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Datos del Empleado
                </CardTitle>
                <CardDescription>
                  Configuración básica del empleado de prueba
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salario">Salario Diario ($)</Label>
                  <Input
                    id="salario"
                    type="number"
                    step="0.01"
                    value={salarioDiario}
                    onChange={(e) => setSalarioDiario(e.target.value)}
                    placeholder="600.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sdi">Salario Diario Integrado ($)</Label>
                  <Input
                    id="sdi"
                    type="number"
                    step="0.01"
                    value={salarioDiarioIntegrado}
                    onChange={(e) => setSalarioDiarioIntegrado(e.target.value)}
                    placeholder="690.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Salario + prestaciones integradas (típicamente 115% del salario base)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estatus">Estatus</Label>
                  <Select value={estatus} onValueChange={setEstatus}>
                    <SelectTrigger id="estatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Period Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Datos del Periodo
                </CardTitle>
                <CardDescription>
                  Configuración del periodo de nómina
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="anio">Año</Label>
                    <Input
                      id="anio"
                      type="number"
                      value={anio}
                      onChange={(e) => setAnio(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mes">Mes</Label>
                    <Input
                      id="mes"
                      type="number"
                      min="1"
                      max="12"
                      value={mes}
                      onChange={(e) => setMes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frecuencia">Frecuencia</Label>
                  <Select value={frecuencia} onValueChange={(v: any) => setFrecuencia(v)}>
                    <SelectTrigger id="frecuencia">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dias">Días Laborales</Label>
                  <Input
                    id="dias"
                    type="number"
                    value={diasLaborales}
                    onChange={(e) => setDiasLaborales(e.target.value)}
                    placeholder="11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quincenal: 11-12 días • Mensual: 22-24 días • Semanal: 5-6 días
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Incidents */}
            <Card>
              <CardHeader>
                <CardTitle>Incidencias</CardTitle>
                <CardDescription>
                  Agrega incidencias como horas extra, faltas, etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="incidentTipo">Tipo de Incidencia</Label>
                  <Select value={incidentTipo} onValueChange={setIncidentTipo}>
                    <SelectTrigger id="incidentTipo">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horas_extra">Horas Extra</SelectItem>
                      <SelectItem value="falta">Faltas</SelectItem>
                      <SelectItem value="prima_dominical">Prima Dominical</SelectItem>
                      <SelectItem value="vales_despensa">Vales de Despensa</SelectItem>
                      <SelectItem value="incapacidad">Incapacidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {incidentTipo === "horas_extra" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="horasDobles">Horas Dobles (200%)</Label>
                        <Input
                          id="horasDobles"
                          type="number"
                          value={horasDobles}
                          onChange={(e) => setHorasDobles(e.target.value)}
                          placeholder="5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="horasTriples">Horas Triples (300%)</Label>
                        <Input
                          id="horasTriples"
                          type="number"
                          value={horasTriples}
                          onChange={(e) => setHorasTriples(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incidentCantidad">Total de Horas</Label>
                      <Input
                        id="incidentCantidad"
                        type="number"
                        value={incidentCantidad}
                        onChange={(e) => setIncidentCantidad(e.target.value)}
                        placeholder="5"
                      />
                    </div>
                  </>
                )}

                {incidentTipo && incidentTipo !== "horas_extra" && (
                  <div className="space-y-2">
                    <Label htmlFor="incidentCantidad">Cantidad</Label>
                    <Input
                      id="incidentCantidad"
                      type="number"
                      value={incidentCantidad}
                      onChange={(e) => setIncidentCantidad(e.target.value)}
                      placeholder="2"
                    />
                  </div>
                )}

                <Button onClick={addIncident} className="w-full" disabled={!incidentTipo}>
                  Agregar Incidencia
                </Button>

                {incidents.length > 0 && (
                  <div className="space-y-2">
                    <Label>Incidencias agregadas:</Label>
                    <div className="space-y-2">
                      {incidents.map((inc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{inc.tipo}</p>
                            <p className="text-sm text-muted-foreground">
                              Cantidad: {inc.cantidad}
                              {inc.datos && ` (Dobles: ${inc.datos.horasDobles}, Triples: ${inc.datos.horasTriples})`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIncident(idx)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calculate Button */}
            <Button
              onClick={calculatePayroll}
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5 mr-2" />
                  Calcular Nómina
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Summary */}
                <Card className="border-2 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      Resultado del Cálculo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Percepciones</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${result.totalPercepciones.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Deducciones</p>
                        <p className="text-2xl font-bold text-red-600">
                          ${result.totalDeducciones.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Neto a Pagar</p>
                        <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ${result.netoPagar.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Details */}
                <Tabs defaultValue="percepciones">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="percepciones">
                      Percepciones ({result.percepciones.length})
                    </TabsTrigger>
                    <TabsTrigger value="deducciones">
                      Deducciones ({result.deducciones.length})
                    </TabsTrigger>
                    <TabsTrigger value="audit">Auditoría</TabsTrigger>
                  </TabsList>

                  <TabsContent value="percepciones" className="space-y-2">
                    <Card>
                      <CardContent className="pt-6">
                        {result.percepciones.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-3 border-b last:border-0"
                          >
                            <div>
                              <p className="font-medium">{p.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                Código: {p.codigo} | Gravado: ${p.gravado.toFixed(2)} | Exento: ${p.exento.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-bold text-green-600">
                              ${p.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="deducciones" className="space-y-2">
                    <Card>
                      <CardContent className="pt-6">
                        {result.deducciones.map((d, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-3 border-b last:border-0"
                          >
                            <div>
                              <p className="font-medium">{d.nombre}</p>
                              <p className="text-xs text-muted-foreground">Código: {d.codigo}</p>
                            </div>
                            <p className="font-bold text-red-600">
                              -${d.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="audit" className="space-y-2">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2 max-h-96 overflow-auto">
                          {result.auditTrail.map((entry, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-muted rounded-lg text-sm"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge variant="outline" className="mb-1">
                                    {entry.phase}
                                  </Badge>
                                  <p className="font-medium">{entry.action}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(entry.timestamp).toLocaleString("es-MX")}
                                  </p>
                                </div>
                                {entry.duration && (
                                  <Badge variant="secondary">{entry.duration}ms</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center space-y-4 py-12">
                  <Calculator className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Listo para calcular</h3>
                    <p className="text-muted-foreground">
                      Completa los datos y presiona "Calcular Nómina"
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ambiente de Prueba</AlertTitle>
          <AlertDescription>
            Este es un ambiente de prueba del HRMax Payroll Engine V2. Los datos ingresados no se guardan
            y no afectan ningún sistema de producción. Utiliza esta herramienta para probar cálculos
            y validar la precisión del motor de nómina.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
