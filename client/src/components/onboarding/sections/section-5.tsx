import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section5() {
  const { audit, updateSection } = useOnboarding();

  const section5 = (audit?.section5 || {}) as any;
  const asistencia = section5.asistencia || {};
  const jornada = section5.jornada || {};

  const updateAsistencia = (field: string, value: string | boolean) => {
    updateSection("section5", {
      ...section5,
      asistencia: {
        ...asistencia,
        [field]: value,
      },
    });
  };

  const updateJornada = (field: string, value: string | boolean) => {
    updateSection("section5", {
      ...section5,
      jornada: {
        ...jornada,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={5}
        title="Tiempo y Asistencia"
        subtitle="Control de asistencia y jornada laboral"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Control de Asistencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Sistema de Control de Asistencia"
                  value={asistencia.sistemaControl || ""}
                  onChange={(v) => updateAsistencia("sistemaControl", v)}
                  validated={asistencia.sistemaControlValidated}
                  onValidatedChange={(v) => updateAsistencia("sistemaControlValidated", v)}
                  testId="input-sistema-control"
                />
                <TextField
                  label="Tipo de Registro (Biométrico, Tarjeta, etc.)"
                  value={asistencia.tipoRegistro || ""}
                  onChange={(v) => updateAsistencia("tipoRegistro", v)}
                  validated={asistencia.tipoRegistroValidated}
                  onValidatedChange={(v) => updateAsistencia("tipoRegistroValidated", v)}
                  testId="input-tipo-registro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Ausentismo Promedio (%)"
                  value={asistencia.ausentismoPromedio || ""}
                  onChange={(v) => updateAsistencia("ausentismoPromedio", v)}
                  validated={asistencia.ausentismoPromedioValidated}
                  onValidatedChange={(v) => updateAsistencia("ausentismoPromedioValidated", v)}
                  testId="input-ausentismo"
                />
                <TextField
                  label="Retardos Promedio Mensual"
                  value={asistencia.retardosPromedio || ""}
                  onChange={(v) => updateAsistencia("retardosPromedio", v)}
                  validated={asistencia.retardosPromedioValidated}
                  onValidatedChange={(v) => updateAsistencia("retardosPromedioValidated", v)}
                  testId="input-retardos"
                />
              </div>

              <TextAreaField
                label="Política de Faltas y Retardos"
                value={asistencia.politicaFaltas || ""}
                onChange={(v) => updateAsistencia("politicaFaltas", v)}
                testId="input-politica-faltas"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jornada Laboral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Jornada Diurna (horas)"
                  value={jornada.jornadaDiurna || ""}
                  onChange={(v) => updateJornada("jornadaDiurna", v)}
                  validated={jornada.jornadaDiurnaValidated}
                  onValidatedChange={(v) => updateJornada("jornadaDiurnaValidated", v)}
                  testId="input-jornada-diurna"
                />
                <TextField
                  label="Jornada Nocturna (horas)"
                  value={jornada.jornadaNocturna || ""}
                  onChange={(v) => updateJornada("jornadaNocturna", v)}
                  validated={jornada.jornadaNocturnaValidated}
                  onValidatedChange={(v) => updateJornada("jornadaNocturnaValidated", v)}
                  testId="input-jornada-nocturna"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Horas Extra Promedio Mensual"
                  value={jornada.horasExtraPromedio || ""}
                  onChange={(v) => updateJornada("horasExtraPromedio", v)}
                  validated={jornada.horasExtraPromedioValidated}
                  onValidatedChange={(v) => updateJornada("horasExtraPromedioValidated", v)}
                  testId="input-horas-extra"
                />
                <TextField
                  label="Días de Descanso Semanal"
                  value={jornada.diasDescanso || ""}
                  onChange={(v) => updateJornada("diasDescanso", v)}
                  validated={jornada.diasDescansoValidated}
                  onValidatedChange={(v) => updateJornada("diasDescansoValidated", v)}
                  testId="input-dias-descanso"
                />
              </div>

              <TextAreaField
                label="Turnos de Trabajo Existentes"
                value={jornada.turnosTrabajo || ""}
                onChange={(v) => updateJornada("turnosTrabajo", v)}
                testId="input-turnos-trabajo"
                rows={3}
              />

              <TextAreaField
                label="Observaciones sobre Jornada"
                value={jornada.observaciones || ""}
                onChange={(v) => updateJornada("observaciones", v)}
                testId="input-observaciones-jornada"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
