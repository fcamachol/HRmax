import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "../../lib/onboarding-context";
import { ChevronLeft, ChevronRight, Check, Circle, Loader2 } from "lucide-react";
import type { SectionStatus } from "@shared/schema";

interface SectionHeaderProps {
  sectionNumber: number;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ sectionNumber, title, subtitle }: SectionHeaderProps) {
  const { currentSection, setCurrentSection, getSectionStatus, markSectionComplete } = useOnboarding();
  const status: SectionStatus = getSectionStatus(sectionNumber);

  const statusBadge: Record<SectionStatus, { label: string; variant: "secondary" | "outline" | "default"; icon: typeof Circle }> = {
    pending: { label: "Pendiente", variant: "secondary", icon: Circle },
    in_progress: { label: "En Progreso", variant: "outline", icon: Loader2 },
    completed: { label: "Completado", variant: "default", icon: Check },
  };

  const { label, variant, icon: Icon } = statusBadge[status];

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-xl font-bold text-primary-foreground">
            {sectionNumber}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <Badge variant={variant} className="ml-4 gap-1">
            <Icon className={`h-3 w-3 ${status === "in_progress" ? "animate-spin" : ""}`} />
            {label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentSection === 1}
            onClick={() => setCurrentSection(currentSection - 1)}
            data-testid="button-previous-section"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          {status !== "completed" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markSectionComplete(sectionNumber)}
              data-testid="button-mark-complete"
            >
              <Check className="mr-1 h-4 w-4" />
              Marcar Completo
            </Button>
          )}
          <Button
            size="sm"
            disabled={currentSection === 12}
            onClick={() => setCurrentSection(currentSection + 1)}
            data-testid="button-next-section"
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
