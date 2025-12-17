import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section7() {
  const { audit, updateSection } = useOnboarding();

  const section7 = (audit?.section7 || {}) as any;
  const reglamento = section7.reglamento || {};
  const politicas = section7.politicas || {};

  const updateReglamento = (field: string, value: string | boolean) => {
    updateSection("section7", {
      ...section7,
      reglamento: {
        ...reglamento,
        [field]: value,
      },
    });
  };

  const updatePoliticas = (field: string, value: string | boolean) => {
    updateSection("section7", {
      ...section7,
      politicas: {
        ...politicas,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={7}
        title="Políticas y Reglamentos"
        subtitle="Reglamento interior y políticas internas"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reglamento Interior de Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Reglamento Registrado ante STPS"
                  value={reglamento.registradoStps || ""}
                  onChange={(v) => updateReglamento("registradoStps", v)}
                  validated={reglamento.registradoStpsValidated}
                  onValidatedChange={(v) => updateReglamento("registradoStpsValidated", v)}
                  testId="input-registrado-stps"
                />
                <TextField
                  label="Número de Registro STPS"
                  value={reglamento.numeroRegistro || ""}
                  onChange={(v) => updateReglamento("numeroRegistro", v)}
                  validated={reglamento.numeroRegistroValidated}
                  onValidatedChange={(v) => updateReglamento("numeroRegistroValidated", v)}
                  testId="input-numero-registro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Fecha de Registro"
                  value={reglamento.fechaRegistro || ""}
                  onChange={(v) => updateReglamento("fechaRegistro", v)}
                  validated={reglamento.fechaRegistroValidated}
                  onValidatedChange={(v) => updateReglamento("fechaRegistroValidated", v)}
                  testId="input-fecha-registro-rit"
                  type="date"
                />
                <TextField
                  label="Última Actualización"
                  value={reglamento.ultimaActualizacion || ""}
                  onChange={(v) => updateReglamento("ultimaActualizacion", v)}
                  validated={reglamento.ultimaActualizacionValidated}
                  onValidatedChange={(v) => updateReglamento("ultimaActualizacionValidated", v)}
                  testId="input-ultima-actualizacion"
                  type="date"
                />
              </div>

              <TextAreaField
                label="Observaciones sobre Reglamento"
                value={reglamento.observaciones || ""}
                onChange={(v) => updateReglamento("observaciones", v)}
                testId="input-observaciones-reglamento"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Políticas Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextAreaField
                label="Políticas Documentadas"
                value={politicas.politicasDocumentadas || ""}
                onChange={(v) => updatePoliticas("politicasDocumentadas", v)}
                testId="input-politicas-documentadas"
                rows={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Política de Vacaciones"
                  value={politicas.politicaVacaciones || ""}
                  onChange={(v) => updatePoliticas("politicaVacaciones", v)}
                  validated={politicas.politicaVacacionesValidated}
                  onValidatedChange={(v) => updatePoliticas("politicaVacacionesValidated", v)}
                  testId="input-politica-vacaciones"
                />
                <TextField
                  label="Política de Tiempo Extra"
                  value={politicas.politicaTiempoExtra || ""}
                  onChange={(v) => updatePoliticas("politicaTiempoExtra", v)}
                  validated={politicas.politicaTiempoExtraValidated}
                  onValidatedChange={(v) => updatePoliticas("politicaTiempoExtraValidated", v)}
                  testId="input-politica-tiempo-extra"
                />
              </div>

              <TextField
                label="Protocolo contra Hostigamiento"
                value={politicas.protocoloHostigamiento || ""}
                onChange={(v) => updatePoliticas("protocoloHostigamiento", v)}
                validated={politicas.protocoloHostigamientoValidated}
                onValidatedChange={(v) => updatePoliticas("protocoloHostigamientoValidated", v)}
                testId="input-protocolo-hostigamiento"
              />

              <TextAreaField
                label="Observaciones sobre Políticas"
                value={politicas.observaciones || ""}
                onChange={(v) => updatePoliticas("observaciones", v)}
                testId="input-observaciones-politicas"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
