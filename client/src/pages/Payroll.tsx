import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollCalculator } from "@/components/PayrollCalculator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calculator, Download, Send } from "lucide-react";

export default function Payroll() {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const mockEarnings = [
    { concept: "Salario Base", amount: 15000 },
    { concept: "Bono de Productividad", amount: 2000 },
    { concept: "Tiempo Extra", amount: 1500 },
    { concept: "Prima Vacacional", amount: 500 },
  ];

  const mockDeductions = [
    { concept: "ISR (Impuesto Sobre la Renta)", amount: 1850 },
    { concept: "IMSS (Seguro Social)", amount: 750 },
    { concept: "Infonavit", amount: 450 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Nómina</h1>
        <p className="text-muted-foreground mt-2">
          Calcula y procesa la nómina de empleados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Selección de Nómina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period">Periodo de Nómina</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger id="period" data-testid="select-period">
                    <SelectValue placeholder="Selecciona periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q1-2025">Q1 2025 (Ene - Mar)</SelectItem>
                    <SelectItem value="q2-2025">Q2 2025 (Abr - Jun)</SelectItem>
                    <SelectItem value="current">Periodo Actual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee">Empleado</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger id="employee" data-testid="select-employee">
                    <SelectValue placeholder="Selecciona empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">María García López</SelectItem>
                    <SelectItem value="2">Juan Pérez Martínez</SelectItem>
                    <SelectItem value="3">Ana Martínez Sánchez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" data-testid="button-calculate">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Nómina
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-4">Información Fiscal</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tasa ISR</p>
                  <p className="font-mono">10.88%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasa IMSS</p>
                  <p className="font-mono">5.00%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasa Infonavit</p>
                  <p className="font-mono">3.00%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">UMA Diaria</p>
                  <p className="font-mono">$108.57</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <PayrollCalculator earnings={mockEarnings} deductions={mockDeductions} />

          <div className="space-y-2">
            <Button className="w-full" variant="outline" data-testid="button-download">
              <Download className="h-4 w-4 mr-2" />
              Descargar Recibo
            </Button>
            <Button className="w-full" data-testid="button-send">
              <Send className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
