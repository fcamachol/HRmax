import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section2() {
  const { audit, updateSection } = useOnboarding();

  const section2 = (audit?.section2 || {}) as any;
  const obligaciones = section2.obligaciones || {};
  const normatividad = section2.normatividad || {};

  const updateObligaciones = (field: string, value: string | boolean) => {
    updateSection("section2", {
      ...section2,
      obligaciones: {
        ...obligaciones,
        [field]: value,
      },
    });
  };

  const updateNormatividad = (field: string, value: string | boolean) => {
    updateSection("section2", {
      ...section2,
      normatividad: {
        ...normatividad,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={2}
        title="Cumplimiento Laboral"
        subtitle="Obligaciones laborales y cumplimiento normativo"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Obligaciones Laborales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Ley Federal del Trabajo Aplicada"
                  value={obligaciones.lftAplicada || ""}
                  onChange={(v) => updateObligaciones("lftAplicada", v)}
                  validated={obligaciones.lftAplicadaValidated}
                  onValidatedChange={(v) => updateObligaciones("lftAplicadaValidated", v)}
                  testId="input-lft-aplicada"
                />
                <TextField
                  label="Contrato Colectivo de Trabajo"
                  value={obligaciones.contratoColectivo || ""}
                  onChange={(v) => updateObligaciones("contratoColectivo", v)}
                  validated={obligaciones.contratoColectivoValidated}
                  onValidatedChange={(v) => updateObligaciones("contratoColectivoValidated", v)}
                  testId="input-contrato-colectivo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Sindicato (si aplica)"
                  value={obligaciones.sindicato || ""}
                  onChange={(v) => updateObligaciones("sindicato", v)}
                  validated={obligaciones.sindicatoValidated}
                  onValidatedChange={(v) => updateObligaciones("sindicatoValidated", v)}
                  testId="input-sindicato"
                />
                <TextField
                  label="Fecha Último Acuerdo Sindical"
                  value={obligaciones.fechaAcuerdoSindical || ""}
                  onChange={(v) => updateObligaciones("fechaAcuerdoSindical", v)}
                  validated={obligaciones.fechaAcuerdoSindicalValidated}
                  onValidatedChange={(v) => updateObligaciones("fechaAcuerdoSindicalValidated", v)}
                  testId="input-fecha-acuerdo"
                  type="date"
                />
              </div>

              <TextAreaField
                label="Obligaciones Pendientes Identificadas"
                value={obligaciones.obligacionesPendientes || ""}
                onChange={(v) => updateObligaciones("obligacionesPendientes", v)}
                testId="input-obligaciones-pendientes"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cumplimiento Normativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="NOM-035 Implementada"
                  value={normatividad.nom035 || ""}
                  onChange={(v) => updateNormatividad("nom035", v)}
                  validated={normatividad.nom035Validated}
                  onValidatedChange={(v) => updateNormatividad("nom035Validated", v)}
                  testId="input-nom035"
                />
                <TextField
                  label="Fecha Última Evaluación NOM-035"
                  value={normatividad.fechaNom035 || ""}
                  onChange={(v) => updateNormatividad("fechaNom035", v)}
                  validated={normatividad.fechaNom035Validated}
                  onValidatedChange={(v) => updateNormatividad("fechaNom035Validated", v)}
                  testId="input-fecha-nom035"
                  type="date"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Igualdad Laboral y No Discriminación"
                  value={normatividad.igualdadLaboral || ""}
                  onChange={(v) => updateNormatividad("igualdadLaboral", v)}
                  validated={normatividad.igualdadLaboralValidated}
                  onValidatedChange={(v) => updateNormatividad("igualdadLaboralValidated", v)}
                  testId="input-igualdad-laboral"
                />
                <TextField
                  label="Protocolo Hostigamiento/Acoso"
                  value={normatividad.protocoloHostigamiento || ""}
                  onChange={(v) => updateNormatividad("protocoloHostigamiento", v)}
                  validated={normatividad.protocoloHostigamientoValidated}
                  onValidatedChange={(v) => updateNormatividad("protocoloHostigamientoValidated", v)}
                  testId="input-protocolo-hostigamiento"
                />
              </div>

              <TextAreaField
                label="Observaciones sobre Cumplimiento"
                value={normatividad.observaciones || ""}
                onChange={(v) => updateNormatividad("observaciones", v)}
                testId="input-observaciones-cumplimiento"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
