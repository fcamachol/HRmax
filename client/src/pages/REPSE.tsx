import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Building2, Users, ClipboardList, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Empresa, ContratoREPSE } from "@shared/schema";
import RegistrosREPSE from "@/components/RegistrosREPSE";
import ClientesREPSE from "@/components/ClientesREPSE";
import ContratosREPSE from "@/components/ContratosREPSE";
import AsignacionesPersonalREPSE from "@/components/AsignacionesPersonalREPSE";
import AvisosREPSE from "@/components/AvisosREPSE";

export default function REPSE() {
  const [activeTab, setActiveTab] = useState("clientes");

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const { data: contratos = [] } = useQuery<ContratoREPSE[]>({
    queryKey: ["/api/contratos-repse"],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">REPSE</h1>
          <p className="text-muted-foreground mt-1">
            Registro de Prestadoras de Servicios Especializados u Obras Especializadas
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="registros" data-testid="tab-registros-repse">
            <FileText className="h-4 w-4 mr-2" />
            Registros REPSE
          </TabsTrigger>
          <TabsTrigger value="clientes" data-testid="tab-clientes-repse">
            <Building2 className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="contratos" data-testid="tab-contratos-repse">
            <ClipboardList className="h-4 w-4 mr-2" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="avisos" data-testid="tab-avisos-repse">
            <Bell className="h-4 w-4 mr-2" />
            Avisos
          </TabsTrigger>
          <TabsTrigger value="asignaciones" data-testid="tab-asignaciones-repse">
            <Users className="h-4 w-4 mr-2" />
            Asignaciones de Personal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registros">
          <Card>
            <CardContent className="pt-6">
              <RegistrosREPSE empresas={empresas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardContent className="pt-6">
              <ClientesREPSE />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos">
          <Card>
            <CardContent className="pt-6">
              <ContratosREPSE empresas={empresas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avisos">
          <Card>
            <CardContent className="pt-6">
              <AvisosREPSE contratos={contratos} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asignaciones">
          <Card>
            <CardContent className="pt-6">
              <AsignacionesPersonalREPSE />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
