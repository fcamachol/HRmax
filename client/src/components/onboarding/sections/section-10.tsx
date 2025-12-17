import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section10() {
  const { audit, updateSection } = useOnboarding();

  const section10 = (audit?.section10 || {}) as any;
  const outsourcing = section10.outsourcing || {};
  const repse = section10.repse || {};

  const updateOutsourcing = (field: string, value: string | boolean) => {
    updateSection("section10", {
      ...section10,
      outsourcing: {
        ...outsourcing,
        [field]: value,
      },
    });
  };

  const updateRepse = (field: string, value: string | boolean) => {
    updateSection("section10", {
      ...section10,
      repse: {
        ...repse,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={10}
        title="Outsourcing y REPSE"
        subtitle="Servicios especializados y cumplimiento REPSE"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Servicios Especializados Contratados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Número de Proveedores con REPSE"
                  value={outsourcing.proveedoresRepse || ""}
                  onChange={(v) => updateOutsourcing("proveedoresRepse", v)}
                  validated={outsourcing.proveedoresRepseValidated}
                  onValidatedChange={(v) => updateOutsourcing("proveedoresRepseValidated", v)}
                  testId="input-proveedores-repse"
                  type="number"
                />
                <TextField
                  label="Monto Mensual Servicios"
                  value={outsourcing.montoMensualServicios || ""}
                  onChange={(v) => updateOutsourcing("montoMensualServicios", v)}
                  validated={outsourcing.montoMensualServiciosValidated}
                  onValidatedChange={(v) => updateOutsourcing("montoMensualServiciosValidated", v)}
                  testId="input-monto-servicios"
                />
              </div>

              <TextAreaField
                label="Servicios Contratados"
                value={outsourcing.serviciosContratados || ""}
                onChange={(v) => updateOutsourcing("serviciosContratados", v)}
                testId="input-servicios-contratados"
                rows={4}
              />

              <TextField
                label="Contratos Vigentes Verificados"
                value={outsourcing.contratosVerificados || ""}
                onChange={(v) => updateOutsourcing("contratosVerificados", v)}
                validated={outsourcing.contratosVerificadosValidated}
                onValidatedChange={(v) => updateOutsourcing("contratosVerificadosValidated", v)}
                testId="input-contratos-verificados"
              />

              <TextAreaField
                label="Observaciones Outsourcing"
                value={outsourcing.observaciones || ""}
                onChange={(v) => updateOutsourcing("observaciones", v)}
                testId="input-observaciones-outsourcing"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registro REPSE Propio (si aplica)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Número de Registro REPSE"
                  value={repse.numeroRegistro || ""}
                  onChange={(v) => updateRepse("numeroRegistro", v)}
                  validated={repse.numeroRegistroValidated}
                  onValidatedChange={(v) => updateRepse("numeroRegistroValidated", v)}
                  testId="input-numero-repse"
                />
                <TextField
                  label="Fecha de Registro"
                  value={repse.fechaRegistro || ""}
                  onChange={(v) => updateRepse("fechaRegistro", v)}
                  validated={repse.fechaRegistroValidated}
                  onValidatedChange={(v) => updateRepse("fechaRegistroValidated", v)}
                  testId="input-fecha-registro-repse"
                  type="date"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Vigencia Registro"
                  value={repse.vigenciaRegistro || ""}
                  onChange={(v) => updateRepse("vigenciaRegistro", v)}
                  validated={repse.vigenciaRegistroValidated}
                  onValidatedChange={(v) => updateRepse("vigenciaRegistroValidated", v)}
                  testId="input-vigencia-repse"
                  type="date"
                />
                <TextField
                  label="Servicios Registrados"
                  value={repse.serviciosRegistrados || ""}
                  onChange={(v) => updateRepse("serviciosRegistrados", v)}
                  validated={repse.serviciosRegistradosValidated}
                  onValidatedChange={(v) => updateRepse("serviciosRegistradosValidated", v)}
                  testId="input-servicios-registrados"
                />
              </div>

              <TextAreaField
                label="Observaciones REPSE"
                value={repse.observaciones || ""}
                onChange={(v) => updateRepse("observaciones", v)}
                testId="input-observaciones-repse"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
