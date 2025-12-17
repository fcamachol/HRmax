import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section5() {
  const { audit, updateSection } = useOnboarding();

  const section5 = (audit?.section5 || {}) as any;
  const sat = section5.sat || {};
  const obligaciones = section5.obligaciones || {};

  const updateSat = (field: string, value: string | boolean) => {
    updateSection("section5", {
      ...section5,
      sat: {
        ...sat,
        [field]: value,
      },
    });
  };

  const updateObligaciones = (field: string, value: string | boolean) => {
    updateSection("section5", {
      ...section5,
      obligaciones: {
        ...obligaciones,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={5}
        title="Obligaciones Fiscales"
        subtitle="SAT, retenciones y cumplimiento fiscal"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información SAT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Régimen Fiscal"
                  value={sat.regimenFiscal || ""}
                  onChange={(v) => updateSat("regimenFiscal", v)}
                  validated={sat.regimenFiscalValidated}
                  onValidatedChange={(v) => updateSat("regimenFiscalValidated", v)}
                  testId="input-regimen-sat"
                />
                <TextField
                  label="e.firma Vigente Hasta"
                  value={sat.efirmaVigencia || ""}
                  onChange={(v) => updateSat("efirmaVigencia", v)}
                  validated={sat.efirmaVigenciaValidated}
                  onValidatedChange={(v) => updateSat("efirmaVigenciaValidated", v)}
                  testId="input-efirma-vigencia"
                  type="date"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="CSD Vigente Hasta"
                  value={sat.csdVigencia || ""}
                  onChange={(v) => updateSat("csdVigencia", v)}
                  validated={sat.csdVigenciaValidated}
                  onValidatedChange={(v) => updateSat("csdVigenciaValidated", v)}
                  testId="input-csd-vigencia"
                  type="date"
                />
                <TextField
                  label="PAC para Timbrado"
                  value={sat.pacTimbrado || ""}
                  onChange={(v) => updateSat("pacTimbrado", v)}
                  validated={sat.pacTimbradoValidated}
                  onValidatedChange={(v) => updateSat("pacTimbradoValidated", v)}
                  testId="input-pac-timbrado"
                />
              </div>

              <TextField
                label="Buzón Tributario Activo"
                value={sat.buzonTributario || ""}
                onChange={(v) => updateSat("buzonTributario", v)}
                validated={sat.buzonTributarioValidated}
                onValidatedChange={(v) => updateSat("buzonTributarioValidated", v)}
                testId="input-buzon-tributario"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Obligaciones Fiscales Laborales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Declaración Anual ISR (Último Ejercicio)"
                  value={obligaciones.declaracionAnualIsr || ""}
                  onChange={(v) => updateObligaciones("declaracionAnualIsr", v)}
                  validated={obligaciones.declaracionAnualIsrValidated}
                  onValidatedChange={(v) => updateObligaciones("declaracionAnualIsrValidated", v)}
                  testId="input-declaracion-isr"
                />
                <TextField
                  label="Declaraciones Provisionales al Día"
                  value={obligaciones.declaracionesProvisionales || ""}
                  onChange={(v) => updateObligaciones("declaracionesProvisionales", v)}
                  validated={obligaciones.declaracionesProvisonalesValidated}
                  onValidatedChange={(v) => updateObligaciones("declaracionesProvisonalesValidated", v)}
                  testId="input-declaraciones-prov"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Constancias de Retención Emitidas"
                  value={obligaciones.constanciasRetencion || ""}
                  onChange={(v) => updateObligaciones("constanciasRetencion", v)}
                  validated={obligaciones.constanciasRetencionValidated}
                  onValidatedChange={(v) => updateObligaciones("constanciasRetencionValidated", v)}
                  testId="input-constancias"
                />
                <TextField
                  label="Subsidio al Empleo Aplicado"
                  value={obligaciones.subsidioEmpleo || ""}
                  onChange={(v) => updateObligaciones("subsidioEmpleo", v)}
                  validated={obligaciones.subsidioEmpleoValidated}
                  onValidatedChange={(v) => updateObligaciones("subsidioEmpleoValidated", v)}
                  testId="input-subsidio"
                />
              </div>

              <TextAreaField
                label="Observaciones Fiscales"
                value={obligaciones.observaciones || ""}
                onChange={(v) => updateObligaciones("observaciones", v)}
                testId="input-observaciones-fiscales"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
