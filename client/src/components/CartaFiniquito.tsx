import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import type { calcularFiniquito } from "@shared/finiquitoCalculations";

type FiniquitoCalculado = ReturnType<typeof calcularFiniquito>;

interface CartaFiniquitoProps {
  employeeName: string;
  employeeId?: string;
  fechaTerminacion: string;
  calculo: FiniquitoCalculado;
  esLiquidacion: boolean;
}

export function CartaFiniquito({
  employeeName,
  employeeId,
  fechaTerminacion,
  calculo,
  esLiquidacion,
}: CartaFiniquitoProps) {
  // Validar que tengamos los datos necesarios
  if (!calculo || !fechaTerminacion || !employeeName) {
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

  // Validar que las fechas sean válidas
  const fechaTerminacionDate = new Date(fechaTerminacion);
  if (isNaN(fechaTerminacionDate.getTime())) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            La fecha de terminación no es válida.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple text version
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${esLiquidacion ? 'liquidacion' : 'finiquito'}_${employeeName.replace(/\s/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTextContent = () => {
    let text = `${esLiquidacion ? 'CARTA DE LIQUIDACIÓN' : 'CARTA DE FINIQUITO'}\n\n`;
    text += `Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    text += `Nombre del Empleado: ${employeeName}\n`;
    if (employeeId) text += `No. de Empleado: ${employeeId}\n`;
    text += `Fecha de Terminación: ${new Date(fechaTerminacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    text += `CONCEPTOS:\n\n`;
    
    calculo.conceptos.forEach((concepto: { concepto: string; monto: number; descripcion: string }) => {
      text += `${concepto.concepto}: $${concepto.monto.toFixed(2)}\n`;
      text += `  ${concepto.descripcion}\n\n`;
    });
    
    text += `\nTOTAL A PAGAR: $${calculo.total.toFixed(2)}\n\n`;
    text += `Firmas:\n\n`;
    text += `_________________________          _________________________\n`;
    text += `      Empleado                           Empresa\n`;
    
    return text;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {esLiquidacion ? 'Carta de Liquidación' : 'Carta de Finiquito'}
          </h3>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            data-testid="button-download-carta"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            data-testid="button-print-carta"
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
            <h2 className="text-2xl font-bold">
              {esLiquidacion ? 'CARTA DE LIQUIDACIÓN' : 'CARTA DE FINIQUITO'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Employee Info */}
          <div className="space-y-2 border-t border-b py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre del Empleado</p>
                <p className="font-medium">{employeeName}</p>
              </div>
              {employeeId && (
                <div>
                  <p className="text-sm text-muted-foreground">No. de Empleado</p>
                  <p className="font-medium">{employeeId}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                <p className="font-medium">
                  {new Date(calculo.informacionLaboral.fechaInicio).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Terminación</p>
                <p className="font-medium">
                  {new Date(fechaTerminacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Años de Servicio</p>
              <p className="font-medium">{calculo.informacionLaboral.añosTrabajados.toFixed(2)} años</p>
            </div>
          </div>

          {/* Conceptos */}
          <div className="space-y-3">
            <h3 className="font-semibold">Desglose de Conceptos</h3>
            <div className="space-y-2">
              {calculo.conceptos.map((concepto: { concepto: string; monto: number; descripcion: string }, index: number) => (
                <div key={index} className="flex justify-between items-start border-b pb-2">
                  <div className="flex-1">
                    <p className="font-medium">{concepto.concepto}</p>
                    <p className="text-sm text-muted-foreground">{concepto.descripcion}</p>
                  </div>
                  <p className="font-semibold">${concepto.monto.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-primary pt-4">
            <div className="flex justify-between items-center">
              <p className="text-xl font-bold">TOTAL A PAGAR</p>
              <p className="text-2xl font-bold text-primary">${calculo.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Legal Text */}
          <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
            <p>
              Por medio de la presente, el empleado reconoce haber recibido la cantidad arriba mencionada 
              como {esLiquidacion ? 'liquidación total' : 'finiquito'} de la relación laboral que mantenía con la empresa, 
              otorgando el más amplio finiquito que en derecho proceda, sin que quede nada pendiente por concepto alguno.
            </p>
            <p>
              El empleado declara no tener reclamación alguna que hacer a la empresa por concepto de prestaciones 
              laborales, salarios, indemnizaciones, o cualquier otro concepto derivado de la relación laboral.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="space-y-4">
              <div className="border-t-2 border-foreground pt-2">
                <p className="font-medium text-center">Firma del Empleado</p>
                <p className="text-sm text-muted-foreground text-center">{employeeName}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-t-2 border-foreground pt-2">
                <p className="font-medium text-center">Firma de la Empresa</p>
                <p className="text-sm text-muted-foreground text-center">Representante Legal</p>
              </div>
            </div>
          </div>

          {/* Witnesses (optional for liquidación) */}
          {esLiquidacion && (
            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">Testigos</h4>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="border-t-2 border-foreground pt-2">
                    <p className="font-medium text-center">Testigo 1</p>
                    <p className="text-sm text-muted-foreground text-center">Nombre y Firma</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-t-2 border-foreground pt-2">
                    <p className="font-medium text-center">Testigo 2</p>
                    <p className="text-sm text-muted-foreground text-center">Nombre y Firma</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none, .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
