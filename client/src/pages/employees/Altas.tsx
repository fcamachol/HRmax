import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function Altas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Altas</h1>
        <p className="text-muted-foreground mt-2">
          Registro de nuevas contrataciones y onboarding de empleados
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle>Nuevas Contrataciones</CardTitle>
          </div>
          <CardDescription>
            Gestión del proceso de alta de empleados nuevos en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Módulo en desarrollo para gestionar el proceso completo de alta de empleados:
            documentación, afiliaciones IMSS, creación de expedientes, y asignación de recursos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
