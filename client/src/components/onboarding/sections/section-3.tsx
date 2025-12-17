import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section3() {
  const { audit, updateSection } = useOnboarding();

  const section3 = (audit?.section3 || {}) as any;
  const organigrama = section3.organigrama || {};
  const puestos = section3.puestos || {};

  const updateOrganigrama = (field: string, value: string | boolean) => {
    updateSection("section3", {
      ...section3,
      organigrama: {
        ...organigrama,
        [field]: value,
      },
    });
  };

  const updatePuestos = (field: string, value: string | boolean) => {
    updateSection("section3", {
      ...section3,
      puestos: {
        ...puestos,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={3}
        title="Estructura Organizacional"
        subtitle="Organigrama y definición de puestos"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organigrama</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Total de Empleados"
                  value={organigrama.totalEmpleados || ""}
                  onChange={(v) => updateOrganigrama("totalEmpleados", v)}
                  validated={organigrama.totalEmpleadosValidated}
                  onValidatedChange={(v) => updateOrganigrama("totalEmpleadosValidated", v)}
                  testId="input-total-empleados"
                  type="number"
                />
                <TextField
                  label="Niveles Jerárquicos"
                  value={organigrama.nivelesJerarquicos || ""}
                  onChange={(v) => updateOrganigrama("nivelesJerarquicos", v)}
                  validated={organigrama.nivelesJerarquicosValidated}
                  onValidatedChange={(v) => updateOrganigrama("nivelesJerarquicosValidated", v)}
                  testId="input-niveles-jerarquicos"
                  type="number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Número de Departamentos"
                  value={organigrama.numDepartamentos || ""}
                  onChange={(v) => updateOrganigrama("numDepartamentos", v)}
                  validated={organigrama.numDepartamentosValidated}
                  onValidatedChange={(v) => updateOrganigrama("numDepartamentosValidated", v)}
                  testId="input-num-departamentos"
                  type="number"
                />
                <TextField
                  label="Sucursales/Plantas"
                  value={organigrama.numSucursales || ""}
                  onChange={(v) => updateOrganigrama("numSucursales", v)}
                  validated={organigrama.numSucursalesValidated}
                  onValidatedChange={(v) => updateOrganigrama("numSucursalesValidated", v)}
                  testId="input-num-sucursales"
                  type="number"
                />
              </div>

              <TextField
                label="Organigrama Documentado"
                value={organigrama.organigramaDocumentado || ""}
                onChange={(v) => updateOrganigrama("organigramaDocumentado", v)}
                validated={organigrama.organigramaDocumentadoValidated}
                onValidatedChange={(v) => updateOrganigrama("organigramaDocumentadoValidated", v)}
                testId="input-organigrama-documentado"
              />

              <TextAreaField
                label="Departamentos Principales"
                value={organigrama.departamentosPrincipales || ""}
                onChange={(v) => updateOrganigrama("departamentosPrincipales", v)}
                testId="input-departamentos-principales"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Definición de Puestos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Puestos con Descripción Formal"
                  value={puestos.puestosConDescripcion || ""}
                  onChange={(v) => updatePuestos("puestosConDescripcion", v)}
                  validated={puestos.puestosConDescripcionValidated}
                  onValidatedChange={(v) => updatePuestos("puestosConDescripcionValidated", v)}
                  testId="input-puestos-descripcion"
                />
                <TextField
                  label="Perfiles de Puesto Actualizados"
                  value={puestos.perfilesActualizados || ""}
                  onChange={(v) => updatePuestos("perfilesActualizados", v)}
                  validated={puestos.perfilesActualizadosValidated}
                  onValidatedChange={(v) => updatePuestos("perfilesActualizadosValidated", v)}
                  testId="input-perfiles-actualizados"
                />
              </div>

              <TextField
                label="Fecha Última Actualización de Perfiles"
                value={puestos.fechaActualizacionPerfiles || ""}
                onChange={(v) => updatePuestos("fechaActualizacionPerfiles", v)}
                validated={puestos.fechaActualizacionPerfilesValidated}
                onValidatedChange={(v) => updatePuestos("fechaActualizacionPerfilesValidated", v)}
                testId="input-fecha-perfiles"
                type="date"
              />

              <TextAreaField
                label="Observaciones sobre Estructura"
                value={puestos.observaciones || ""}
                onChange={(v) => updatePuestos("observaciones", v)}
                testId="input-observaciones-estructura"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
