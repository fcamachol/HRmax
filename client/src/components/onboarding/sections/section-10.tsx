import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section10() {
  const { audit, updateSection } = useOnboarding();

  const section10 = (audit?.section10 || {}) as any;
  const sistemas = section10.sistemas || {};
  const integracion = section10.integracion || {};

  const updateSistemas = (field: string, value: string | boolean) => {
    updateSection("section10", {
      ...section10,
      sistemas: {
        ...sistemas,
        [field]: value,
      },
    });
  };

  const updateIntegracion = (field: string, value: string | boolean) => {
    updateSection("section10", {
      ...section10,
      integracion: {
        ...integracion,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={10}
        title="Sistemas y Tecnología"
        subtitle="Sistemas de gestión de nómina y RH"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sistemas Actuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Sistema de Nómina"
                  value={sistemas.sistemaNomina || ""}
                  onChange={(v) => updateSistemas("sistemaNomina", v)}
                  validated={sistemas.sistemaNominaValidated}
                  onValidatedChange={(v) => updateSistemas("sistemaNominaValidated", v)}
                  testId="input-sistema-nomina-actual"
                />
                <TextField
                  label="Sistema de RH/Capital Humano"
                  value={sistemas.sistemaRH || ""}
                  onChange={(v) => updateSistemas("sistemaRH", v)}
                  validated={sistemas.sistemaRHValidated}
                  onValidatedChange={(v) => updateSistemas("sistemaRHValidated", v)}
                  testId="input-sistema-rh"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Sistema de Control de Asistencia"
                  value={sistemas.sistemaAsistencia || ""}
                  onChange={(v) => updateSistemas("sistemaAsistencia", v)}
                  validated={sistemas.sistemaAsistenciaValidated}
                  onValidatedChange={(v) => updateSistemas("sistemaAsistenciaValidated", v)}
                  testId="input-sistema-asistencia"
                />
                <TextField
                  label="Sistema Contable"
                  value={sistemas.sistemaContable || ""}
                  onChange={(v) => updateSistemas("sistemaContable", v)}
                  validated={sistemas.sistemaContableValidated}
                  onValidatedChange={(v) => updateSistemas("sistemaContableValidated", v)}
                  testId="input-sistema-contable"
                />
              </div>

              <TextField
                label="Proveedor de Timbrado CFDI"
                value={sistemas.proveedorTimbrado || ""}
                onChange={(v) => updateSistemas("proveedorTimbrado", v)}
                validated={sistemas.proveedorTimbradoValidated}
                onValidatedChange={(v) => updateSistemas("proveedorTimbradoValidated", v)}
                testId="input-proveedor-timbrado"
              />

              <TextAreaField
                label="Otros Sistemas Utilizados"
                value={sistemas.otrosSistemas || ""}
                onChange={(v) => updateSistemas("otrosSistemas", v)}
                testId="input-otros-sistemas"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integración y Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Sistemas Integrados"
                  value={integracion.sistemasIntegrados || ""}
                  onChange={(v) => updateIntegracion("sistemasIntegrados", v)}
                  validated={integracion.sistemasIntegradosValidated}
                  onValidatedChange={(v) => updateIntegracion("sistemasIntegradosValidated", v)}
                  testId="input-sistemas-integrados"
                />
                <TextField
                  label="Respaldos de Información"
                  value={integracion.respaldos || ""}
                  onChange={(v) => updateIntegracion("respaldos", v)}
                  validated={integracion.respaldosValidated}
                  onValidatedChange={(v) => updateIntegracion("respaldosValidated", v)}
                  testId="input-respaldos"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Calidad de Datos (%)"
                  value={integracion.calidadDatos || ""}
                  onChange={(v) => updateIntegracion("calidadDatos", v)}
                  validated={integracion.calidadDatosValidated}
                  onValidatedChange={(v) => updateIntegracion("calidadDatosValidated", v)}
                  testId="input-calidad-datos"
                />
                <TextField
                  label="Migración Necesaria"
                  value={integracion.migracionNecesaria || ""}
                  onChange={(v) => updateIntegracion("migracionNecesaria", v)}
                  validated={integracion.migracionNecesariaValidated}
                  onValidatedChange={(v) => updateIntegracion("migracionNecesariaValidated", v)}
                  testId="input-migracion"
                />
              </div>

              <TextAreaField
                label="Observaciones sobre Sistemas"
                value={integracion.observaciones || ""}
                onChange={(v) => updateIntegracion("observaciones", v)}
                testId="input-observaciones-sistemas"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
