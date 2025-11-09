import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Vacantes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vacantes</h1>
        <p className="text-muted-foreground">Gestiona las vacantes abiertas y requisiciones de personal</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo de Vacantes</CardTitle>
          <CardDescription>
            Próximamente: gestión completa de vacantes con formularios, tabla y filtros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo permitirá crear y gestionar vacantes (requisiciones de personal), 
            vincularlas con puestos, establecer prioridades, y llevar control de su estatus.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
