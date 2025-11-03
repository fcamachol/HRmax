import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { PayrollCalculator } from "./PayrollCalculator";
import {
  calcularNomina,
  configuracionDefault,
  type EmpleadoNomina,
  type ConceptoFormula,
  type Periodicidad,
} from "@shared/calculations";

export function DemoCalculoNomina() {
  const [salarioBase, setSalarioBase] = useState(15000);
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>("quincenal");
  const [diasTrabajados, setDiasTrabajados] = useState(15);
  const [resultado, setResultado] = useState<any>(null);

  // Conceptos de ejemplo
  const conceptosEjemplo: ConceptoFormula[] = [
    {
      id: "sueldo",
      nombre: "Sueldo Base",
      tipo: "percepcion",
      formula: "salario_base",
      gravableISR: true,
      integraSBC: true,
    },
    {
      id: "vales",
      nombre: "Vales de Despensa",
      tipo: "percepcion",
      formula: "salario_minimo * 0.40 * dias_trabajados",
      limiteExento: "40% SM",
      gravableISR: true,
      integraSBC: false,
    },
  ];

  const calcular = () => {
    const salarioDiario = periodicidad === "quincenal" ? salarioBase / 15 : 
                         periodicidad === "mensual" ? salarioBase / 30 :
                         periodicidad === "semanal" ? salarioBase / 7 :
                         periodicidad === "decenal" ? salarioBase / 10 :
                         salarioBase;

    const empleado: EmpleadoNomina = {
      salarioBase,
      salarioDiario,
      sbc: salarioDiario * 1.0452, // Factor de integración aproximado
      diasTrabajados,
      zona: "general",
    };

    const resultadoCalculo = calcularNomina(
      empleado,
      conceptosEjemplo,
      periodicidad,
      configuracionDefault
    );

    setResultado(resultadoCalculo);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos del Empleado</CardTitle>
          <CardDescription>
            Ingresa los datos para calcular la nómina con fórmulas reales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salario-base">Salario Base ({periodicidad})</Label>
            <Input
              id="salario-base"
              type="number"
              value={salarioBase}
              onChange={(e) => setSalarioBase(parseFloat(e.target.value))}
              data-testid="input-salario-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodicidad">Periodicidad de Pago</Label>
            <Select 
              value={periodicidad} 
              onValueChange={(v) => setPeriodicidad(v as Periodicidad)}
            >
              <SelectTrigger id="periodicidad" data-testid="select-periodicidad">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diaria">Diaria</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="decenal">Decenal (10 días)</SelectItem>
                <SelectItem value="quincenal">Quincenal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias-trabajados">Días Trabajados</Label>
            <Input
              id="dias-trabajados"
              type="number"
              value={diasTrabajados}
              onChange={(e) => setDiasTrabajados(parseFloat(e.target.value))}
              data-testid="input-dias-trabajados"
            />
          </div>

          <Button 
            onClick={calcular} 
            className="w-full"
            data-testid="button-calcular"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Nómina
          </Button>

          <div className="bg-muted p-4 rounded-md text-sm space-y-2">
            <p className="font-semibold">Conceptos Incluidos:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Sueldo Base (Gravado ISR)</li>
              <li>Vales de Despensa (40% SM × días)</li>
              <li>IMSS Trabajador (según tablas 2025)</li>
              <li>ISR (tabla {periodicidad} - Subsidio Empleo)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {resultado && (
        <PayrollCalculator 
          resultado={resultado}
          empleadoNombre="Empleado de Ejemplo"
        />
      )}
    </div>
  );
}
