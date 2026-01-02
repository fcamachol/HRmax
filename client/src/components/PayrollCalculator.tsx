import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PercepcionItem {
  concepto?: string;
  nombre?: string;
  monto?: number;
  importe?: number;
  gravado?: number;
  exento?: number;
  tipo?: 'gravado' | 'exento';
}

interface DeduccionItem {
  concepto?: string;
  nombre?: string;
  monto?: number;
  importe?: number;
}

interface PayrollResultado {
  percepciones: PercepcionItem[];
  deducciones: DeduccionItem[];
  totalPercepciones: number;
  totalDeducciones: number;
  netoAPagar: number;
  baseGravableISR?: number;
  totalPercepcionesGravadas?: number;
  isr?: number | { baseGravable?: number; isrAntesSubsidio?: number; subsidioEmpleo?: number; isrNeto?: number };
  subsidioEmpleo?: number;
  isrRetenido?: number;
}

interface PayrollCalculatorProps {
  resultado: PayrollResultado;
  empleadoNombre?: string;
}

export function PayrollCalculator({ resultado, empleadoNombre }: PayrollCalculatorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const getNombre = (item: PercepcionItem | DeduccionItem) => item.concepto || item.nombre || 'Sin nombre';
  const getMonto = (item: PercepcionItem | DeduccionItem) => item.monto ?? item.importe ?? 0;
  
  const getGravado = (item: PercepcionItem) => {
    if (item.gravado !== undefined) return item.gravado;
    if (item.tipo === 'gravado') return getMonto(item);
    return 0;
  };
  
  const getExento = (item: PercepcionItem) => {
    if (item.exento !== undefined) return item.exento;
    if (item.tipo === 'exento') return getMonto(item);
    return 0;
  };

  const baseGravable = resultado.baseGravableISR ?? resultado.totalPercepcionesGravadas ?? 0;
  
  const isrValue = typeof resultado.isr === 'number' 
    ? resultado.isr 
    : resultado.isr?.isrAntesSubsidio ?? 0;
  
  const subsidioValue = typeof resultado.isr === 'object' 
    ? resultado.isr?.subsidioEmpleo ?? 0 
    : resultado.subsidioEmpleo ?? 0;
  
  const isrRetenidoValue = typeof resultado.isr === 'object'
    ? resultado.isr?.isrNeto ?? 0
    : resultado.isrRetenido ?? Math.max(0, isrValue - subsidioValue);

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
            {resultado.percepciones.map((item, index) => {
              const gravado = getGravado(item);
              const exento = getExento(item);
              const monto = getMonto(item);
              const isMixto = gravado > 0 && exento > 0;
              const isExento = exento === monto && monto > 0;
              
              return (
                <div key={index} className="flex justify-between text-sm gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{getNombre(item)}</span>
                    {isMixto && (
                      <Badge variant="outline" className="text-xs">
                        Parcial
                      </Badge>
                    )}
                    {isExento && !isMixto && (
                      <Badge variant="secondary" className="text-xs">
                        Exento
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 items-center">
                    {isMixto && (
                      <span className="text-xs text-muted-foreground font-mono">
                        G: {formatCurrency(gravado)} / E: {formatCurrency(exento)}
                      </span>
                    )}
                    <span className="font-mono" data-testid={`text-earning-${index}`}>
                      {formatCurrency(monto)}
                    </span>
                  </div>
                </div>
              );
            })}
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
                {formatCurrency(baseGravable)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">Deducciones</h3>
          <div className="space-y-2">
            {resultado.deducciones.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{getNombre(item)}</span>
                <span className="font-mono text-destructive" data-testid={`text-deduction-${index}`}>
                  -{formatCurrency(getMonto(item))}
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

        {isrValue > 0 && (
          <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
            <h4 className="font-semibold">Detalle ISR</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ISR Calculado:</span>
                <span className="font-mono">{formatCurrency(isrValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subsidio al Empleo:</span>
                <span className="font-mono text-green-600">-{formatCurrency(subsidioValue)}</span>
              </div>
              <div className="flex justify-between col-span-2 font-semibold border-t pt-2">
                <span>ISR Retenido:</span>
                <span className="font-mono">{formatCurrency(isrRetenidoValue)}</span>
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
