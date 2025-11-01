import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PayrollItem {
  concept: string;
  amount: number;
}

interface PayrollCalculatorProps {
  earnings: PayrollItem[];
  deductions: PayrollItem[];
}

export function PayrollCalculator({ earnings, deductions }: PayrollCalculatorProps) {
  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
  const netPay = totalEarnings - totalDeductions;

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
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-4">Percepciones</h3>
          <div className="space-y-2">
            {earnings.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.concept}</span>
                <span className="font-mono" data-testid={`text-earning-${index}`}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Percepciones</span>
              <span className="font-mono" data-testid="text-total-earnings">
                {formatCurrency(totalEarnings)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">Deducciones</h3>
          <div className="space-y-2">
            {deductions.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.concept}</span>
                <span className="font-mono text-destructive" data-testid={`text-deduction-${index}`}>
                  -{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Deducciones</span>
              <span className="font-mono text-destructive" data-testid="text-total-deductions">
                -{formatCurrency(totalDeductions)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Neto a Pagar</span>
          <span className="text-xl font-bold font-mono text-primary" data-testid="text-net-pay">
            {formatCurrency(netPay)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
