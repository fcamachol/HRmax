import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Shield,
  Scale,
  GraduationCap,
  HardHat,
  DollarSign,
  FileCheck,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { cn } from "@/lib/utils";

interface DocumentCategory {
  id: string;
  name: string;
  icon: typeof FileText;
  documents: DocumentItem[];
}

interface DocumentItem {
  id: string;
  name: string;
  required: boolean;
  description?: string;
}

const documentCategories: DocumentCategory[] = [
  {
    id: "legal",
    name: "Documentos Legales de la Empresa",
    icon: Building2,
    documents: [
      { id: "acta_constitutiva", name: "Acta Constitutiva", required: true, description: "Con todas las modificaciones" },
      { id: "rfc", name: "Constancia de Situación Fiscal (RFC)", required: true },
      { id: "comprobante_domicilio", name: "Comprobante de Domicilio Fiscal", required: true },
      { id: "poder_representante", name: "Poder del Representante Legal", required: true },
      { id: "ine_representante", name: "INE del Representante Legal", required: true },
    ],
  },
  {
    id: "imss",
    name: "Seguridad Social (IMSS/Infonavit)",
    icon: Shield,
    documents: [
      { id: "registro_patronal", name: "Registro Patronal IMSS", required: true },
      { id: "opinion_cumplimiento_imss", name: "Opinión de Cumplimiento IMSS", required: true, description: "Vigente" },
      { id: "opinion_cumplimiento_infonavit", name: "Opinión de Cumplimiento Infonavit", required: true },
      { id: "determinacion_prima", name: "Determinación de Prima de Riesgo", required: true },
      { id: "sua_ultimo_bimestre", name: "SUA Último Bimestre Pagado", required: true },
      { id: "ema_recientes", name: "EMA (Últimos 3 meses)", required: false },
    ],
  },
  {
    id: "laboral",
    name: "Documentación Laboral",
    icon: Scale,
    documents: [
      { id: "reglamento_interior", name: "Reglamento Interior de Trabajo", required: true, description: "Depositado ante STPS" },
      { id: "contrato_colectivo", name: "Contrato Colectivo de Trabajo", required: false, description: "Si aplica" },
      { id: "contrato_individual_modelo", name: "Contrato Individual (Modelo)", required: true },
      { id: "politica_vacaciones", name: "Política de Vacaciones", required: false },
      { id: "politica_faltas", name: "Política de Faltas y Retardos", required: false },
    ],
  },
  {
    id: "expedientes",
    name: "Expedientes de Personal",
    icon: Users,
    documents: [
      { id: "plantilla_personal", name: "Plantilla de Personal Actual", required: true, description: "Lista de empleados activos" },
      { id: "expedientes_muestra", name: "Expedientes de Muestra (5-10)", required: true, description: "Para verificación" },
      { id: "organigrama", name: "Organigrama Actualizado", required: true },
      { id: "descripciones_puesto", name: "Descripciones de Puesto", required: false },
    ],
  },
  {
    id: "nomina",
    name: "Nómina y Compensaciones",
    icon: DollarSign,
    documents: [
      { id: "recibos_nomina", name: "Recibos de Nómina (Últimos 3 períodos)", required: true },
      { id: "cfdi_timbrado", name: "CFDI de Nómina Timbrados", required: true },
      { id: "layout_dispersion", name: "Layout de Dispersión Bancaria", required: false },
      { id: "tabulador_salarios", name: "Tabulador de Salarios", required: false },
      { id: "politica_prestaciones", name: "Política de Prestaciones", required: false },
    ],
  },
  {
    id: "seguridad_higiene",
    name: "Seguridad e Higiene",
    icon: HardHat,
    documents: [
      { id: "acta_comision_seguridad", name: "Acta de Comisión Mixta de Seguridad e Higiene", required: true },
      { id: "programa_seguridad", name: "Programa de Seguridad e Higiene", required: true },
      { id: "recorridos_verificacion", name: "Actas de Recorridos de Verificación", required: false },
      { id: "plan_emergencia", name: "Plan de Emergencia", required: false },
      { id: "nom035_diagnostico", name: "Diagnóstico NOM-035", required: true },
    ],
  },
  {
    id: "capacitacion",
    name: "Capacitación STPS",
    icon: GraduationCap,
    documents: [
      { id: "plan_capacitacion", name: "Plan de Capacitación Anual", required: true },
      { id: "constancias_dc3", name: "Constancias DC-3 (Muestra)", required: true },
      { id: "acta_comision_capacitacion", name: "Acta de Comisión Mixta de Capacitación", required: true },
      { id: "lista_cursos", name: "Lista de Cursos Impartidos", required: false },
      { id: "registro_agente_capacitador", name: "Registro de Agente Capacitador", required: false, description: "Si usa externo" },
    ],
  },
  {
    id: "fiscal",
    name: "Documentos Fiscales",
    icon: FileCheck,
    documents: [
      { id: "opinion_32d", name: "Opinión de Cumplimiento 32-D SAT", required: true },
      { id: "declaraciones_isr", name: "Declaraciones ISR Retenido (Últimos 6 meses)", required: true },
      { id: "balanza_comprobacion", name: "Balanza de Comprobación", required: false },
    ],
  },
];

