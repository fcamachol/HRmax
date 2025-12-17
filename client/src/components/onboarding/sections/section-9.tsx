import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section9() {
  const { audit, updateSection } = useOnboarding();

  const section9 = (audit?.section9 || {}) as any;
  const contingencias = section9.contingencias || {};
  const demandas = section9.demandas || {};

  const updateContingencias = (field: string, value: string | boolean) => {
    updateSection("section9", {
      ...section9,
      contingencias: {
        ...contingencias,
        [field]: value,
      },
    });
  };

  const updateDemandas = (field: string, value: string | boolean) => {
    updateSection("section9", {
      ...section9,
      demandas: {
        ...demandas,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={9}
        title="Contingencias Laborales"
        subtitle="Demandas, riesgos y pasivos laborales"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pasivos Laborales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Pasivo por Antigüedad"
                  value={contingencias.pasivoAntiguedad || ""}
                  onChange={(v) => updateContingencias("pasivoAntiguedad", v)}
                  validated={contingencias.pasivoAntiguedadValidated}
                  onValidatedChange={(v) => updateContingencias("pasivoAntiguedadValidated", v)}
                  testId="input-pasivo-antiguedad"
                />
                <TextField
                  label="Pasivo por Vacaciones"
                  value={contingencias.pasivoVacaciones || ""}
                  onChange={(v) => updateContingencias("pasivoVacaciones", v)}
                  validated={contingencias.pasivoVacacionesValidated}
                  onValidatedChange={(v) => updateContingencias("pasivoVacacionesValidated", v)}
                  testId="input-pasivo-vacaciones"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Pasivo por Aguinaldo"
                  value={contingencias.pasivoAguinaldo || ""}
                  onChange={(v) => updateContingencias("pasivoAguinaldo", v)}
                  validated={contingencias.pasivoAguinaldoValidated}
                  onValidatedChange={(v) => updateContingencias("pasivoAguinaldoValidated", v)}
                  testId="input-pasivo-aguinaldo"
                />
                <TextField
                  label="Pasivo por PTU"
                  value={contingencias.pasivoPtu || ""}
                  onChange={(v) => updateContingencias("pasivoPtu", v)}
                  validated={contingencias.pasivoPtuValidated}
                  onValidatedChange={(v) => updateContingencias("pasivoPtuValidated", v)}
                  testId="input-pasivo-ptu"
                />
              </div>

              <TextAreaField
                label="Otros Pasivos Identificados"
                value={contingencias.otrosPasivos || ""}
                onChange={(v) => updateContingencias("otrosPasivos", v)}
                testId="input-otros-pasivos"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demandas Laborales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Demandas Activas"
                  value={demandas.demandasActivas || ""}
                  onChange={(v) => updateDemandas("demandasActivas", v)}
                  validated={demandas.demandasActivasValidated}
                  onValidatedChange={(v) => updateDemandas("demandasActivasValidated", v)}
                  testId="input-demandas-activas"
                  type="number"
                />
                <TextField
                  label="Monto Total en Litigio"
                  value={demandas.montoLitigio || ""}
                  onChange={(v) => updateDemandas("montoLitigio", v)}
                  validated={demandas.montoLitigioValidated}
                  onValidatedChange={(v) => updateDemandas("montoLitigioValidated", v)}
                  testId="input-monto-litigio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Demandas Últimos 12 Meses"
                  value={demandas.demandasUltimoAnio || ""}
                  onChange={(v) => updateDemandas("demandasUltimoAnio", v)}
                  validated={demandas.demandasUltimoAnioValidated}
                  onValidatedChange={(v) => updateDemandas("demandasUltimoAnioValidated", v)}
                  testId="input-demandas-ultimo-anio"
                  type="number"
                />
                <TextField
                  label="Demandas Ganadas/Perdidas"
                  value={demandas.resultadoDemandas || ""}
                  onChange={(v) => updateDemandas("resultadoDemandas", v)}
                  validated={demandas.resultadoDemandasValidated}
                  onValidatedChange={(v) => updateDemandas("resultadoDemandasValidated", v)}
                  testId="input-resultado-demandas"
                />
              </div>

              <TextAreaField
                label="Detalle de Demandas Activas"
                value={demandas.detalleDemandasActivas || ""}
                onChange={(v) => updateDemandas("detalleDemandasActivas", v)}
                testId="input-detalle-demandas"
                rows={4}
              />

              <TextAreaField
                label="Observaciones sobre Contingencias"
                value={demandas.observaciones || ""}
                onChange={(v) => updateDemandas("observaciones", v)}
                testId="input-observaciones-contingencias"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
