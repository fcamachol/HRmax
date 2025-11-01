import { PayrollCalculator } from '../PayrollCalculator';

export default function PayrollCalculatorExample() {
  const mockEarnings = [
    { concept: 'Salario Base', amount: 15000 },
    { concept: 'Bono de Productividad', amount: 2000 },
    { concept: 'Tiempo Extra', amount: 1500 },
  ];

  const mockDeductions = [
    { concept: 'ISR', amount: 1850 },
    { concept: 'IMSS', amount: 750 },
    { concept: 'Infonavit', amount: 450 },
  ];

  return (
    <div className="p-6 max-w-md">
      <PayrollCalculator earnings={mockEarnings} deductions={mockDeductions} />
    </div>
  );
}
