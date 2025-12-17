import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section3() {
  const { audit, updateSection } = useOnboarding();

  const section3 = (audit?.section3 || {}) as any;
  const nomina = section3.nomina || {};
  const compensacion = section3.compensacion || {};

  const updateNomina = (field: string, value: string | boolean) => {
    updateSection("section3", {
      ...section3,
      nomina: {
        ...nomina,
        [field]: value,
      },
    });
  };

  const updateCompensacion = (field: string, value: string | boolean) => {
    updateSection("section3", {
      ...section3,
      compensacion: {
        ...compensacion,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={3}
        title="Personal y Nómina"
        subtitle="Estructura salarial y proceso de nómina"
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
                  label="Timbrado CFDI"
                  value={nomina.timbradoCfdi || ""}
                  onChange={(v) => updateNomina("timbradoCfdi", v)}
                  validated={nomina.timbradoCfdiValidated}
                  onValidatedChange={(v) => updateNomina("timbradoCfdiValidated", v)}
                  testId="input-timbrado-cfdi"
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
