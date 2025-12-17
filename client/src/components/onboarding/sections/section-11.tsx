import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section11() {
  const { audit, updateSection } = useOnboarding();

  const section11 = (audit?.section11 || {}) as any;
  const observaciones = section11.observaciones || {};
  const recomendaciones = section11.recomendaciones || {};

  const updateObservaciones = (field: string, value: string | boolean) => {
    updateSection("section11", {
      ...section11,
      observaciones: {
        ...observaciones,
        [field]: value,
      },
    });
  };

  const updateRecomendaciones = (field: string, value: string | boolean) => {
    updateSection("section11", {
      ...section11,
      recomendaciones: {
        ...recomendaciones,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={11}
        title="Observaciones Generales"
        subtitle="Hallazgos y áreas de mejora identificadas"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hallazgos Principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextAreaField
                label="Fortalezas Identificadas"
                value={observaciones.fortalezas || ""}
                onChange={(v) => updateObservaciones("fortalezas", v)}
                testId="input-fortalezas"
                rows={4}
              />

              <TextAreaField
                label="Áreas de Oportunidad"
                value={observaciones.areasOportunidad || ""}
                onChange={(v) => updateObservaciones("areasOportunidad", v)}
                testId="input-areas-oportunidad"
                rows={4}
              />

              <TextAreaField
                label="Riesgos Identificados"
                value={observaciones.riesgosIdentificados || ""}
                onChange={(v) => updateObservaciones("riesgosIdentificados", v)}
                testId="input-riesgos-identificados"
                rows={4}
              />

              <TextAreaField
                label="Incumplimientos Detectados"
                value={observaciones.incumplimientos || ""}
                onChange={(v) => updateObservaciones("incumplimientos", v)}
                testId="input-incumplimientos"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextAreaField
                label="Acciones Inmediatas (Urgentes)"
                value={recomendaciones.accionesInmediatas || ""}
                onChange={(v) => updateRecomendaciones("accionesInmediatas", v)}
                testId="input-acciones-inmediatas"
                rows={4}
              />

              <TextAreaField
                label="Acciones a Corto Plazo (30-60 días)"
                value={recomendaciones.accionesCortoPlazo || ""}
                onChange={(v) => updateRecomendaciones("accionesCortoPlazo", v)}
                testId="input-acciones-corto-plazo"
                rows={4}
              />

              <TextAreaField
                label="Acciones a Mediano Plazo (90-180 días)"
                value={recomendaciones.accionesMedianoPlazo || ""}
                onChange={(v) => updateRecomendaciones("accionesMedianoPlazo", v)}
                testId="input-acciones-mediano-plazo"
                rows={4}
              />

              <TextField
                label="Nivel de Urgencia General"
                value={recomendaciones.nivelUrgencia || ""}
                onChange={(v) => updateRecomendaciones("nivelUrgencia", v)}
                validated={recomendaciones.nivelUrgenciaValidated}
                onValidatedChange={(v) => updateRecomendaciones("nivelUrgenciaValidated", v)}
                testId="input-nivel-urgencia"
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
