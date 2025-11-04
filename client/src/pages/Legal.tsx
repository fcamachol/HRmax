import { KanbanDemandas } from "@/components/KanbanDemandas";

export default function Legal() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demandas Laborales</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de procesos judiciales y demandas laborales
        </p>
      </div>

      <KanbanDemandas />
    </div>
  );
}
