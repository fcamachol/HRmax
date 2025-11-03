import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ConceptoLiquidacion {
  concepto: string;
  formula: string;
  base: number;
  cantidad: number;
  monto: number;
}

interface ResultadoCalculo {
  conceptos: ConceptoLiquidacion[];
  total: number;
  tipo: 'finiquito' | 'liquidacion';
  yearsWorked: number;
}

export function SimuladorLiquidaciones() {
  const [empleadoNombre, setEmpleadoNombre] = useState("");
  const [salarioMensual, setSalarioMensual] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaSalida, setFechasSalida] = useState("");
  const [tipoCalculo, setTipoCalculo] = useState<'finiquito' | 'liquidacion'>('finiquito');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calcularMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/legal/calculate-settlement", data);
      return response;
    },
    onSuccess: (data) => {
      setResultado(data as ResultadoCalculo);
      toast({
        title: "Cálculo completado",
        description: `${tipoCalculo === 'liquidacion' ? 'Liquidación' : 'Finiquito'} calculado exitosamente`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al calcular",
        variant: "destructive",
      });
    },
  });

  const guardarSimulacionMutation = useMutation({
    mutationFn: async () => {
      if (!resultado) return;
      
      const salario = parseFloat(salarioMensual);
      const salarioDiario = salario / 30;
      
      const settlementData = {
        settlementType: resultado.tipo,
        employeeName: empleadoNombre || "Simulación",
        salary: salario.toString(),
        startDate: fechaIngreso,
        endDate: fechaSalida,
        yearsWorked: resultado.yearsWorked.toString(),
        concepts: resultado.conceptos,
        totalAmount: resultado.total.toString(),
        mode: 'simulacion',
        legalCaseId: null,
      };
      
      return await apiRequest("POST", "/api/legal/settlements", settlementData);
    },
    onSuccess: () => {
      toast({
        title: "Simulación guardada",
        description: "La simulación ha sido guardada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar simulación",
        variant: "destructive",
      });
    },
  });

  const handleCalcular = () => {
    if (!salarioMensual || !fechaIngreso || !fechaSalida) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const salario = parseFloat(salarioMensual);
    const salarioDiario = salario / 30;

    calcularMutation.mutate({
      salarioDiario: salarioDiario.toString(),
      salarioMensual: salario.toString(),
      fechaIngreso,
      fechaSalida,
      tipo: tipoCalculo,
    });
  };

  const handleGuardarSimulacion = () => {
    if (!resultado) return;
    guardarSimulacionMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Liquidaciones y Finiquitos</CardTitle>
          <CardDescription>
            Calcula liquidaciones y finiquitos según la Ley Federal del Trabajo de México
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empleado-nombre">Nombre del Empleado (Opcional)</Label>
              <Input
                id="empleado-nombre"
                placeholder="Ej: Juan Pérez"
                value={empleadoNombre}
                onChange={(e) => setEmpleadoNombre(e.target.value)}
                data-testid="input-empleado-nombre"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salario-mensual">Salario Mensual *</Label>
              <Input
                id="salario-mensual"
                type="number"
                placeholder="Ej: 15000"
                value={salarioMensual}
                onChange={(e) => setSalarioMensual(e.target.value)}
                data-testid="input-salario-mensual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha-ingreso">Fecha de Ingreso *</Label>
              <Input
                id="fecha-ingreso"
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                data-testid="input-fecha-ingreso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha-salida">Fecha de Salida *</Label>
              <Input
                id="fecha-salida"
                type="date"
                value={fechaSalida}
                onChange={(e) => setFechasSalida(e.target.value)}
                data-testid="input-fecha-salida"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo-calculo">Tipo de Cálculo *</Label>
              <Select value={tipoCalculo} onValueChange={(value: any) => setTipoCalculo(value)}>
                <SelectTrigger id="tipo-calculo" data-testid="select-tipo-calculo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finiquito">Finiquito (Renuncia Voluntaria)</SelectItem>
                  <SelectItem value="liquidacion">Liquidación (Despido Injustificado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCalcular}
              disabled={calcularMutation.isPending}
              data-testid="button-calcular"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {calcularMutation.isPending ? "Calculando..." : "Calcular"}
            </Button>
            
            {resultado && (
              <Button
                variant="outline"
                onClick={handleGuardarSimulacion}
                disabled={guardarSimulacionMutation.isPending}
                data-testid="button-guardar-simulacion"
              >
                <Save className="h-4 w-4 mr-2" />
                {guardarSimulacionMutation.isPending ? "Guardando..." : "Guardar Simulación"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Resultado del Cálculo - {resultado.tipo === 'liquidacion' ? 'Liquidación' : 'Finiquito'}
                </CardTitle>
                <CardDescription>
                  Antigüedad: {resultado.yearsWorked.toFixed(2)} años
                </CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                Total: {formatCurrency(resultado.total)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Fórmula</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.conceptos.map((concepto, index) => (
                  <TableRow key={index} data-testid={`row-concepto-${index}`}>
                    <TableCell className="font-medium">{concepto.concepto}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {concepto.formula}
                    </TableCell>
                    <TableCell className="text-right">{concepto.cantidad.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(concepto.monto)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-right">TOTAL A PAGAR:</TableCell>
                  <TableCell className="text-right text-lg">{formatCurrency(resultado.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-4 p-4 bg-muted rounded-md text-sm space-y-2">
              <p className="font-semibold">Información Legal:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {resultado.tipo === 'liquidacion' ? (
                  <>
                    <li>Liquidación por despido injustificado según LFT Art. 48-50</li>
                    <li>Incluye indemnización constitucional de 3 meses de salario</li>
                    <li>Prima de antigüedad de 12 días por año trabajado</li>
                    <li>20 días de salario por año trabajado</li>
                  </>
                ) : (
                  <>
                    <li>Finiquito por renuncia voluntaria</li>
                    <li>Incluye partes proporcionales de prestaciones</li>
                    <li>No incluye indemnización ni prima de antigüedad</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
