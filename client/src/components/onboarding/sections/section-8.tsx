import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section8() {
  const { audit, updateSection } = useOnboarding();

  const section8 = (audit?.section8 || {}) as any;
  const seguridad = section8.seguridad || {};
  const comisiones = section8.comisiones || {};

  const updateSeguridad = (field: string, value: string | boolean) => {
    updateSection("section8", {
      ...section8,
      seguridad: {
        ...seguridad,
        [field]: value,
      },
    });
  };

  const updateComisiones = (field: string, value: string | boolean) => {
    updateSection("section8", {
      ...section8,
      comisiones: {
        ...comisiones,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={8}
        title="Seguridad e Higiene"
        subtitle="Normas de seguridad y comisiones"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Normas de Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Reglamento de Seguridad Documentado"
                  value={seguridad.reglamentoDocumentado || ""}
                  onChange={(v) => updateSeguridad("reglamentoDocumentado", v)}
                  validated={seguridad.reglamentoDocumentadoValidated}
                  onValidatedChange={(v) => updateSeguridad("reglamentoDocumentadoValidated", v)}
                  testId="input-reglamento-seguridad"
                />
                <TextField
                  label="NOM-001 a NOM-030 Aplicables"
                  value={seguridad.nomsAplicables || ""}
                  onChange={(v) => updateSeguridad("nomsAplicables", v)}
                  validated={seguridad.nomsAplicablesValidated}
                  onValidatedChange={(v) => updateSeguridad("nomsAplicablesValidated", v)}
                  testId="input-noms-aplicables"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Equipo de Protección Personal"
                  value={seguridad.epp || ""}
                  onChange={(v) => updateSeguridad("epp", v)}
                  validated={seguridad.eppValidated}
                  onValidatedChange={(v) => updateSeguridad("eppValidated", v)}
                  testId="input-epp"
                />
                <TextField
                  label="Accidentes Último Año"
                  value={seguridad.accidentesUltimoAnio || ""}
                  onChange={(v) => updateSeguridad("accidentesUltimoAnio", v)}
                  validated={seguridad.accidentesUltimoAnioValidated}
                  onValidatedChange={(v) => updateSeguridad("accidentesUltimoAnioValidated", v)}
                  testId="input-accidentes"
                  type="number"
                />
              </div>

              <TextField
                label="Plan de Emergencia Documentado"
                value={seguridad.planEmergencia || ""}
                onChange={(v) => updateSeguridad("planEmergencia", v)}
                validated={seguridad.planEmergenciaValidated}
                onValidatedChange={(v) => updateSeguridad("planEmergenciaValidated", v)}
                testId="input-plan-emergencia"
              />

              <TextAreaField
                label="Observaciones de Seguridad"
                value={seguridad.observaciones || ""}
                onChange={(v) => updateSeguridad("observaciones", v)}
                testId="input-observaciones-seguridad"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comisiones Mixtas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Comisión Mixta de Seguridad e Higiene"
                  value={comisiones.comisionSeguridad || ""}
                  onChange={(v) => updateComisiones("comisionSeguridad", v)}
                  validated={comisiones.comisionSeguridadValidated}
                  onValidatedChange={(v) => updateComisiones("comisionSeguridadValidated", v)}
                  testId="input-comision-seguridad"
                />
                <TextField
                  label="Última Acta de Comisión"
                  value={comisiones.ultimaActa || ""}
                  onChange={(v) => updateComisiones("ultimaActa", v)}
                  validated={comisiones.ultimaActaValidated}
                  onValidatedChange={(v) => updateComisiones("ultimaActaValidated", v)}
                  testId="input-ultima-acta"
                  type="date"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Comisión de Capacitación y Adiestramiento"
                  value={comisiones.comisionCapacitacion || ""}
                  onChange={(v) => updateComisiones("comisionCapacitacion", v)}
                  validated={comisiones.comisionCapacitacionValidated}
                  onValidatedChange={(v) => updateComisiones("comisionCapacitacionValidated", v)}
                  testId="input-comision-capacitacion"
                />
                <TextField
                  label="Recorridos de Verificación"
                  value={comisiones.recorridosVerificacion || ""}
                  onChange={(v) => updateComisiones("recorridosVerificacion", v)}
                  validated={comisiones.recorridosVerificacionValidated}
                  onValidatedChange={(v) => updateComisiones("recorridosVerificacionValidated", v)}
                  testId="input-recorridos"
                />
              </div>

              <TextAreaField
                label="Observaciones sobre Comisiones"
                value={comisiones.observaciones || ""}
                onChange={(v) => updateComisiones("observaciones", v)}
                testId="input-observaciones-comisiones"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
