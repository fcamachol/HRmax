import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Edit, Save, X, Plus } from "lucide-react";
import { DemoCalculoNomina } from "@/components/DemoCalculoNomina";
import { EditISRDialog } from "@/components/EditISRDialog";
import { PrestacionesPorPuestoManager } from "@/components/configuracion/PrestacionesPorPuestoManager";

type Periodicidad = "diaria" | "semanal" | "decenal" | "quincenal" | "mensual";

export default function Configuration() {
  const [isEditingUMA, setIsEditingUMA] = useState(false);
  const [isEditingSalarioMinimo, setIsEditingSalarioMinimo] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPeriodicidad, setCurrentPeriodicidad] = useState<Periodicidad>("mensual");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  // ISR Tables 2025 - All periodicities
  const isrDiaria = [
    { limiteInferior: 0.01, limiteSuperior: 298.42, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
    { limiteInferior: 298.43, limiteSuperior: 2532.96, cuotaFija: 5.73, porcentajeExcedente: 6.40 },
    { limiteInferior: 2532.97, limiteSuperior: 4451.20, cuotaFija: 148.74, porcentajeExcedente: 10.88 },
    { limiteInferior: 4451.21, limiteSuperior: 5174.24, cuotaFija: 357.53, porcentajeExcedente: 16.00 },
    { limiteInferior: 5174.25, limiteSuperior: 6195.06, cuotaFija: 473.22, porcentajeExcedente: 17.92 },
    { limiteInferior: 6195.07, limiteSuperior: 12494.60, cuotaFija: 656.19, porcentajeExcedente: 21.36 },
    { limiteInferior: 12494.61, limiteSuperior: 19693.12, cuotaFija: 2001.64, porcentajeExcedente: 23.52 },
    { limiteInferior: 19693.13, limiteSuperior: 37597.18, cuotaFija: 3694.61, porcentajeExcedente: 30.00 },
    { limiteInferior: 37597.19, limiteSuperior: 50130.12, cuotaFija: 9065.86, porcentajeExcedente: 32.00 },
    { limiteInferior: 50130.13, limiteSuperior: 150389.67, cuotaFija: 13076.39, porcentajeExcedente: 34.00 },
    { limiteInferior: 150389.68, limiteSuperior: null, cuotaFija: 47164.63, porcentajeExcedente: 35.00 },
  ];

  const isrSemanal = [
    { limiteInferior: 0.01, limiteSuperior: 2088.91, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
    { limiteInferior: 2088.92, limiteSuperior: 17730.72, cuotaFija: 40.11, porcentajeExcedente: 6.40 },
    { limiteInferior: 17730.73, limiteSuperior: 31158.22, cuotaFija: 1041.19, porcentajeExcedente: 10.88 },
    { limiteInferior: 31158.23, limiteSuperior: 36219.66, cuotaFija: 2502.69, porcentajeExcedente: 16.00 },
    { limiteInferior: 36219.67, limiteSuperior: 43364.94, cuotaFija: 3312.51, porcentajeExcedente: 17.92 },
    { limiteInferior: 43364.95, limiteSuperior: 87461.96, cuotaFija: 4593.31, porcentajeExcedente: 21.36 },
    { limiteInferior: 87461.97, limiteSuperior: 137851.64, cuotaFija: 14011.47, porcentajeExcedente: 23.52 },
    { limiteInferior: 137851.65, limiteSuperior: 263180.25, cuotaFija: 25862.30, porcentajeExcedente: 30.00 },
    { limiteInferior: 263180.26, limiteSuperior: 350909.24, cuotaFija: 63460.99, porcentajeExcedente: 32.00 },
    { limiteInferior: 350909.25, limiteSuperior: 1052727.71, cuotaFija: 91534.24, porcentajeExcedente: 34.00 },
    { limiteInferior: 1052727.72, limiteSuperior: null, cuotaFija: 330152.37, porcentajeExcedente: 35.00 },
  ];

  const isrDecenal = [
    { limiteInferior: 0.01, limiteSuperior: 2984.16, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
    { limiteInferior: 2984.17, limiteSuperior: 25329.60, cuotaFija: 57.30, porcentajeExcedente: 6.40 },
    { limiteInferior: 25329.61, limiteSuperior: 44512.02, cuotaFija: 1487.41, porcentajeExcedente: 10.88 },
    { limiteInferior: 44512.03, limiteSuperior: 51742.37, cuotaFija: 3575.27, porcentajeExcedente: 16.00 },
    { limiteInferior: 51742.38, limiteSuperior: 61950.63, cuotaFija: 4732.16, porcentajeExcedente: 17.92 },
    { limiteInferior: 61950.64, limiteSuperior: 124945.96, cuotaFija: 6561.87, porcentajeExcedente: 21.36 },
    { limiteInferior: 124945.97, limiteSuperior: 196931.20, cuotaFija: 20016.39, porcentajeExcedente: 23.52 },
    { limiteInferior: 196931.21, limiteSuperior: 375971.79, cuotaFija: 36946.14, porcentajeExcedente: 30.00 },
    { limiteInferior: 375971.80, limiteSuperior: 501301.20, cuotaFija: 90658.56, porcentajeExcedente: 32.00 },
    { limiteInferior: 501301.21, limiteSuperior: 1503896.73, cuotaFija: 130763.91, porcentajeExcedente: 34.00 },
    { limiteInferior: 1503896.74, limiteSuperior: null, cuotaFija: 471646.25, porcentajeExcedente: 35.00 },
  ];

  const isrQuincenal = [
    { limiteInferior: 0.01, limiteSuperior: 4476.25, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
    { limiteInferior: 4476.26, limiteSuperior: 37992.28, cuotaFija: 85.94, porcentajeExcedente: 6.40 },
    { limiteInferior: 37992.29, limiteSuperior: 66768.04, cuotaFija: 2230.97, porcentajeExcedente: 10.88 },
    { limiteInferior: 66768.05, limiteSuperior: 77614.90, cuotaFija: 5361.78, porcentajeExcedente: 16.00 },
    { limiteInferior: 77614.91, limiteSuperior: 92926.29, cuotaFija: 7097.27, porcentajeExcedente: 17.92 },
    { limiteInferior: 92926.30, limiteSuperior: 187418.94, cuotaFija: 9841.07, porcentajeExcedente: 21.36 },
    { limiteInferior: 187418.95, limiteSuperior: 295398.00, cuotaFija: 30024.70, porcentajeExcedente: 23.52 },
    { limiteInferior: 295398.01, limiteSuperior: 563963.42, cuotaFija: 55421.37, porcentajeExcedente: 30.00 },
    { limiteInferior: 563963.43, limiteSuperior: 751951.23, cuotaFija: 135990.99, porcentajeExcedente: 32.00 },
    { limiteInferior: 751951.24, limiteSuperior: 2255853.69, cuotaFija: 196147.08, porcentajeExcedente: 34.00 },
    { limiteInferior: 2255853.70, limiteSuperior: null, cuotaFija: 707473.92, porcentajeExcedente: 35.00 },
  ];

  const isrMensual = [
    { limiteInferior: 0.01, limiteSuperior: 8952.49, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
    { limiteInferior: 8952.50, limiteSuperior: 75984.55, cuotaFija: 171.88, porcentajeExcedente: 6.40 },
    { limiteInferior: 75984.56, limiteSuperior: 133536.07, cuotaFija: 4461.94, porcentajeExcedente: 10.88 },
    { limiteInferior: 133536.08, limiteSuperior: 155229.80, cuotaFija: 10723.55, porcentajeExcedente: 16.00 },
    { limiteInferior: 155229.81, limiteSuperior: 185852.57, cuotaFija: 14194.54, porcentajeExcedente: 17.92 },
    { limiteInferior: 185852.58, limiteSuperior: 374837.88, cuotaFija: 19682.13, porcentajeExcedente: 21.36 },
    { limiteInferior: 374837.89, limiteSuperior: 590795.99, cuotaFija: 60049.40, porcentajeExcedente: 23.52 },
    { limiteInferior: 590796.00, limiteSuperior: 1127926.84, cuotaFija: 110842.74, porcentajeExcedente: 30.00 },
    { limiteInferior: 1127926.85, limiteSuperior: 1503902.46, cuotaFija: 271981.99, porcentajeExcedente: 32.00 },
    { limiteInferior: 1503902.47, limiteSuperior: 4511707.37, cuotaFija: 392294.17, porcentajeExcedente: 34.00 },
    { limiteInferior: 4511707.38, limiteSuperior: null, cuotaFija: 1414947.85, porcentajeExcedente: 35.00 },
  ];

  // Subsidio al Empleo 2025
  const subsidioEmpleo = {
    mensual: 475.00,
    quincenal: 237.50,
    semanal: 109.34,
    diario: 15.62,
  };

  // IMSS Contribution Rates 2025
  const imssRates = [
    {
      concepto: "Enfermedades y Maternidad - Cuota Fija",
      patron: "20.40% de 1 UMA",
      trabajador: "0%",
      nota: "Sobre 1 UMA mensual",
    },
    {
      concepto: "Enfermedades y Maternidad - Excedente",
      patron: "1.10%",
      trabajador: "0.40%",
      nota: "Si SBC > 3 salarios mínimos",
    },
    {
      concepto: "Enfermedades y Maternidad - Prestaciones en Dinero",
      patron: "0.70%",
      trabajador: "0.25%",
      nota: "Sobre SBC",
    },
    {
      concepto: "Enfermedades y Maternidad - Gastos Médicos Pensionados",
      patron: "1.05%",
      trabajador: "0.375%",
      nota: "Sobre SBC",
    },
    {
      concepto: "Invalidez y Vida",
      patron: "1.75%",
      trabajador: "0.625%",
      nota: "Sobre SBC",
    },
    {
      concepto: "Retiro",
      patron: "2.00%",
      trabajador: "0%",
      nota: "Sobre SBC",
    },
    {
      concepto: "Guarderías y Prestaciones Sociales",
      patron: "1.00%",
      trabajador: "0%",
      nota: "Sobre SBC",
    },
  ];

  // Riesgos de Trabajo (variable)
  const riesgosTrabajo = [
    { clase: "I - Riesgo Mínimo", porcentaje: "0.54355%" },
    { clase: "II - Riesgo Bajo", porcentaje: "1.13%" },
    { clase: "III - Riesgo Medio", porcentaje: "2.59%" },
    { clase: "IV - Riesgo Alto", porcentaje: "4.65%" },
    { clase: "V - Riesgo Máximo", porcentaje: "7.58%" },
  ];

  // Cesantía en Edad Avanzada y Vejez (CEAV) - Escalonada
  const ceav = [
    { rango: "Hasta 1.00 SM", patronal2025: "3.150%", trabajador: "1.125%" },
    { rango: "1.01 a 1.50 UMA", patronal2025: "3.281%", trabajador: "1.125%" },
    { rango: "1.51 a 2.00 UMA", patronal2025: "3.575%", trabajador: "1.125%" },
    { rango: "2.01 a 2.50 UMA", patronal2025: "3.751%", trabajador: "1.125%" },
    { rango: "2.51 a 3.00 UMA", patronal2025: "3.869%", trabajador: "1.125%" },
    { rango: "3.01 a 3.50 UMA", patronal2025: "3.953%", trabajador: "1.125%" },
    { rango: "3.51 a 4.00 UMA", patronal2025: "4.016%", trabajador: "1.125%" },
    { rango: "4.01 UMA o más", patronal2025: "4.241%", trabajador: "1.125%" },
  ];

  // Previsión Social Limits
  const previsionSocial = [
    { concepto: "Vales de Despensa", limiteExento: "40% del salario mínimo diario (~$3,345.60 MXN/mes)", base: "Diario" },
    { concepto: "Aguinaldo", limiteExento: "30 UMAs (~$103,183.80 MXN)", base: "Anual" },
    { concepto: "Prima Vacacional", limiteExento: "15 días de salario mínimo", base: "Anual" },
    { concepto: "Fondo de Ahorro", limiteExento: "Sujeto al tope general (1 UMA anual si ingreso > 7 UMAs)", base: "Anual" },
    { concepto: "Previsión Social General", limiteExento: "1 UMA anual ($41,273.52) si ingreso total > 7 UMAs ($288,914.64)", base: "Anual" },
  ];

  // UMA and Minimum Wage 2025
  const [umaValues, setUmaValues] = useState({
    diaria: 113.14,
    mensual: 3439.46,
    anual: 41273.52,
  });

  const [salarioMinimo, setSalarioMinimo] = useState({
    zonaGeneral: 278.80,
    zonaFrontera: 419.88,
  });

  // Subsidio al Empleo - Tablas Escalonadas 2025
  const subsidioDiaria = [
    { limiteInferior: 0.01, limiteSuperior: 51.95, subsidio: 15.62 },
    { limiteInferior: 51.96, limiteSuperior: 440.58, subsidio: 15.61 },
    { limiteInferior: 440.59, limiteSuperior: 774.38, subsidio: 15.05 },
    { limiteInferior: 774.39, limiteSuperior: 902.15, subsidio: 14.27 },
    { limiteInferior: 902.16, limiteSuperior: 2653.38, subsidio: 13.88 },
    { limiteInferior: 2653.39, limiteSuperior: 3084.23, subsidio: 11.88 },
    { limiteInferior: 3084.24, limiteSuperior: 3746.15, subsidio: 9.49 },
    { limiteInferior: 3746.16, limiteSuperior: 4470.00, subsidio: 6.16 },
    { limiteInferior: 4470.01, limiteSuperior: null, subsidio: 0 },
  ];

  const subsidioSemanal = [
    { limiteInferior: 0.01, limiteSuperior: 363.65, subsidio: 109.34 },
    { limiteInferior: 363.66, limiteSuperior: 3084.06, subsidio: 109.27 },
    { limiteInferior: 3084.07, limiteSuperior: 5420.66, subsidio: 105.35 },
    { limiteInferior: 5420.67, limiteSuperior: 6315.05, subsidio: 99.89 },
    { limiteInferior: 6315.06, limiteSuperior: 18573.66, subsidio: 97.16 },
    { limiteInferior: 18573.67, limiteSuperior: 21589.61, subsidio: 83.16 },
    { limiteInferior: 21589.62, limiteSuperior: 26223.05, subsidio: 66.43 },
    { limiteInferior: 26223.06, limiteSuperior: 31290.00, subsidio: 43.12 },
    { limiteInferior: 31290.01, limiteSuperior: null, subsidio: 0 },
  ];

  const subsidioDecenal = [
    { limiteInferior: 0.01, limiteSuperior: 519.50, subsidio: 156.20 },
    { limiteInferior: 519.51, limiteSuperior: 4405.80, subsidio: 156.10 },
    { limiteInferior: 4405.81, limiteSuperior: 7743.80, subsidio: 150.50 },
    { limiteInferior: 7743.81, limiteSuperior: 9021.50, subsidio: 142.70 },
    { limiteInferior: 9021.51, limiteSuperior: 26533.80, subsidio: 138.80 },
    { limiteInferior: 26533.81, limiteSuperior: 30842.30, subsidio: 118.80 },
    { limiteInferior: 30842.31, limiteSuperior: 37461.50, subsidio: 94.90 },
    { limiteInferior: 37461.51, limiteSuperior: 44700.00, subsidio: 61.60 },
    { limiteInferior: 44700.01, limiteSuperior: null, subsidio: 0 },
  ];

  const subsidioQuincenal = [
    { limiteInferior: 0.01, limiteSuperior: 779.25, subsidio: 237.50 },
    { limiteInferior: 779.26, limiteSuperior: 6608.70, subsidio: 237.40 },
    { limiteInferior: 6608.71, limiteSuperior: 11615.70, subsidio: 228.95 },
    { limiteInferior: 11615.71, limiteSuperior: 13532.25, subsidio: 217.05 },
    { limiteInferior: 13532.26, limiteSuperior: 39800.70, subsidio: 211.20 },
    { limiteInferior: 39800.71, limiteSuperior: 46263.45, subsidio: 180.90 },
    { limiteInferior: 46263.46, limiteSuperior: 56192.25, subsidio: 144.45 },
    { limiteInferior: 56192.26, limiteSuperior: 67050.00, subsidio: 93.80 },
    { limiteInferior: 67050.01, limiteSuperior: null, subsidio: 0 },
  ];

  const subsidioMensual = [
    { limiteInferior: 0.01, limiteSuperior: 1558.50, subsidio: 475.00 },
    { limiteInferior: 1558.51, limiteSuperior: 13217.40, subsidio: 474.80 },
    { limiteInferior: 13217.41, limiteSuperior: 23231.40, subsidio: 457.90 },
    { limiteInferior: 23231.41, limiteSuperior: 27064.50, subsidio: 434.10 },
    { limiteInferior: 27064.51, limiteSuperior: 79601.40, subsidio: 422.40 },
    { limiteInferior: 79601.41, limiteSuperior: 92526.90, subsidio: 361.80 },
    { limiteInferior: 92526.91, limiteSuperior: 112384.50, subsidio: 288.90 },
    { limiteInferior: 112384.51, limiteSuperior: 134100.00, subsidio: 187.60 },
    { limiteInferior: 134100.01, limiteSuperior: null, subsidio: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Tablas fiscales y de seguridad social para México 2025
        </p>
      </div>

      <Tabs defaultValue="demo-calculo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="demo-calculo" data-testid="tab-demo-calculo">
            Demo Cálculo
          </TabsTrigger>
          <TabsTrigger value="valores-referencia" data-testid="tab-valores-referencia">
            Valores
          </TabsTrigger>
          <TabsTrigger value="prestaciones-puesto" data-testid="tab-prestaciones-puesto">
            Prestaciones
          </TabsTrigger>
          <TabsTrigger value="conceptos" data-testid="tab-conceptos">
            Conceptos
          </TabsTrigger>
          <TabsTrigger value="isr" data-testid="tab-isr">
            ISR
          </TabsTrigger>
          <TabsTrigger value="imss" data-testid="tab-imss">
            IMSS
          </TabsTrigger>
          <TabsTrigger value="ceav" data-testid="tab-ceav">
            CEAV
          </TabsTrigger>
          <TabsTrigger value="prevision-social" data-testid="tab-prevision-social">
            Límites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo-calculo" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Demostración de Cálculo Real</h2>
            <p className="text-muted-foreground">
              Prueba cómo funcionan las fórmulas de ISR e IMSS con datos reales de las tablas 2025
            </p>
          </div>
          <DemoCalculoNomina />
        </TabsContent>

        <TabsContent value="prestaciones-puesto" className="space-y-6">
          <PrestacionesPorPuestoManager />
        </TabsContent>

        <TabsContent value="valores-referencia" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>UMA (Unidad de Medida y Actualización) 2025</CardTitle>
                  <CardDescription>Vigente desde 1 de febrero de 2025</CardDescription>
                </div>
                {!isEditingUMA ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingUMA(true)}
                    data-testid="button-edit-uma"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingUMA(false)}
                      data-testid="button-cancel-uma"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsEditingUMA(false)}
                      data-testid="button-save-uma"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="uma-diaria">UMA Diaria</Label>
                  {isEditingUMA ? (
                    <Input
                      id="uma-diaria"
                      type="number"
                      step="0.01"
                      value={umaValues.diaria}
                      onChange={(e) => setUmaValues({ ...umaValues, diaria: parseFloat(e.target.value) })}
                      data-testid="input-uma-diaria"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{formatCurrency(umaValues.diaria)}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uma-mensual">UMA Mensual</Label>
                  {isEditingUMA ? (
                    <Input
                      id="uma-mensual"
                      type="number"
                      step="0.01"
                      value={umaValues.mensual}
                      onChange={(e) => setUmaValues({ ...umaValues, mensual: parseFloat(e.target.value) })}
                      data-testid="input-uma-mensual"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{formatCurrency(umaValues.mensual)}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uma-anual">UMA Anual</Label>
                  {isEditingUMA ? (
                    <Input
                      id="uma-anual"
                      type="number"
                      step="0.01"
                      value={umaValues.anual}
                      onChange={(e) => setUmaValues({ ...umaValues, anual: parseFloat(e.target.value) })}
                      data-testid="input-uma-anual"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{formatCurrency(umaValues.anual)}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Salario Mínimo 2025</CardTitle>
                  <CardDescription>Vigente desde 1 de enero de 2025</CardDescription>
                </div>
                {!isEditingSalarioMinimo ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingSalarioMinimo(true)}
                    data-testid="button-edit-salario"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingSalarioMinimo(false)}
                      data-testid="button-cancel-salario"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsEditingSalarioMinimo(false)}
                      data-testid="button-save-salario"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="salario-general">Zona General</Label>
                  {isEditingSalarioMinimo ? (
                    <Input
                      id="salario-general"
                      type="number"
                      step="0.01"
                      value={salarioMinimo.zonaGeneral}
                      onChange={(e) => setSalarioMinimo({ ...salarioMinimo, zonaGeneral: parseFloat(e.target.value) })}
                      data-testid="input-salario-general"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{formatCurrency(salarioMinimo.zonaGeneral)} <span className="text-sm font-normal text-muted-foreground">diario</span></div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salario-frontera">Zona Libre Frontera Norte</Label>
                  {isEditingSalarioMinimo ? (
                    <Input
                      id="salario-frontera"
                      type="number"
                      step="0.01"
                      value={salarioMinimo.zonaFrontera}
                      onChange={(e) => setSalarioMinimo({ ...salarioMinimo, zonaFrontera: parseFloat(e.target.value) })}
                      data-testid="input-salario-frontera"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{formatCurrency(salarioMinimo.zonaFrontera)} <span className="text-sm font-normal text-muted-foreground">diario</span></div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subsidio al Empleo 2025</CardTitle>
              <CardDescription>Cuota fija desde mayo 2024 (13.8% del valor de la UMA)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label>Mensual</Label>
                  <div className="text-xl font-semibold">{formatCurrency(subsidioEmpleo.mensual)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Quincenal</Label>
                  <div className="text-xl font-semibold">{formatCurrency(subsidioEmpleo.quincenal)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Semanal</Label>
                  <div className="text-xl font-semibold">{formatCurrency(subsidioEmpleo.semanal)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Diario</Label>
                  <div className="text-xl font-semibold">{formatCurrency(subsidioEmpleo.diario)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Infonavit</CardTitle>
              <CardDescription>Aportación patronal para vivienda - Pago bimestral</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>Tasa Patronal</Label>
                  <div className="text-3xl font-bold">5.00%</div>
                </div>
                <div className="text-muted-foreground">
                  Sobre el Salario Base de Cotización (SBC)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conceptos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Conceptos de Previsión Social</CardTitle>
                  <CardDescription>
                    Configura conceptos con fórmulas dinámicas para cálculos de nómina
                  </CardDescription>
                </div>
                <Button data-testid="button-add-concepto-prevision">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Concepto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fórmula</TableHead>
                    <TableHead className="text-right">Límite Exento</TableHead>
                    <TableHead>Gravable ISR</TableHead>
                    <TableHead>Integra SBC</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow data-testid="row-concepto-vales-despensa">
                    <TableCell className="font-medium">Vales de Despensa</TableCell>
                    <TableCell>
                      <Badge variant="default">Percepción</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">Fijo</TableCell>
                    <TableCell className="text-right font-mono">40% SM Diario</TableCell>
                    <TableCell>
                      <Badge variant="outline">Parcial</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow data-testid="row-concepto-fondo-ahorro">
                    <TableCell className="font-medium">Fondo de Ahorro</TableCell>
                    <TableCell>
                      <Badge variant="default">Percepción</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">% Salario Base</TableCell>
                    <TableCell className="text-right font-mono">13% SBC</TableCell>
                    <TableCell>
                      <Badge variant="outline">Parcial</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow data-testid="row-concepto-aguinaldo">
                    <TableCell className="font-medium">Aguinaldo</TableCell>
                    <TableCell>
                      <Badge variant="default">Percepción</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">(Salario Diario × Días) ÷ 365 × Días Año</TableCell>
                    <TableCell className="text-right font-mono">30 UMAs</TableCell>
                    <TableCell>
                      <Badge variant="outline">Parcial</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow data-testid="row-concepto-prima-vacacional">
                    <TableCell className="font-medium">Prima Vacacional</TableCell>
                    <TableCell>
                      <Badge variant="default">Percepción</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">(Salario Diario × Días Vac.) × 0.25</TableCell>
                    <TableCell className="text-right font-mono">15 SM</TableCell>
                    <TableCell>
                      <Badge variant="outline">Parcial</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow data-testid="row-concepto-ptu">
                    <TableCell className="font-medium">PTU (Reparto de Utilidades)</TableCell>
                    <TableCell>
                      <Badge variant="default">Percepción</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">Fijo o Variable</TableCell>
                    <TableCell className="text-right font-mono">15 UMAs</TableCell>
                    <TableCell>
                      <Badge variant="outline">Parcial</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow data-testid="row-concepto-tiempo-extra">
                    <TableCell className="font-medium">Tiempo Extra</TableCell>
                    <TableCell>
                      <Badge variant="default">Percepción</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">(Salario Hora × Hrs) × Factor</TableCell>
                    <TableCell className="text-right font-mono">-</TableCell>
                    <TableCell>
                      <Badge variant="default">Total</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Sí</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow data-testid="row-concepto-imss">
                    <TableCell className="font-medium">IMSS (Trabajador)</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Deducción</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">SBC × % Tabla IMSS</TableCell>
                    <TableCell className="text-right font-mono">-</TableCell>
                    <TableCell>
                      <Badge variant="secondary">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">N/A</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow data-testid="row-concepto-isr">
                    <TableCell className="font-medium">ISR</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Deducción</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">Tabla ISR - Subsidio Empleo</TableCell>
                    <TableCell className="text-right font-mono">-</TableCell>
                    <TableCell>
                      <Badge variant="secondary">N/A</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">N/A</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="mt-6 p-4 bg-muted rounded-md text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-2">Variables Disponibles para Fórmulas:</p>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div><code className="bg-background px-2 py-1 rounded">salario_base</code> - Salario base del empleado</div>
                    <div><code className="bg-background px-2 py-1 rounded">salario_diario</code> - Salario diario integrado</div>
                    <div><code className="bg-background px-2 py-1 rounded">sbc</code> - Salario Base de Cotización</div>
                    <div><code className="bg-background px-2 py-1 rounded">dias_trabajados</code> - Días trabajados en el periodo</div>
                    <div><code className="bg-background px-2 py-1 rounded">uma_diaria</code> - UMA diaria vigente</div>
                    <div><code className="bg-background px-2 py-1 rounded">salario_minimo</code> - Salario mínimo vigente</div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2">Operadores Soportados:</p>
                  <div className="flex gap-4 text-muted-foreground">
                    <code className="bg-background px-2 py-1 rounded">+</code>
                    <code className="bg-background px-2 py-1 rounded">-</code>
                    <code className="bg-background px-2 py-1 rounded">×</code>
                    <code className="bg-background px-2 py-1 rounded">÷</code>
                    <code className="bg-background px-2 py-1 rounded">%</code>
                    <code className="bg-background px-2 py-1 rounded">()</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="isr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tablas ISR 2025</CardTitle>
              <CardDescription>
                Tarifas para sueldos y salarios - Todas las periodicidades
                <br />
                <Badge variant="outline" className="mt-2">
                  Sin cambios respecto a 2024
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mensual" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="diaria" data-testid="tab-isr-diaria">Diaria</TabsTrigger>
                  <TabsTrigger value="semanal" data-testid="tab-isr-semanal">Semanal</TabsTrigger>
                  <TabsTrigger value="decenal" data-testid="tab-isr-decenal">Decenal</TabsTrigger>
                  <TabsTrigger value="quincenal" data-testid="tab-isr-quincenal">Quincenal</TabsTrigger>
                  <TabsTrigger value="mensual" data-testid="tab-isr-mensual">Mensual</TabsTrigger>
                </TabsList>

                <TabsContent value="diaria" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Subsidio al Empleo: <span className="font-semibold">{formatCurrency(subsidioEmpleo.diario)}</span> diario
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Límite Inferior</TableHead>
                          <TableHead className="text-right">Límite Superior</TableHead>
                          <TableHead className="text-right">Cuota Fija</TableHead>
                          <TableHead className="text-right">% sobre Excedente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isrDiaria.map((row, index) => (
                          <TableRow key={index} data-testid={`row-isr-diaria-${index}`}>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.limiteInferior)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.limiteSuperior ? formatCurrency(row.limiteSuperior) : "En adelante"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.cuotaFija)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatPercent(row.porcentajeExcedente)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="semanal" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Subsidio al Empleo: <span className="font-semibold">{formatCurrency(subsidioEmpleo.semanal)}</span> semanal
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Límite Inferior</TableHead>
                          <TableHead className="text-right">Límite Superior</TableHead>
                          <TableHead className="text-right">Cuota Fija</TableHead>
                          <TableHead className="text-right">% sobre Excedente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isrSemanal.map((row, index) => (
                          <TableRow key={index} data-testid={`row-isr-semanal-${index}`}>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.limiteInferior)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.limiteSuperior ? formatCurrency(row.limiteSuperior) : "En adelante"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.cuotaFija)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatPercent(row.porcentajeExcedente)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="decenal" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Subsidio al Empleo: <span className="font-semibold">{formatCurrency(156.20)}</span> decenal
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Límite Inferior</TableHead>
                          <TableHead className="text-right">Límite Superior</TableHead>
                          <TableHead className="text-right">Cuota Fija</TableHead>
                          <TableHead className="text-right">% sobre Excedente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isrDecenal.map((row, index) => (
                          <TableRow key={index} data-testid={`row-isr-decenal-${index}`}>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.limiteInferior)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.limiteSuperior ? formatCurrency(row.limiteSuperior) : "En adelante"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.cuotaFija)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatPercent(row.porcentajeExcedente)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="quincenal" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Subsidio al Empleo: <span className="font-semibold">{formatCurrency(subsidioEmpleo.quincenal)}</span> quincenal
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Límite Inferior</TableHead>
                          <TableHead className="text-right">Límite Superior</TableHead>
                          <TableHead className="text-right">Cuota Fija</TableHead>
                          <TableHead className="text-right">% sobre Excedente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isrQuincenal.map((row, index) => (
                          <TableRow key={index} data-testid={`row-isr-quincenal-${index}`}>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.limiteInferior)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.limiteSuperior ? formatCurrency(row.limiteSuperior) : "En adelante"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.cuotaFija)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatPercent(row.porcentajeExcedente)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="mensual" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Subsidio al Empleo: <span className="font-semibold">Escalonado según ingreso</span>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPeriodicidad("mensual");
                          setEditDialogOpen(true);
                        }}
                        data-testid="button-edit-isr-mensual"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Tablas
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Límite Inferior</TableHead>
                          <TableHead className="text-right">Límite Superior</TableHead>
                          <TableHead className="text-right">Cuota Fija</TableHead>
                          <TableHead className="text-right">% sobre Excedente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isrMensual.map((row, index) => (
                          <TableRow key={index} data-testid={`row-isr-mensual-${index}`}>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.limiteInferior)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.limiteSuperior ? formatCurrency(row.limiteSuperior) : "En adelante"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(row.cuotaFija)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatPercent(row.porcentajeExcedente)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 p-4 bg-muted rounded-md text-sm">
                <p className="font-semibold mb-2">Fórmula de Cálculo:</p>
                <code className="block bg-background p-2 rounded">
                  ISR = (Ingreso Gravable - Límite Inferior) × % Excedente + Cuota Fija - Subsidio al Empleo
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imss" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cuotas IMSS 2025</CardTitle>
              <CardDescription>Porcentajes obrero-patronales por ramo de seguro</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Patrón</TableHead>
                    <TableHead className="text-right">Trabajador</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imssRates.map((rate, index) => (
                    <TableRow key={index} data-testid={`row-imss-${index}`}>
                      <TableCell className="font-medium">{rate.concepto}</TableCell>
                      <TableCell className="text-right font-mono">{rate.patron}</TableCell>
                      <TableCell className="text-right font-mono">{rate.trabajador}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{rate.nota}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riesgos de Trabajo</CardTitle>
              <CardDescription>Prima variable según clasificación de riesgo de la actividad</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clase de Riesgo</TableHead>
                    <TableHead className="text-right">Porcentaje Patronal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riesgosTrabajo.map((riesgo, index) => (
                    <TableRow key={index} data-testid={`row-riesgo-${index}`}>
                      <TableCell className="font-medium">{riesgo.clase}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{riesgo.porcentaje}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-muted rounded-md text-sm">
                <p className="text-muted-foreground">
                  El porcentaje aplicable depende de la actividad económica de la empresa.
                  Consulta tu clasificación en el portal del IMSS.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ceav" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cesantía en Edad Avanzada y Vejez (CEAV) 2025</CardTitle>
              <CardDescription>
                Cuotas escalonadas según el Salario Base de Cotización (SBC)
                <br />
                <Badge variant="default" className="mt-2">
                  Incrementos graduales hasta 2030
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rango SBC/UMA</TableHead>
                    <TableHead className="text-right">Patrón 2025</TableHead>
                    <TableHead className="text-right">Trabajador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ceav.map((row, index) => (
                    <TableRow key={index} data-testid={`row-ceav-${index}`}>
                      <TableCell className="font-medium">{row.rango}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {row.patronal2025}
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.trabajador}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-muted rounded-md text-sm space-y-2">
                <p className="font-semibold">Nota Importante:</p>
                <p className="text-muted-foreground">
                  Las cuotas patronales de CEAV aumentarán gradualmente cada año hasta 2030, 
                  cuando la tasa máxima será de 11.875% para salarios superiores a 4.01 UMAs.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prevision-social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Límites de Exención - Previsión Social</CardTitle>
              <CardDescription>
                Montos exentos de ISR para prestaciones de previsión social según la Ley del ISR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Límite Exento</TableHead>
                    <TableHead>Base</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previsionSocial.map((item, index) => (
                    <TableRow key={index} data-testid={`row-prevision-${index}`}>
                      <TableCell className="font-medium">{item.concepto}</TableCell>
                      <TableCell>{item.limiteExento}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.base}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-muted rounded-md text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-1">Regla General del Tope (Artículo 93 LISR):</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Si Salario Anual + Previsión Social {">"} 7 UMAs anuales ($288,914.64): La exención se limita a 1 UMA anual ($41,273.52)</li>
                    <li>Si Salario Anual + Previsión Social {"≤"} 7 UMAs anuales: Toda la previsión social está 100% exenta</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Cálculo de 7 UMAs Anuales 2025:</p>
                  <p className="text-muted-foreground font-mono">
                    7 × $41,273.52 = $288,914.64 MXN
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de Edición ISR */}
      <EditISRDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        periodicidad={currentPeriodicidad}
        isrTramos={
          currentPeriodicidad === "diaria" ? isrDiaria :
          currentPeriodicidad === "semanal" ? isrSemanal :
          currentPeriodicidad === "decenal" ? isrDecenal :
          currentPeriodicidad === "quincenal" ? isrQuincenal :
          isrMensual
        }
        subsidioTramos={
          currentPeriodicidad === "diaria" ? subsidioDiaria :
          currentPeriodicidad === "semanal" ? subsidioSemanal :
          currentPeriodicidad === "decenal" ? subsidioDecenal :
          currentPeriodicidad === "quincenal" ? subsidioQuincenal :
          subsidioMensual
        }
        onSave={(newISRTramos, newSubsidioTramos) => {
          console.log("Tablas actualizadas:", { newISRTramos, newSubsidioTramos });
          // Aquí puedes agregar lógica adicional para actualizar el estado local si es necesario
        }}
      />
    </div>
  );
}
