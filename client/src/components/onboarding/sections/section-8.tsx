import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";

export function Section8() {
  const { audit, updateSection } = useOnboarding();

  const section8 = (audit?.section8 || {}) as any;
  const prestaciones = section8.prestaciones || {};
  const beneficios = section8.beneficios || {};

  const updatePrestaciones = (field: string, value: string | boolean) => {
    updateSection("section8", {
      ...section8,
      prestaciones: {
        ...prestaciones,
        [field]: value,
      },
    });
  };

  const updateBeneficios = (field: string, value: string | boolean) => {
    updateSection("section8", {
      ...section8,
      beneficios: {
        ...beneficios,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={8}
        title="Prestaciones y Beneficios"
        subtitle="Prestaciones de ley y superiores"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prestaciones de Ley</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Aguinaldo (días)"
                  value={prestaciones.aguinaldoDias || ""}
                  onChange={(v) => updatePrestaciones("aguinaldoDias", v)}
                  validated={prestaciones.aguinaldoDiasValidated}
                  onValidatedChange={(v) => updatePrestaciones("aguinaldoDiasValidated", v)}
                  testId="input-aguinaldo-dias"
                  type="number"
                />
                <TextField
                  label="Prima Vacacional (%)"
                  value={prestaciones.primaVacacional || ""}
                  onChange={(v) => updatePrestaciones("primaVacacional", v)}
                  validated={prestaciones.primaVacacionalValidated}
                  onValidatedChange={(v) => updatePrestaciones("primaVacacionalValidated", v)}
                  testId="input-prima-vacacional"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Días de Vacaciones (primer año)"
                  value={prestaciones.vacacionesPrimerAnio || ""}
                  onChange={(v) => updatePrestaciones("vacacionesPrimerAnio", v)}
                  validated={prestaciones.vacacionesPrimerAnioValidated}
                  onValidatedChange={(v) => updatePrestaciones("vacacionesPrimerAnioValidated", v)}
                  testId="input-vacaciones-primer-anio"
                  type="number"
                />
                <TextField
                  label="PTU Pagado Último Año"
                  value={prestaciones.ptuUltimoAnio || ""}
                  onChange={(v) => updatePrestaciones("ptuUltimoAnio", v)}
                  validated={prestaciones.ptuUltimoAnioValidated}
                  onValidatedChange={(v) => updatePrestaciones("ptuUltimoAnioValidated", v)}
                  testId="input-ptu-ultimo-anio"
                />
              </div>

              <TextAreaField
                label="Observaciones Prestaciones de Ley"
                value={prestaciones.observaciones || ""}
                onChange={(v) => updatePrestaciones("observaciones", v)}
                testId="input-observaciones-prestaciones"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beneficios Superiores a Ley</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Vales de Despensa"
                  value={beneficios.valesDespensa || ""}
                  onChange={(v) => updateBeneficios("valesDespensa", v)}
                  validated={beneficios.valesDespensaValidated}
                  onValidatedChange={(v) => updateBeneficios("valesDespensaValidated", v)}
                  testId="input-vales-despensa"
                />
                <TextField
                  label="Seguro de Gastos Médicos"
                  value={beneficios.seguroGastosMedicos || ""}
                  onChange={(v) => updateBeneficios("seguroGastosMedicos", v)}
                  validated={beneficios.seguroGastosMedicosValidated}
                  onValidatedChange={(v) => updateBeneficios("seguroGastosMedicosValidated", v)}
                  testId="input-seguro-gastos-medicos"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Fondo de Ahorro"
                  value={beneficios.fondoAhorro || ""}
                  onChange={(v) => updateBeneficios("fondoAhorro", v)}
                  validated={beneficios.fondoAhorroValidated}
                  onValidatedChange={(v) => updateBeneficios("fondoAhorroValidated", v)}
                  testId="input-fondo-ahorro"
                />
                <TextField
                  label="Seguro de Vida"
                  value={beneficios.seguroVida || ""}
                  onChange={(v) => updateBeneficios("seguroVida", v)}
                  validated={beneficios.seguroVidaValidated}
                  onValidatedChange={(v) => updateBeneficios("seguroVidaValidated", v)}
                  testId="input-seguro-vida"
                />
              </div>

              <TextAreaField
                label="Otros Beneficios"
                value={beneficios.otrosBeneficios || ""}
                onChange={(v) => updateBeneficios("otrosBeneficios", v)}
                testId="input-otros-beneficios"
                rows={4}
              />

              <TextAreaField
                label="Observaciones sobre Beneficios"
                value={beneficios.observaciones || ""}
                onChange={(v) => updateBeneficios("observaciones", v)}
                testId="input-observaciones-beneficios"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
