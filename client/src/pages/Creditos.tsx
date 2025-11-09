import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Wallet, FileText, DollarSign, AlertTriangle } from "lucide-react";
import type { CreditoLegal, PrestamoInterno, PagoCreditoDescuento, Employee } from "@shared/schema";
import { CreditosLegalesTab } from "@/components/creditos/CreditosLegalesTab";
import { PrestamosInternosTab } from "@/components/creditos/PrestamosInternosTab";
import { ReportesTab } from "@/components/creditos/ReportesTab";

export default function Creditos() {
  const [activeTab, setActiveTab] = useState<"legales" | "prestamos" | "reportes">("legales");

  const { data: creditosLegales = [], isLoading: isLoadingCreditos } = useQuery<CreditoLegal[]>({
    queryKey: ["/api/creditos-legales"],
  });

  const { data: prestamosInternos = [], isLoading: isLoadingPrestamos } = useQuery<PrestamoInterno[]>({
    queryKey: ["/api/prestamos-internos"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Calcular estadísticas
  const creditosActivos = creditosLegales.filter(c => c.estado === "ACTIVO");
  const prestamosActivos = prestamosInternos.filter(p => p.estado === "ACTIVO");
  
  const totalSaldosCreditos = creditosActivos.reduce((sum, c) => {
    return sum + parseFloat(c.saldoRestante?.toString() || "0");
  }, 0);

  const totalSaldosPrestamos = prestamosActivos.reduce((sum, p) => {
    return sum + parseFloat(p.saldoPendiente?.toString() || "0");
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Créditos y Descuentos</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona créditos legales, préstamos internos y descuentos de nómina
          </p>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Activos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{creditosActivos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {creditosLegales.length} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{prestamosActivos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {prestamosInternos.length} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Créditos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ${totalSaldosCreditos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Préstamos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ${totalSaldosPrestamos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total por cobrar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="legales" data-testid="tab-creditos-legales">
            <CreditCard className="h-4 w-4 mr-2" />
            Créditos Legales
          </TabsTrigger>
          <TabsTrigger value="prestamos" data-testid="tab-prestamos-internos">
            <Wallet className="h-4 w-4 mr-2" />
            Préstamos Internos
          </TabsTrigger>
          <TabsTrigger value="reportes" data-testid="tab-reportes">
            <FileText className="h-4 w-4 mr-2" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="legales" className="space-y-6">
          <CreditosLegalesTab 
            creditos={creditosLegales} 
            employees={employees}
            isLoading={isLoadingCreditos}
          />
        </TabsContent>

        <TabsContent value="prestamos" className="space-y-6">
          <PrestamosInternosTab 
            prestamos={prestamosInternos}
            employees={employees}
            isLoading={isLoadingPrestamos}
          />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-6">
          <ReportesTab 
            creditosLegales={creditosLegales}
            prestamosInternos={prestamosInternos}
            employees={employees}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
