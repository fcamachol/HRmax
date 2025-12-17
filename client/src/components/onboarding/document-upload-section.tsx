import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [isOpen, setIsOpen] = useState(true);
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
  const progress = Math.round((stats.requiredUploaded / stats.requiredTotal) * 100);

  return (
    <Card className="m-4 mb-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Carga de Documentos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {stats.requiredUploaded} de {stats.requiredTotal} documentos requeridos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={progress === 100 ? "default" : "secondary"}
                  className={cn(progress === 100 && "bg-chart-2 text-white")}
                >
                  {progress}% completo
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {documentCategories.map((category) => {
                  const Icon = category.icon;
                  const categoryDocs = category.documents;
                  const uploadedInCategory = categoryDocs.filter(
                    (doc) => uploadedDocs[doc.id]?.uploaded
                  ).length;
                  const isExpanded = expandedCategories.includes(category.id);

                  return (
                    <Card key={category.id} className="overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-3 hover-elevate text-left"
                        data-testid={`toggle-category-${category.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{category.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {uploadedInCategory}/{categoryDocs.length}
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border">
                          {categoryDocs.map((doc) => {
                            const isUploaded = uploadedDocs[doc.id]?.uploaded;

                            return (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border-b border-border last:border-b-0"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {isUploaded ? (
                                    <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />
                                  ) : doc.required ? (
                                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm truncate">{doc.name}</span>
                                      {doc.required && !isUploaded && (
                                        <Badge variant="destructive" className="text-xs shrink-0">
                                          Requerido
                                        </Badge>
                                      )}
                                    </div>
                                    {doc.description && (
                                      <p className="text-xs text-muted-foreground">
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
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Cargado
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-3 w-3 mr-1" />
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
