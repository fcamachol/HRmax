import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section6() {
  const { audit, updateSection } = useOnboarding();

  const section6 = (audit?.section6 || {}) as any;
  const nomina = section6.nomina || {};
  const compensacion = section6.compensacion || {};

  const updateNomina = (field: string, value: string | boolean) => {
    updateSection("section6", {
      ...section6,
      nomina: {
        ...nomina,
        [field]: value,
      },
    });
  };

  const updateCompensacion = (field: string, value: string | boolean) => {
    updateSection("section6", {
      ...section6,
      compensacion: {
        ...compensacion,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={6}
        title="Nómina y Compensaciones"
        subtitle="Estructura de nómina y prestaciones"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de Nómina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Sistema de Nómina Actual"
                  value={nomina.sistemaActual || ""}
                  onChange={(v) => updateNomina("sistemaActual", v)}
                  validated={nomina.sistemaActualValidated}
                  onValidatedChange={(v) => updateNomina("sistemaActualValidated", v)}
                  testId="input-sistema-nomina"
                />
                <TextField
                  label="Periodicidad de Pago"
                  value={nomina.periodicidadPago || ""}
                  onChange={(v) => updateNomina("periodicidadPago", v)}
                  validated={nomina.periodicidadPagoValidated}
                  onValidatedChange={(v) => updateNomina("periodicidadPagoValidated", v)}
                  testId="input-periodicidad-pago"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Monto Nómina Mensual Aproximado"
                  value={nomina.montoMensual || ""}
                  onChange={(v) => updateNomina("montoMensual", v)}
                  validated={nomina.montoMensualValidated}
                  onValidatedChange={(v) => updateNomina("montoMensualValidated", v)}
                  testId="input-monto-mensual"
                />
                <TextField
                  label="Fecha de Corte de Nómina"
                  value={nomina.fechaCorte || ""}
                  onChange={(v) => updateNomina("fechaCorte", v)}
                  validated={nomina.fechaCorteValidated}
                  onValidatedChange={(v) => updateNomina("fechaCorteValidated", v)}
                  testId="input-fecha-corte"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Banco Principal para Dispersión"
                  value={nomina.bancoDispersion || ""}
                  onChange={(v) => updateNomina("bancoDispersion", v)}
                  validated={nomina.bancoDispersionValidated}
                  onValidatedChange={(v) => updateNomina("bancoDispersionValidated", v)}
                  testId="input-banco-dispersion"
                />
                <TextField
                  label="PAC para Timbrado CFDI"
                  value={nomina.pacTimbrado || ""}
                  onChange={(v) => updateNomina("pacTimbrado", v)}
                  validated={nomina.pacTimbradoValidated}
                  onValidatedChange={(v) => updateNomina("pacTimbradoValidated", v)}
                  testId="input-pac-timbrado"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estructura de Compensación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Esquema de Pago (Bruto/Neto)"
                  value={compensacion.esquemaPago || ""}
                  onChange={(v) => updateCompensacion("esquemaPago", v)}
                  validated={compensacion.esquemaPagoValidated}
                  onValidatedChange={(v) => updateCompensacion("esquemaPagoValidated", v)}
                  testId="input-esquema-pago"
                />
                <TextField
                  label="Salario Mínimo Aplicable"
                  value={compensacion.salarioMinimo || ""}
                  onChange={(v) => updateCompensacion("salarioMinimo", v)}
                  validated={compensacion.salarioMinimoValidated}
                  onValidatedChange={(v) => updateCompensacion("salarioMinimoValidated", v)}
                  testId="input-salario-minimo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Aguinaldo (días)"
                  value={compensacion.aguinaldoDias || ""}
                  onChange={(v) => updateCompensacion("aguinaldoDias", v)}
                  validated={compensacion.aguinaldoDiasValidated}
                  onValidatedChange={(v) => updateCompensacion("aguinaldoDiasValidated", v)}
                  testId="input-aguinaldo-dias"
                  type="number"
                />
                <TextField
                  label="Prima Vacacional (%)"
                  value={compensacion.primaVacacional || ""}
                  onChange={(v) => updateCompensacion("primaVacacional", v)}
                  validated={compensacion.primaVacacionalValidated}
                  onValidatedChange={(v) => updateCompensacion("primaVacacionalValidated", v)}
                  testId="input-prima-vacacional"
                />
              </div>

              <TextAreaField
                label="Conceptos de Nómina Principales"
                value={compensacion.conceptosPrincipales || ""}
                onChange={(v) => updateCompensacion("conceptosPrincipales", v)}
                testId="input-conceptos-principales"
                rows={3}
              />

              <TextAreaField
                label="Observaciones sobre Compensación"
                value={compensacion.observaciones || ""}
                onChange={(v) => updateCompensacion("observaciones", v)}
                testId="input-observaciones-compensacion"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
