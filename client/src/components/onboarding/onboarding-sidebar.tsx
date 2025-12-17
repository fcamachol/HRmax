import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboarding } from "@/lib/onboarding-context";
import { cn } from "@/lib/utils";
import {
  Building2,
  Scale,
  Users,
  FileText,
  Clock,
  DollarSign,
  Shield,
  HardHat,
  GraduationCap,
  Monitor,
  ClipboardCheck,
  Save,
  Download,
  Check,
  Circle,
  Loader2,
  Upload,
} from "lucide-react";
import type { SectionStatus } from "@shared/schema";

const sections = [
  { number: 1, title: "Información General", icon: Building2 },
  { number: 2, title: "Cumplimiento Laboral", icon: Scale },
  { number: 3, title: "Estructura Organizacional", icon: Users },
  { number: 4, title: "Contratos y Documentación", icon: FileText },
  { number: 5, title: "Tiempo y Asistencia", icon: Clock },
  { number: 6, title: "Nómina y Compensaciones", icon: DollarSign },
  { number: 7, title: "Seguridad Social", icon: Shield },
  { number: 8, title: "Seguridad e Higiene", icon: HardHat },
  { number: 9, title: "Capacitación STPS", icon: GraduationCap },
  { number: 10, title: "Sistemas y Tecnología", icon: Monitor },
  { number: 11, title: "Hallazgos y Remediación", icon: ClipboardCheck },
  { number: 12, title: "Reporte de Auditoría", icon: FileText },
];

function StatusIcon({ status }: { status: SectionStatus }) {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-chart-2" />;
    case "in_progress":
      return <Loader2 className="h-4 w-4 animate-spin text-chart-4" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

export function OnboardingSidebar() {
  const {
    currentSection,
    setCurrentSection,
    getSectionStatus,
    getOverallProgress,
    saveAudit,
    isSaving,
  } = useOnboarding();

  const progress = getOverallProgress();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-border">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Auditoría HR</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {/* Tab de Documentos */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setCurrentSection(0)}
              className={cn(
                "w-full justify-start gap-3",
                currentSection === 0 && "bg-sidebar-accent"
              )}
              data-testid="nav-section-documents"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              <Upload className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 truncate text-sm font-medium">Carga de Documentos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <div className="my-2 border-t border-border" />

          {sections.map((section) => {
            const status = getSectionStatus(section.number);
            const isActive = currentSection === section.number;
            const Icon = section.icon;

            return (
              <SidebarMenuItem key={section.number}>
                <SidebarMenuButton
                  onClick={() => setCurrentSection(section.number)}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-sidebar-accent"
                  )}
                  data-testid={`nav-section-${section.number}`}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-medium">
                    {section.number}
                  </div>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-sm">{section.title}</span>
                  <StatusIcon status={status} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border space-y-2">
        <Button
          onClick={saveAudit}
          disabled={isSaving}
          className="w-full"
          data-testid="button-save-audit"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar
        </Button>
        <Button variant="outline" className="w-full" data-testid="button-export-audit">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
