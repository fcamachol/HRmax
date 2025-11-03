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
import { Settings, Edit, Save, X } from "lucide-react";

export default function Configuration() {
  const [isEditingUMA, setIsEditingUMA] = useState(false);
  const [isEditingSalarioMinimo, setIsEditingSalarioMinimo] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  // ISR Monthly Table 2025
  const isrTable = [
    { limiteInferior: 0.01, limiteSuperior: 746.04, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
    { limiteInferior: 746.05, limiteSuperior: 6332.05, cuotaFija: 14.32, porcentajeExcedente: 6.40 },
    { limiteInferior: 6332.06, limiteSuperior: 11128.01, cuotaFija: 371.83, porcentajeExcedente: 10.88 },
    { limiteInferior: 11128.02, limiteSuperior: 12935.82, cuotaFija: 893.63, porcentajeExcedente: 16.00 },
    { limiteInferior: 12935.83, limiteSuperior: 15487.71, cuotaFija: 1182.88, porcentajeExcedente: 17.92 },
    { limiteInferior: 15487.72, limiteSuperior: 31236.49, cuotaFija: 1640.18, porcentajeExcedente: 21.36 },
    { limiteInferior: 31236.50, limiteSuperior: 49233.00, cuotaFija: 5004.12, porcentajeExcedente: 23.52 },
    { limiteInferior: 49233.01, limiteSuperior: 93993.90, cuotaFija: 9236.89, porcentajeExcedente: 30.00 },
    { limiteInferior: 93993.91, limiteSuperior: 125325.20, cuotaFija: 22665.17, porcentajeExcedente: 32.00 },
    { limiteInferior: 125325.21, limiteSuperior: 375975.61, cuotaFija: 32691.18, porcentajeExcedente: 34.00 },
    { limiteInferior: 375975.62, limiteSuperior: null, cuotaFija: 117912.32, porcentajeExcedente: 35.00 },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Tablas fiscales y de seguridad social para México 2025
        </p>
      </div>

      <Tabs defaultValue="valores-referencia" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="valores-referencia" data-testid="tab-valores-referencia">
            Valores de Referencia
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
            Previsión Social
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="isr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tabla ISR Mensual 2025</CardTitle>
              <CardDescription>
                Tarifas para sueldos y salarios - Vigente desde 1 de enero de 2025
                <br />
                <Badge variant="outline" className="mt-2">
                  Sin cambios respecto a 2024
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {isrTable.map((row, index) => (
                    <TableRow key={index} data-testid={`row-isr-${index}`}>
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
              <div className="mt-4 p-4 bg-muted rounded-md text-sm">
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
    </div>
  );
}
