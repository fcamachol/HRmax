import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export default function Cambios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cambios</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de cambios de salario, puesto y centro de trabajo
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <CardTitle>Modificaciones de Personal</CardTitle>
          </div>
          <CardDescription>
            Registro de cambios en salario, puesto o ubicación de empleados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Módulo en desarrollo para gestionar:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Cambios de salario (aumentos, ajustes, bonos)</li>
            <li>Cambios de puesto (promociones, movimientos laterales)</li>
            <li>Cambios de centro de trabajo (transferencias entre sucursales)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
