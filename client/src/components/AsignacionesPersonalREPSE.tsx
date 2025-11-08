import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AsignacionesPersonalREPSE() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Asignaciones de Personal</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona la asignación de empleados a contratos REPSE
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Módulo en desarrollo</p>
          <p className="text-muted-foreground text-sm text-center max-w-md">
            Este módulo permitirá asignar empleados a contratos específicos, gestionar funciones especializadas y hacer seguimiento del historial de asignaciones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
