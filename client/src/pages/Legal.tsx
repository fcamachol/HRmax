import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Scale } from "lucide-react";
import { SimuladorLiquidaciones } from "@/components/SimuladorLiquidaciones";
import { CasosLegalesKanban } from "@/components/CasosLegalesKanban";

export default function Legal() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Módulo Legal</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de despidos, renuncias, liquidaciones y finiquitos
        </p>
      </div>

      <Tabs defaultValue="simulador" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="simulador" data-testid="tab-simulador">
            <Calculator className="h-4 w-4 mr-2" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="bajas" data-testid="tab-bajas">
            <Scale className="h-4 w-4 mr-2" />
            Bajas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulador">
          <SimuladorLiquidaciones />
        </TabsContent>

        <TabsContent value="bajas">
          <CasosLegalesKanban />
        </TabsContent>
      </Tabs>
    </div>
  );
}
