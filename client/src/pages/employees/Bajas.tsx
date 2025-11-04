import { CasosLegalesKanban } from "@/components/CasosLegalesKanban";

export default function Bajas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bajas de Personal</h1>
        <p className="text-muted-foreground mt-2">
          Gestión del proceso de bajas y terminaciones laborales
        </p>
      </div>

      <CasosLegalesKanban />
    </div>
  );
}
