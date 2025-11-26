import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LFTMinimosView } from "@/components/configuracion/LFTMinimosView";
import { EsquemasManager } from "@/components/configuracion/EsquemasManager";
import { PrestacionesPorPuestoManager } from "@/components/configuracion/PrestacionesPorPuestoManager";
import { EmpleadosOverridesManager } from "@/components/configuracion/EmpleadosOverridesManager";

export default function Prestaciones() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Gestión de Prestaciones</h1>
        <p className="text-muted-foreground mt-2">
          Administra esquemas de prestaciones, asignación por puesto y configuraciones individuales
        </p>
      </div>

      <Tabs defaultValue="ley" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ley" data-testid="tab-ley">
            Ley
          </TabsTrigger>
          <TabsTrigger value="esquemas" data-testid="tab-esquemas">
            Catálogo de Esquemas
          </TabsTrigger>
          <TabsTrigger value="por-puesto" data-testid="tab-por-puesto">
            Por Puesto
          </TabsTrigger>
          <TabsTrigger value="por-empleado" data-testid="tab-por-empleado">
            Por Empleado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ley" className="space-y-6">
          <LFTMinimosView />
        </TabsContent>

        <TabsContent value="esquemas" className="space-y-6">
          <EsquemasManager />
        </TabsContent>

        <TabsContent value="por-puesto" className="space-y-6">
          <PrestacionesPorPuestoManager />
        </TabsContent>

        <TabsContent value="por-empleado" className="space-y-6">
          <EmpleadosOverridesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
