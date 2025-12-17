import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";
import type { Section1 as Section1Type } from "@shared/schema";

export function Section1() {
  const { audit, updateSection } = useOnboarding();

  const section1 = (audit?.section1 || {}) as Section1Type;
  const identification = section1.identification || {};
  const legalRep = section1.legalRepresentative || {};

  const updateIdentification = (field: string, value: string | boolean) => {
    updateSection("section1", {
      ...section1,
      identification: {
        ...identification,
        [field]: value,
      },
    });
  };

  const updateLegalRep = (field: string, value: string | boolean) => {
    updateSection("section1", {
      ...section1,
      legalRepresentative: {
        ...legalRep,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={1}
        title="Información General"
        subtitle="Identificación de la empresa y representante legal"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identificación de la Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Razón Social"
                  value={identification.razonSocial || ""}
                  onChange={(v) => updateIdentification("razonSocial", v)}
                  validated={identification.razonSocialValidated}
                  onValidatedChange={(v) => updateIdentification("razonSocialValidated", v)}
                  testId="input-razon-social"
                  required
                />
                <TextField
                  label="Nombre Comercial"
                  value={identification.nombreComercial || ""}
                  onChange={(v) => updateIdentification("nombreComercial", v)}
                  validated={identification.nombreComercialValidated}
                  onValidatedChange={(v) => updateIdentification("nombreComercialValidated", v)}
                  testId="input-nombre-comercial"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="RFC"
                  value={identification.rfc || ""}
                  onChange={(v) => updateIdentification("rfc", v)}
                  validated={identification.rfcValidated}
                  onValidatedChange={(v) => updateIdentification("rfcValidated", v)}
                  testId="input-rfc"
                  required
                />
                <TextField
                  label="Régimen Fiscal"
                  value={identification.regimenFiscal || ""}
                  onChange={(v) => updateIdentification("regimenFiscal", v)}
                  validated={identification.regimenFiscalValidated}
                  onValidatedChange={(v) => updateIdentification("regimenFiscalValidated", v)}
                  testId="input-regimen-fiscal"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Fecha de Constitución"
                  value={identification.fechaConstitucion || ""}
                  onChange={(v) => updateIdentification("fechaConstitucion", v)}
                  validated={identification.fechaConstitucionValidated}
                  onValidatedChange={(v) => updateIdentification("fechaConstitucionValidated", v)}
                  testId="input-fecha-constitucion"
                  type="date"
                />
                <TextField
                  label="Teléfono Principal"
                  value={identification.telefonoPrincipal || ""}
                  onChange={(v) => updateIdentification("telefonoPrincipal", v)}
                  validated={identification.telefonoPrincipalValidated}
                  onValidatedChange={(v) => updateIdentification("telefonoPrincipalValidated", v)}
                  testId="input-telefono"
                />
              </div>

              <TextField
                label="Domicilio Fiscal"
                value={identification.domicilioFiscal || ""}
                onChange={(v) => updateIdentification("domicilioFiscal", v)}
                validated={identification.domicilioFiscalValidated}
                onValidatedChange={(v) => updateIdentification("domicilioFiscalValidated", v)}
                testId="input-domicilio-fiscal"
              />

              <TextField
                label="Sitio Web"
                value={identification.sitioWeb || ""}
                onChange={(v) => updateIdentification("sitioWeb", v)}
                validated={identification.sitioWebValidated}
                onValidatedChange={(v) => updateIdentification("sitioWebValidated", v)}
                testId="input-sitio-web"
              />

              <TextAreaField
                label="Objeto Social"
                value={identification.objetoSocial || ""}
                onChange={(v) => updateIdentification("objetoSocial", v)}
                testId="input-objeto-social"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Representante Legal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Nombre Completo"
                  value={legalRep.nombreCompleto || ""}
                  onChange={(v) => updateLegalRep("nombreCompleto", v)}
                  validated={legalRep.nombreCompletoValidated}
                  onValidatedChange={(v) => updateLegalRep("nombreCompletoValidated", v)}
                  testId="input-rep-nombre"
                  required
                />
                <TextField
                  label="Cargo"
                  value={legalRep.cargo || ""}
                  onChange={(v) => updateLegalRep("cargo", v)}
                  validated={legalRep.cargoValidated}
                  onValidatedChange={(v) => updateLegalRep("cargoValidated", v)}
                  testId="input-rep-cargo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="RFC del Representante"
                  value={legalRep.rfc || ""}
                  onChange={(v) => updateLegalRep("rfc", v)}
                  validated={legalRep.rfcValidated}
                  onValidatedChange={(v) => updateLegalRep("rfcValidated", v)}
                  testId="input-rep-rfc"
                />
                <TextField
                  label="CURP del Representante"
                  value={legalRep.curp || ""}
                  onChange={(v) => updateLegalRep("curp", v)}
                  validated={legalRep.curpValidated}
                  onValidatedChange={(v) => updateLegalRep("curpValidated", v)}
                  testId="input-rep-curp"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Tipo de Poder"
                  value={legalRep.tipoPoder || ""}
                  onChange={(v) => updateLegalRep("tipoPoder", v)}
                  validated={legalRep.tipoPoderValidated}
                  onValidatedChange={(v) => updateLegalRep("tipoPoderValidated", v)}
                  testId="input-rep-tipo-poder"
                />
                <TextField
                  label="Vigencia del Poder"
                  value={legalRep.vigenciaPoder || ""}
                  onChange={(v) => updateLegalRep("vigenciaPoder", v)}
                  validated={legalRep.vigenciaPoderValidated}
                  onValidatedChange={(v) => updateLegalRep("vigenciaPoderValidated", v)}
                  testId="input-rep-vigencia-poder"
                />
              </div>

              <TextField
                label="Notaría / Escritura"
                value={legalRep.notariaEscritura || ""}
                onChange={(v) => updateLegalRep("notariaEscritura", v)}
                validated={legalRep.notariaEscrituraValidated}
                onValidatedChange={(v) => updateLegalRep("notariaEscrituraValidated", v)}
                testId="input-rep-notaria"
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
