import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import type { HiringProcess } from "@shared/schema";

interface CartaOfertaProps {
  process: HiringProcess;
}

export function CartaOferta({ process }: CartaOfertaProps) {
  const nombreCompleto = `${process.nombre} ${process.apellidoPaterno}${process.apellidoMaterno ? ' ' + process.apellidoMaterno : ''}`.trim();
  
  // Validar que tengamos los datos necesarios
  if (!process || !process.nombre || !process.apellidoPaterno || !process.position || !process.proposedSalary) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No se puede generar la carta. Faltan datos requeridos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oferta_${nombreCompleto.replace(/\s/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTextContent = () => {
    let text = `CARTA OFERTA DE EMPLEO\n\n`;
    text += `Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    text += `Estimado(a) ${nombreCompleto},\n\n`;
    text += `Nos complace ofrecerle el puesto de ${process.position} en nuestro departamento de ${process.department}.\n\n`;
    text += `TÉRMINOS DE LA OFERTA:\n\n`;
    text += `Puesto: ${process.position}\n`;
    text += `Departamento: ${process.department}\n`;
    text += `Salario Mensual Bruto: $${parseFloat(process.proposedSalary).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    text += `Tipo de Contrato: ${process.contractType}\n`;
    text += `Fecha de Inicio Propuesta: ${new Date(process.startDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    text += `Por favor, confirme su aceptación de esta oferta firmando esta carta.\n\n`;
    text += `Atentamente,\n`;
    text += `Recursos Humanos\n\n`;
    text += `_________________________          _________________________\n`;
    text += `      Candidato                         Empresa\n`;
    
    return text;
  };

  const tipoContratoLabel = {
    planta: "Planta (Indefinido)",
    temporal: "Temporal",
    por_obra: "Por Obra Determinada",
    honorarios: "Honorarios",
    practicante: "Practicante",
  }[process.contractType] || process.contractType;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Carta Oferta de Empleo</h3>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            data-testid="button-download-oferta"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            data-testid="button-print-oferta"
          >
            <FileText className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">CARTA OFERTA DE EMPLEO</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Greeting */}
          <div className="space-y-4">
            <p>Estimado(a) <span className="font-semibold">{nombreCompleto}</span>,</p>
            <p>
              Nos complace ofrecerle el puesto de <span className="font-semibold">{process.position}</span> en 
              nuestro departamento de <span className="font-semibold">{process.department}</span>.
            </p>
          </div>

          {/* Terms */}
          <div className="space-y-4 border-t border-b py-6">
            <h3 className="font-bold text-lg">Términos de la Oferta</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Puesto</p>
                <p className="font-medium">{process.position}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departamento</p>
                <p className="font-medium">{process.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Salario Mensual Bruto</p>
                <p className="font-medium text-lg">
                  ${parseFloat(process.proposedSalary).toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
                <p className="font-medium">{tipoContratoLabel}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Fecha de Inicio Propuesta</p>
              <p className="font-medium">
                {new Date(process.startDate).toLocaleDateString('es-MX', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Prestaciones</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Seguro Social (IMSS) conforme a la Ley Federal del Trabajo</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Aguinaldo equivalente a 15 días de salario (mínimo legal)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Vacaciones conforme a la antigüedad según la LFT</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Prima vacacional del 25% (mínimo legal)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Infonavit para crédito de vivienda</span>
              </li>
            </ul>
          </div>

          {/* Additional Notes */}
          {process.notes && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-bold">Notas Adicionales</h3>
              <p className="text-sm">{process.notes}</p>
            </div>
          )}

          {/* Acceptance */}
          <div className="text-sm space-y-2 border-t pt-4">
            <p>
              Para aceptar esta oferta, por favor firme y envíe esta carta dentro de los próximos 5 días hábiles.
            </p>
            <p>
              Quedamos a su disposición para cualquier aclaración o duda que pueda tener sobre esta oferta.
            </p>
          </div>

          {/* Closing */}
          <div className="space-y-2">
            <p>Atentamente,</p>
            <p className="font-semibold">Departamento de Recursos Humanos</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="space-y-4">
              <div className="border-t-2 border-foreground pt-2">
                <p className="font-medium text-center">Aceptación del Candidato</p>
                <p className="text-sm text-muted-foreground text-center">{process.candidateName}</p>
                <p className="text-xs text-muted-foreground text-center mt-2">Fecha: _____________</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-t-2 border-foreground pt-2">
                <p className="font-medium text-center">Firma de la Empresa</p>
                <p className="text-sm text-muted-foreground text-center">Recursos Humanos</p>
                <p className="text-xs text-muted-foreground text-center mt-2">Fecha: _____________</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
