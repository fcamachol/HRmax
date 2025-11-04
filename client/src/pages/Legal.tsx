import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Gavel } from "lucide-react";
import { SimuladorLiquidaciones } from "@/components/SimuladorLiquidaciones";
import { KanbanDemandas } from "@/components/KanbanDemandas";

export default function Legal() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Módulo Legal</h1>
        <p className="text-muted-foreground mt-2">
          Simulador de liquidaciones y gestión de demandas laborales
        </p>
      </div>

      <Tabs defaultValue="simulador" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="simulador" data-testid="tab-simulador">
            <Calculator className="h-4 w-4 mr-2" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="demandas" data-testid="tab-demandas">
            <Gavel className="h-4 w-4 mr-2" />
            Demandas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulador">
          <SimuladorLiquidaciones />
        </TabsContent>

        <TabsContent value="demandas">
          <KanbanDemandas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
