import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section4() {
  const { audit, updateSection } = useOnboarding();

  const section4 = (audit?.section4 || {}) as any;
  const imss = section4.imss || {};
  const infonavit = section4.infonavit || {};

  const updateImss = (field: string, value: string | boolean) => {
    updateSection("section4", {
      ...section4,
      imss: {
        ...imss,
        [field]: value,
      },
    });
  };

  const updateInfonavit = (field: string, value: string | boolean) => {
    updateSection("section4", {
      ...section4,
      infonavit: {
        ...infonavit,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={4}
        title="Seguridad Social"
        subtitle="IMSS, Infonavit y cumplimiento"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información IMSS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Registro Patronal Principal"
                  value={imss.registroPatronal || ""}
                  onChange={(v) => updateImss("registroPatronal", v)}
                  validated={imss.registroPatronalValidated}
                  onValidatedChange={(v) => updateImss("registroPatronalValidated", v)}
                  testId="input-registro-patronal"
                  required
                />
                <TextField
                  label="Clase de Riesgo"
                  value={imss.claseRiesgo || ""}
                  onChange={(v) => updateImss("claseRiesgo", v)}
                  validated={imss.claseRiesgoValidated}
                  onValidatedChange={(v) => updateImss("claseRiesgoValidated", v)}
                  testId="input-clase-riesgo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Prima de Riesgo (%)"
                  value={imss.primaRiesgo || ""}
                  onChange={(v) => updateImss("primaRiesgo", v)}
                  validated={imss.primaRiesgoValidated}
                  onValidatedChange={(v) => updateImss("primaRiesgoValidated", v)}
                  testId="input-prima-riesgo"
                />
                <TextField
                  label="Fecha Última Determinación de Prima"
                  value={imss.fechaDeterminacionPrima || ""}
                  onChange={(v) => updateImss("fechaDeterminacionPrima", v)}
                  validated={imss.fechaDeterminacionPrimaValidated}
                  onValidatedChange={(v) => updateImss("fechaDeterminacionPrimaValidated", v)}
                  testId="input-fecha-determinacion"
                  type="date"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Número de Registros Patronales"
                  value={imss.numRegistrosPatronales || ""}
                  onChange={(v) => updateImss("numRegistrosPatronales", v)}
                  validated={imss.numRegistrosPatronalesValidated}
                  onValidatedChange={(v) => updateImss("numRegistrosPatronalesValidated", v)}
                  testId="input-num-registros"
                  type="number"
                />
                <TextField
                  label="Sistema SUA/IDSE"
                  value={imss.sistemaSuaIdse || ""}
                  onChange={(v) => updateImss("sistemaSuaIdse", v)}
                  validated={imss.sistemaSuaIdseValidated}
                  onValidatedChange={(v) => updateImss("sistemaSuaIdseValidated", v)}
                  testId="input-sistema-sua"
                />
              </div>

              <TextAreaField
                label="Observaciones IMSS"
                value={imss.observaciones || ""}
                onChange={(v) => updateImss("observaciones", v)}
                testId="input-observaciones-imss"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Infonavit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Trabajadores con Crédito"
                  value={infonavit.trabajadoresConCredito || ""}
                  onChange={(v) => updateInfonavit("trabajadoresConCredito", v)}
                  validated={infonavit.trabajadoresConCreditoValidated}
                  onValidatedChange={(v) => updateInfonavit("trabajadoresConCreditoValidated", v)}
                  testId="input-trab-con-credito"
                  type="number"
                />
                <TextField
                  label="Monto Mensual Retenciones"
                  value={infonavit.montoMensualRetenciones || ""}
                  onChange={(v) => updateInfonavit("montoMensualRetenciones", v)}
                  validated={infonavit.montoMensualRetencionesValidated}
                  onValidatedChange={(v) => updateInfonavit("montoMensualRetencionesValidated", v)}
                  testId="input-monto-retenciones"
                />
              </div>

              <TextAreaField
                label="Observaciones Infonavit"
                value={infonavit.observaciones || ""}
                onChange={(v) => updateInfonavit("observaciones", v)}
                testId="input-observaciones-infonavit"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
