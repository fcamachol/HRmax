import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, ClipboardList } from "lucide-react";
import { CasosLegalesKanban } from "@/components/CasosLegalesKanban";
import { SimuladorLiquidaciones } from "@/components/SimuladorLiquidaciones";

export default function Bajas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bajas</h1>
        <p className="text-muted-foreground mt-2">
          Proceso completo de baja de empleados: desde el detonante hasta el seguimiento post-baja, cumpliendo con la normativa mexicana (IMSS, INFONAVIT, SAT)
        </p>
      </div>

      <Tabs defaultValue="casos" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="casos" data-testid="tab-casos-bajas">
            <ClipboardList className="h-4 w-4 mr-2" />
            Casos de Bajas
          </TabsTrigger>
          <TabsTrigger value="simulador" data-testid="tab-simulador-bajas">
            <Calculator className="h-4 w-4 mr-2" />
            Simulador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="casos">
          <CasosLegalesKanban />
        </TabsContent>

        <TabsContent value="simulador">
          <SimuladorLiquidaciones />
        </TabsContent>
      </Tabs>
    </div>
  );
}
