import { useOnboarding } from "@/lib/onboarding-context";
import { Section1 } from "./section-1";
import { SectionHeader } from "../section-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sectionTitles: Record<number, { title: string; subtitle: string }> = {
  2: { title: "Cumplimiento Laboral", subtitle: "Obligaciones laborales y cumplimiento normativo" },
  3: { title: "Estructura Organizacional", subtitle: "Organigrama y definición de puestos" },
  4: { title: "Contratos y Documentación", subtitle: "Expedientes laborales y contratos" },
  5: { title: "Tiempo y Asistencia", subtitle: "Control de asistencia y jornada laboral" },
  6: { title: "Nómina y Compensaciones", subtitle: "Estructura de nómina y prestaciones" },
  7: { title: "Seguridad Social", subtitle: "IMSS, INFONAVIT y obligaciones" },
  8: { title: "Seguridad e Higiene", subtitle: "Normas de seguridad y comisiones" },
  9: { title: "Capacitación STPS", subtitle: "Programas de capacitación y DC-3" },
  10: { title: "Sistemas y Tecnología", subtitle: "Sistemas de gestión de nómina y RH" },
  11: { title: "Hallazgos y Remediación", subtitle: "Observaciones y plan de acción" },
  12: { title: "Reporte de Auditoría", subtitle: "Resumen ejecutivo y conclusiones" },
};

function PlaceholderSection({ sectionNumber }: { sectionNumber: number }) {
  const info = sectionTitles[sectionNumber];

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={sectionNumber}
        title={info.title}
        subtitle={info.subtitle}
      />
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{info.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta sección está en desarrollo. Aquí se mostrará el contenido de {info.title.toLowerCase()}.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

export function SectionRenderer() {
  const { currentSection } = useOnboarding();

  switch (currentSection) {
    case 1:
      return <Section1 />;
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
      return <PlaceholderSection sectionNumber={currentSection} />;
    default:
      return <Section1 />;
  }
}
