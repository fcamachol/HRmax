import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section9() {
  const { audit, updateSection } = useOnboarding();

  const section9 = (audit?.section9 || {}) as any;
  const capacitacion = section9.capacitacion || {};
  const dc3 = section9.dc3 || {};

  const updateCapacitacion = (field: string, value: string | boolean) => {
    updateSection("section9", {
      ...section9,
      capacitacion: {
        ...capacitacion,
        [field]: value,
      },
    });
  };

  const updateDc3 = (field: string, value: string | boolean) => {
    updateSection("section9", {
      ...section9,
      dc3: {
        ...dc3,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={9}
        title="Capacitación STPS"
        subtitle="Programas de capacitación y DC-3"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Programa de Capacitación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Plan de Capacitación Anual"
                  value={capacitacion.planAnual || ""}
                  onChange={(v) => updateCapacitacion("planAnual", v)}
                  validated={capacitacion.planAnualValidated}
                  onValidatedChange={(v) => updateCapacitacion("planAnualValidated", v)}
                  testId="input-plan-anual"
                />
                <TextField
                  label="Presupuesto Capacitación Anual"
                  value={capacitacion.presupuestoAnual || ""}
                  onChange={(v) => updateCapacitacion("presupuestoAnual", v)}
                  validated={capacitacion.presupuestoAnualValidated}
                  onValidatedChange={(v) => updateCapacitacion("presupuestoAnualValidated", v)}
                  testId="input-presupuesto-capacitacion"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Horas Promedio Capacitación/Empleado"
                  value={capacitacion.horasPromedio || ""}
                  onChange={(v) => updateCapacitacion("horasPromedio", v)}
                  validated={capacitacion.horasPromedioValidated}
                  onValidatedChange={(v) => updateCapacitacion("horasPromedioValidated", v)}
                  testId="input-horas-promedio"
                  type="number"
                />
                <TextField
                  label="Cursos Impartidos Último Año"
                  value={capacitacion.cursosUltimoAnio || ""}
                  onChange={(v) => updateCapacitacion("cursosUltimoAnio", v)}
                  validated={capacitacion.cursosUltimoAnioValidated}
                  onValidatedChange={(v) => updateCapacitacion("cursosUltimoAnioValidated", v)}
                  testId="input-cursos-anio"
                  type="number"
                />
              </div>

              <TextAreaField
                label="Áreas de Capacitación Principales"
                value={capacitacion.areasCapacitacion || ""}
                onChange={(v) => updateCapacitacion("areasCapacitacion", v)}
                testId="input-areas-capacitacion"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Constancias DC-3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="DC-3 Emitidas Último Año"
                  value={dc3.dc3Emitidas || ""}
                  onChange={(v) => updateDc3("dc3Emitidas", v)}
                  validated={dc3.dc3EmitidasValidated}
                  onValidatedChange={(v) => updateDc3("dc3EmitidasValidated", v)}
                  testId="input-dc3-emitidas"
                  type="number"
                />
                <TextField
                  label="Empleados con DC-3 (%)"
                  value={dc3.empleadosConDc3 || ""}
                  onChange={(v) => updateDc3("empleadosConDc3", v)}
                  validated={dc3.empleadosConDc3Validated}
                  onValidatedChange={(v) => updateDc3("empleadosConDc3Validated", v)}
                  testId="input-empleados-dc3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Agente Capacitador Externo"
                  value={dc3.agenteCapacitador || ""}
                  onChange={(v) => updateDc3("agenteCapacitador", v)}
                  validated={dc3.agenteCapacitadorValidated}
                  onValidatedChange={(v) => updateDc3("agenteCapacitadorValidated", v)}
                  testId="input-agente-capacitador"
                />
                <TextField
                  label="Registro STPS Agente"
                  value={dc3.registroStpsAgente || ""}
                  onChange={(v) => updateDc3("registroStpsAgente", v)}
                  validated={dc3.registroStpsAgenteValidated}
                  onValidatedChange={(v) => updateDc3("registroStpsAgenteValidated", v)}
                  testId="input-registro-stps"
                />
              </div>

              <TextAreaField
                label="Observaciones sobre Capacitación"
                value={dc3.observaciones || ""}
                onChange={(v) => updateDc3("observaciones", v)}
                testId="input-observaciones-capacitacion"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
