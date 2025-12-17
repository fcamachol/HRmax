import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section6() {
  const { audit, updateSection } = useOnboarding();

  const section6 = (audit?.section6 || {}) as any;
  const contratos = section6.contratos || {};
  const expedientes = section6.expedientes || {};

  const updateContratos = (field: string, value: string | boolean) => {
    updateSection("section6", {
      ...section6,
      contratos: {
        ...contratos,
        [field]: value,
      },
    });
  };

  const updateExpedientes = (field: string, value: string | boolean) => {
    updateSection("section6", {
      ...section6,
      expedientes: {
        ...expedientes,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={6}
        title="Documentación Laboral"
        subtitle="Contratos, expedientes y documentación legal"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contratos de Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Tipo de Contrato Principal"
                  value={contratos.tipoContratoPrincipal || ""}
                  onChange={(v) => updateContratos("tipoContratoPrincipal", v)}
                  validated={contratos.tipoContratoPrincipalValidated}
                  onValidatedChange={(v) => updateContratos("tipoContratoPrincipalValidated", v)}
                  testId="input-tipo-contrato"
                />
                <TextField
                  label="Contratos Firmados (%)"
                  value={contratos.contratosFirmados || ""}
                  onChange={(v) => updateContratos("contratosFirmados", v)}
                  validated={contratos.contratosFirmadosValidated}
                  onValidatedChange={(v) => updateContratos("contratosFirmadosValidated", v)}
                  testId="input-contratos-firmados"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Contratos por Tiempo Indeterminado"
                  value={contratos.contratosIndeterminado || ""}
                  onChange={(v) => updateContratos("contratosIndeterminado", v)}
                  validated={contratos.contratosIndeterminadoValidated}
                  onValidatedChange={(v) => updateContratos("contratosIndeterminadoValidated", v)}
                  testId="input-contratos-indet"
                  type="number"
                />
                <TextField
                  label="Contratos por Tiempo Determinado"
                  value={contratos.contratosDeterminado || ""}
                  onChange={(v) => updateContratos("contratosDeterminado", v)}
                  validated={contratos.contratosDeterminadoValidated}
                  onValidatedChange={(v) => updateContratos("contratosDeterminadoValidated", v)}
                  testId="input-contratos-det"
                  type="number"
                />
              </div>

              <TextField
                label="Fecha Última Actualización de Contrato Modelo"
                value={contratos.fechaActualizacionModelo || ""}
                onChange={(v) => updateContratos("fechaActualizacionModelo", v)}
                validated={contratos.fechaActualizacionModeloValidated}
                onValidatedChange={(v) => updateContratos("fechaActualizacionModeloValidated", v)}
                testId="input-fecha-actualizacion"
                type="date"
              />

              <TextAreaField
                label="Observaciones sobre Contratos"
                value={contratos.observaciones || ""}
                onChange={(v) => updateContratos("observaciones", v)}
                testId="input-observaciones-contratos"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expedientes de Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Expedientes Completos (%)"
                  value={expedientes.expedientesCompletos || ""}
                  onChange={(v) => updateExpedientes("expedientesCompletos", v)}
                  validated={expedientes.expedientesCompletosValidated}
                  onValidatedChange={(v) => updateExpedientes("expedientesCompletosValidated", v)}
                  testId="input-expedientes-completos"
                />
                <TextField
                  label="Formato de Almacenamiento"
                  value={expedientes.formatoAlmacenamiento || ""}
                  onChange={(v) => updateExpedientes("formatoAlmacenamiento", v)}
                  validated={expedientes.formatoAlmacenamientoValidated}
                  onValidatedChange={(v) => updateExpedientes("formatoAlmacenamientoValidated", v)}
                  testId="input-formato-almacenamiento"
                />
              </div>

              <TextAreaField
                label="Documentos Incluidos en Expedientes"
                value={expedientes.documentosIncluidos || ""}
                onChange={(v) => updateExpedientes("documentosIncluidos", v)}
                testId="input-documentos-incluidos"
                rows={4}
              />

              <TextAreaField
                label="Observaciones sobre Expedientes"
                value={expedientes.observaciones || ""}
                onChange={(v) => updateExpedientes("observaciones", v)}
                testId="input-observaciones-expedientes"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
