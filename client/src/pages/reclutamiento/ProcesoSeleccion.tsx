import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProcesoSeleccion() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Proceso de Selección</h1>
        <p className="text-muted-foreground">Tablero Kanban para seguimiento de candidatos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo de Proceso de Selección</CardTitle>
          <CardDescription>
            Próximamente: tablero Kanban con drag & drop para gestionar el pipeline de candidatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo permitirá visualizar y mover candidatos a través de las diferentes etapas 
            del proceso de selección (revisión CV, entrevista telefónica, entrevista RH, evaluación técnica, 
            entrevista con gerencia, oferta, etc.). Incluirá programación de entrevistas, registro de 
            evaluaciones, y generación de ofertas de trabajo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
