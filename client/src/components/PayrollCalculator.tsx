import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ResultadoNomina } from "@shared/calculations";

interface PayrollCalculatorProps {
  resultado: ResultadoNomina;
  empleadoNombre?: string;
}

export function PayrollCalculator({ resultado, empleadoNombre }: PayrollCalculatorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  return (
    <Card data-testid="card-payroll-calculator">
      <CardHeader>
        <CardTitle>Cálculo de Nómina</CardTitle>
        {empleadoNombre && (
          <CardDescription>{empleadoNombre}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-4">Percepciones</h3>
          <div className="space-y-2">
            {resultado.percepciones.map((item, index) => (
              <div key={index} className="flex justify-between text-sm gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.concepto}</span>
                  {item.exento > 0 && item.gravado > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Parcial
                    </Badge>
                  )}
                  {item.exento === item.monto && item.monto > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Exento
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3 items-center">
                  {item.gravado > 0 && item.exento > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">
                      G: {formatCurrency(item.gravado)} / E: {formatCurrency(item.exento)}
                    </span>
                  )}
                  <span className="font-mono" data-testid={`text-earning-${index}`}>
                    {formatCurrency(item.monto)}
                  </span>
                </div>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Percepciones</span>
              <span className="font-mono" data-testid="text-total-earnings">
                {formatCurrency(resultado.totalPercepciones)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Base Gravable ISR</span>
              <span className="font-mono">
                {formatCurrency(resultado.baseGravableISR)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">Deducciones</h3>
          <div className="space-y-2">
            {resultado.deducciones.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.concepto}</span>
                <span className="font-mono text-destructive" data-testid={`text-deduction-${index}`}>
                  -{formatCurrency(item.monto)}
                </span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Deducciones</span>
              <span className="font-mono text-destructive" data-testid="text-total-deductions">
                -{formatCurrency(resultado.totalDeducciones)}
              </span>
            </div>
          </div>
        </div>

        {resultado.isr > 0 && (
          <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
            <h4 className="font-semibold">Detalle ISR</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ISR Calculado:</span>
                <span className="font-mono">{formatCurrency(resultado.isr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subsidio al Empleo:</span>
                <span className="font-mono text-green-600">-{formatCurrency(resultado.subsidioEmpleo)}</span>
              </div>
              <div className="flex justify-between col-span-2 font-semibold border-t pt-2">
                <span>ISR Retenido:</span>
                <span className="font-mono">{formatCurrency(resultado.isrRetenido)}</span>
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Neto a Pagar</span>
          <span className="text-xl font-bold font-mono text-primary" data-testid="text-net-pay">
            {formatCurrency(resultado.netoAPagar)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
