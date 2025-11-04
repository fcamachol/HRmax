import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export default function Reingresos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reingresos</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de reingresos de empleados que regresan a la empresa
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <CardTitle>Reingresos de Personal</CardTitle>
          </div>
          <CardDescription>
            Proceso de recontratación de exempleados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Módulo en desarrollo para gestionar el proceso de reingreso de empleados:
            actualización de expedientes, nuevas afiliaciones, y cálculo de antigüedad acumulada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