export function DocumentUploadSection() {
  const { audit, updateSection } = useOnboarding();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["legal"]);

  const uploadedDocs = (audit?.section1 as any)?.documentosSubidos || {};

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleFileUpload = (docId: string) => {
    const currentDocs = (audit?.section1 as any)?.documentosSubidos || {};
    const currentSection1 = audit?.section1 || {};
    const updatedSection = {
      ...currentSection1,
      documentosSubidos: {
        ...currentDocs,
        [docId]: {
          uploaded: true,
          uploadedAt: new Date().toISOString(),
        },
      },
    };
    updateSection("section1", updatedSection as any);
  };

  const getUploadStats = () => {
    const allDocs = documentCategories.flatMap((cat) => cat.documents);
    const requiredDocs = allDocs.filter((doc) => doc.required);
    const uploadedCount = Object.keys(uploadedDocs).filter(
      (key) => uploadedDocs[key]?.uploaded
    ).length;
    const requiredUploaded = requiredDocs.filter(
      (doc) => uploadedDocs[doc.id]?.uploaded
    ).length;

    return {
      total: allDocs.length,
      uploaded: uploadedCount,
      requiredTotal: requiredDocs.length,
      requiredUploaded,
    };
  };

  const stats = getUploadStats();
  const progressPercent = Math.round((stats.requiredUploaded / stats.requiredTotal) * 100);

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Carga de Documentos</h1>
            <p className="text-muted-foreground">
              Sube los documentos requeridos para completar la auditoría
            </p>
          </div>
          <Badge
            variant={progressPercent === 100 ? "default" : "secondary"}
            className={cn("text-sm px-3 py-1", progressPercent === 100 && "bg-chart-2 text-white")}
          >
            {progressPercent}% completo
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {stats.requiredUploaded} de {stats.requiredTotal} requeridos
          </span>
        </div>
      </div>

      {/* Document Categories */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {documentCategories.map((category) => {
            const Icon = category.icon;
            const categoryDocs = category.documents;
            const uploadedInCategory = categoryDocs.filter(
              (doc) => uploadedDocs[doc.id]?.uploaded
            ).length;
            const requiredInCategory = categoryDocs.filter((doc) => doc.required).length;
            const requiredUploadedInCategory = categoryDocs.filter(
              (doc) => doc.required && uploadedDocs[doc.id]?.uploaded
            ).length;
            const isExpanded = expandedCategories.includes(category.id);
            const categoryComplete = requiredUploadedInCategory === requiredInCategory;

            return (
              <Card key={category.id} className="overflow-visible">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 hover-elevate text-left rounded-md"
                  data-testid={`toggle-category-${category.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md",
                      categoryComplete ? "bg-chart-2/10" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        categoryComplete ? "text-chart-2" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {uploadedInCategory}/{categoryDocs.length} cargados
                        </Badge>
                        {categoryComplete && (
                          <CheckCircle2 className="h-4 w-4 text-chart-2" />
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border mx-4 mb-4">
                    {categoryDocs.map((doc) => {
                      const isUploaded = uploadedDocs[doc.id]?.uploaded;

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {isUploaded ? (
                              <CheckCircle2 className="h-5 w-5 text-chart-2 shrink-0" />
                            ) : doc.required ? (
                              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm">{doc.name}</span>
                                {doc.required && !isUploaded && (
                                  <Badge variant="destructive" className="text-xs shrink-0">
                                    Requerido
                                  </Badge>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {doc.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isUploaded ? "outline" : "default"}
                            onClick={() => handleFileUpload(doc.id)}
                            data-testid={`upload-${doc.id}`}
                          >
                            {isUploaded ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Cargado
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-1.5" />
                                Cargar
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
