import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section11() {
  const { audit, updateSection } = useOnboarding();

  const section11 = (audit?.section11 || {}) as any;
  const hallazgos = section11.hallazgos || {};
  const remediacion = section11.remediacion || {};

  const updateHallazgos = (field: string, value: string | boolean) => {
    updateSection("section11", {
      ...section11,
      hallazgos: {
        ...hallazgos,
        [field]: value,
      },
    });
  };

  const updateRemediacion = (field: string, value: string | boolean) => {
    updateSection("section11", {
      ...section11,
      remediacion: {
        ...remediacion,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={11}
        title="Hallazgos y Remediación"
        subtitle="Observaciones y plan de acción"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hallazgos Principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextAreaField
                label="Hallazgos Críticos"
                value={hallazgos.criticos || ""}
                onChange={(v) => updateHallazgos("criticos", v)}
                testId="input-hallazgos-criticos"
                rows={4}
              />

              <TextAreaField
                label="Hallazgos de Riesgo Medio"
                value={hallazgos.riesgoMedio || ""}
                onChange={(v) => updateHallazgos("riesgoMedio", v)}
                testId="input-hallazgos-medio"
                rows={4}
              />

              <TextAreaField
                label="Hallazgos de Bajo Riesgo / Mejoras"
                value={hallazgos.bajoRiesgo || ""}
                onChange={(v) => updateHallazgos("bajoRiesgo", v)}
                testId="input-hallazgos-bajo"
                rows={4}
              />

              <TextAreaField
                label="Fortalezas Identificadas"
                value={hallazgos.fortalezas || ""}
                onChange={(v) => updateHallazgos("fortalezas", v)}
                testId="input-fortalezas"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan de Remediación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextAreaField
                label="Acciones Inmediatas (0-30 días)"
                value={remediacion.accionesInmediatas || ""}
                onChange={(v) => updateRemediacion("accionesInmediatas", v)}
                testId="input-acciones-inmediatas"
                rows={4}
              />

              <TextAreaField
                label="Acciones a Corto Plazo (30-90 días)"
                value={remediacion.accionesCortoPlazo || ""}
                onChange={(v) => updateRemediacion("accionesCortoPlazo", v)}
                testId="input-acciones-corto-plazo"
                rows={4}
              />

              <TextAreaField
                label="Acciones a Mediano Plazo (90-180 días)"
                value={remediacion.accionesMedianoPlazo || ""}
                onChange={(v) => updateRemediacion("accionesMedianoPlazo", v)}
                testId="input-acciones-mediano-plazo"
                rows={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Responsable General del Plan"
                  value={remediacion.responsableGeneral || ""}
                  onChange={(v) => updateRemediacion("responsableGeneral", v)}
                  validated={remediacion.responsableGeneralValidated}
                  onValidatedChange={(v) => updateRemediacion("responsableGeneralValidated", v)}
                  testId="input-responsable-plan"
                />
                <TextField
                  label="Fecha de Seguimiento"
                  value={remediacion.fechaSeguimiento || ""}
                  onChange={(v) => updateRemediacion("fechaSeguimiento", v)}
                  validated={remediacion.fechaSeguimientoValidated}
                  onValidatedChange={(v) => updateRemediacion("fechaSeguimientoValidated", v)}
                  testId="input-fecha-seguimiento"
                  type="date"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
