import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Altas from "@/pages/employees/Altas";
import Bajas from "@/pages/employees/Bajas";
import Reingresos from "@/pages/employees/Reingresos";
import Cambios from "@/pages/employees/Cambios";
import Payroll from "@/pages/Payroll";
import GruposNomina from "@/pages/payroll/GruposNomina";
import Attendance from "@/pages/Attendance";
import CentrosTrabajo from "@/pages/CentrosTrabajo";
import Reports from "@/pages/Reports";
import Configuration from "@/pages/Configuration";
import Empresas from "@/pages/Empresas";
import Settings from "@/pages/Settings";
import Legal from "@/pages/Legal";
import REPSE from "@/pages/REPSE";
import Creditos from "@/pages/Creditos";
import Puestos from "@/pages/Puestos";
import RelojChecador from "@/components/RelojChecador";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/employees" component={Employees} />
      <Route path="/employees/altas" component={Altas} />
      <Route path="/employees/bajas" component={Bajas} />
      <Route path="/employees/reingresos" component={Reingresos} />
      <Route path="/employees/cambios" component={Cambios} />
      <Route path="/payroll" component={Payroll} />
      <Route path="/payroll/grupos" component={GruposNomina} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/reloj-checador" component={RelojChecador} />
      <Route path="/centros-trabajo" component={CentrosTrabajo} />
      <Route path="/reports" component={Reports} />
      <Route path="/legal" component={Legal} />
      <Route path="/repse" component={REPSE} />
      <Route path="/creditos" component={Creditos} />
      <Route path="/organizacion/puestos" component={Puestos} />
      <Route path="/configuration" component={Configuration} />
      <Route path="/empresas" component={Empresas} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-6 md:p-8">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
