import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section2() {
  const { audit, updateSection } = useOnboarding();

  const section2 = (audit?.section2 || {}) as any;
  const orgStructure = section2.orgStructure || {};
  const departments = section2.departments || {};

  const updateOrgStructure = (field: string, value: string | boolean) => {
    updateSection("section2", {
      ...section2,
      orgStructure: {
        ...orgStructure,
        [field]: value,
      },
    });
  };

  const updateDepartments = (field: string, value: string | boolean) => {
    updateSection("section2", {
      ...section2,
      departments: {
        ...departments,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={2}
        title="Estructura Organizacional"
        subtitle="Organización interna y estructura departamental"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estructura Organizacional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Número Total de Empleados"
                  value={orgStructure.totalEmpleados || ""}
                  onChange={(v) => updateOrgStructure("totalEmpleados", v)}
                  validated={orgStructure.totalEmpleadosValidated}
                  onValidatedChange={(v) => updateOrgStructure("totalEmpleadosValidated", v)}
                  testId="input-total-empleados"
                  type="number"
                />
                <TextField
                  label="Número de Sucursales/Plantas"
                  value={orgStructure.numSucursales || ""}
                  onChange={(v) => updateOrgStructure("numSucursales", v)}
                  validated={orgStructure.numSucursalesValidated}
                  onValidatedChange={(v) => updateOrgStructure("numSucursalesValidated", v)}
                  testId="input-num-sucursales"
                  type="number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Empleados Sindicalizados"
                  value={orgStructure.empleadosSindicalizados || ""}
                  onChange={(v) => updateOrgStructure("empleadosSindicalizados", v)}
                  validated={orgStructure.empleadosSindicalizadosValidated}
                  onValidatedChange={(v) => updateOrgStructure("empleadosSindicalizadosValidated", v)}
                  testId="input-empleados-sindicalizados"
                  type="number"
                />
                <TextField
                  label="Empleados de Confianza"
                  value={orgStructure.empleadosConfianza || ""}
                  onChange={(v) => updateOrgStructure("empleadosConfianza", v)}
                  validated={orgStructure.empleadosConfianzaValidated}
                  onValidatedChange={(v) => updateOrgStructure("empleadosConfianzaValidated", v)}
                  testId="input-empleados-confianza"
                  type="number"
                />
              </div>

              <TextAreaField
                label="Niveles Jerárquicos"
                value={orgStructure.nivelesJerarquicos || ""}
                onChange={(v) => updateOrgStructure("nivelesJerarquicos", v)}
                testId="input-niveles-jerarquicos"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Departamentos Principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextAreaField
                label="Lista de Departamentos"
                value={departments.listaDepartamentos || ""}
                onChange={(v) => updateDepartments("listaDepartamentos", v)}
                testId="input-lista-departamentos"
                rows={4}
              />
              
              <TextField
                label="Departamento con Más Personal"
                value={departments.deptoMasPersonal || ""}
                onChange={(v) => updateDepartments("deptoMasPersonal", v)}
                validated={departments.deptoMasPersonalValidated}
                onValidatedChange={(v) => updateDepartments("deptoMasPersonalValidated", v)}
                testId="input-depto-mas-personal"
              />

              <TextAreaField
                label="Observaciones sobre Estructura"
                value={departments.observaciones || ""}
                onChange={(v) => updateDepartments("observaciones", v)}
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
