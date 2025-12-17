import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "../section-header";
import { TextField, TextAreaField } from "../form-fields";
import { useOnboarding } from "@/lib/onboarding-context";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Section12() {
  const { audit, updateSection } = useOnboarding();
  const { toast } = useToast();

  const section12 = (audit?.section12 || {}) as any;
  const resumen = section12.resumen || {};
  const firmas = section12.firmas || {};

  const updateResumen = (field: string, value: string | boolean) => {
    updateSection("section12", {
      ...section12,
      resumen: {
        ...resumen,
        [field]: value,
      },
    });
  };

  const updateFirmas = (field: string, value: string | boolean) => {
    updateSection("section12", {
      ...section12,
      firmas: {
        ...firmas,
        [field]: value,
      },
    });
  };

  const handleExportReport = () => {
    if (!audit) {
      toast({
        title: "Error",
        description: "No hay datos de auditoría para exportar",
        variant: "destructive",
      });
      return;
    }

    const reportContent = generateReportContent(audit);
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_hr_${audit.clienteId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Reporte Exportado",
      description: "El reporte de auditoría ha sido descargado exitosamente",
    });
  };

  const generateReportContent = (auditData: any): string => {
    const lines: string[] = [];
    lines.push("=".repeat(60));
    lines.push("REPORTE DE AUDITORÍA HR DUE DILIGENCE");
    lines.push("=".repeat(60));
    lines.push("");
    lines.push(`Fecha de Generación: ${new Date().toLocaleDateString('es-MX')}`);
    lines.push(`ID Cliente: ${auditData.clienteId}`);
    lines.push("");
    
    const sections = [
      { key: 'section1', title: '1. INFORMACIÓN GENERAL' },
      { key: 'section2', title: '2. ESTRUCTURA ORGANIZACIONAL' },
      { key: 'section3', title: '3. PERSONAL Y NÓMINA' },
      { key: 'section4', title: '4. SEGURIDAD SOCIAL' },
      { key: 'section5', title: '5. OBLIGACIONES FISCALES' },
      { key: 'section6', title: '6. DOCUMENTACIÓN LABORAL' },
      { key: 'section7', title: '7. POLÍTICAS Y REGLAMENTOS' },
      { key: 'section8', title: '8. PRESTACIONES Y BENEFICIOS' },
      { key: 'section9', title: '9. CONTINGENCIAS LABORALES' },
      { key: 'section10', title: '10. OUTSOURCING Y REPSE' },
      { key: 'section11', title: '11. OBSERVACIONES GENERALES' },
      { key: 'section12', title: '12. RESUMEN Y CONCLUSIONES' },
    ];

    sections.forEach(({ key, title }) => {
      lines.push("-".repeat(60));
      lines.push(title);
      lines.push("-".repeat(60));
      const sectionData = auditData[key] || {};
      formatSectionData(sectionData, lines, 0);
      lines.push("");
    });

    return lines.join("\n");
  };

  const formatSectionData = (data: any, lines: string[], indent: number) => {
    const prefix = "  ".repeat(indent);
    Object.entries(data).forEach(([key, value]) => {
      if (key.endsWith('Validated')) return;
      if (typeof value === 'object' && value !== null) {
        lines.push(`${prefix}${formatLabel(key)}:`);
        formatSectionData(value, lines, indent + 1);
      } else if (value) {
        lines.push(`${prefix}${formatLabel(key)}: ${value}`);
      }
    });
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        sectionNumber={12}
        title="Resumen y Conclusiones"
        subtitle="Dictamen final y exportación del reporte"
      />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen Ejecutivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Nivel de Riesgo General"
                  value={resumen.nivelRiesgo || ""}
                  onChange={(v) => updateResumen("nivelRiesgo", v)}
                  validated={resumen.nivelRiesgoValidated}
                  onValidatedChange={(v) => updateResumen("nivelRiesgoValidated", v)}
                  testId="input-nivel-riesgo"
                />
                <TextField
                  label="Calificación General"
                  value={resumen.calificacion || ""}
                  onChange={(v) => updateResumen("calificacion", v)}
                  validated={resumen.calificacionValidated}
                  onValidatedChange={(v) => updateResumen("calificacionValidated", v)}
                  testId="input-calificacion"
                />
              </div>

              <TextAreaField
                label="Conclusión General"
                value={resumen.conclusionGeneral || ""}
                onChange={(v) => updateResumen("conclusionGeneral", v)}
                testId="input-conclusion-general"
                rows={5}
              />

              <TextAreaField
                label="Dictamen Final"
                value={resumen.dictamenFinal || ""}
                onChange={(v) => updateResumen("dictamenFinal", v)}
                testId="input-dictamen-final"
                rows={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Firmas y Responsables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Auditor Responsable"
                  value={firmas.auditorResponsable || ""}
                  onChange={(v) => updateFirmas("auditorResponsable", v)}
                  validated={firmas.auditorResponsableValidated}
                  onValidatedChange={(v) => updateFirmas("auditorResponsableValidated", v)}
                  testId="input-auditor-responsable"
                />
                <TextField
                  label="Fecha de Auditoría"
                  value={firmas.fechaAuditoria || ""}
                  onChange={(v) => updateFirmas("fechaAuditoria", v)}
                  validated={firmas.fechaAuditoriaValidated}
                  onValidatedChange={(v) => updateFirmas("fechaAuditoriaValidated", v)}
                  testId="input-fecha-auditoria"
                  type="date"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Revisor"
                  value={firmas.revisor || ""}
                  onChange={(v) => updateFirmas("revisor", v)}
                  validated={firmas.revisorValidated}
                  onValidatedChange={(v) => updateFirmas("revisorValidated", v)}
                  testId="input-revisor"
                />
                <TextField
                  label="Fecha de Revisión"
                  value={firmas.fechaRevision || ""}
                  onChange={(v) => updateFirmas("fechaRevision", v)}
                  validated={firmas.fechaRevisionValidated}
                  onValidatedChange={(v) => updateFirmas("fechaRevisionValidated", v)}
                  testId="input-fecha-revision"
                  type="date"
                />
              </div>

              <TextAreaField
                label="Notas Adicionales"
                value={firmas.notasAdicionales || ""}
                onChange={(v) => updateFirmas("notasAdicionales", v)}
                testId="input-notas-adicionales"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Exportar Reporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Genera un reporte completo de la auditoría HR Due Diligence con todos los datos capturados en las 12 secciones.
              </p>
              <Button
                onClick={handleExportReport}
                className="gap-2"
                data-testid="button-export-report"
              >
                <Download className="w-4 h-4" />
                Descargar Reporte Completo
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
