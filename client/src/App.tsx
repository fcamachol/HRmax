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
import Departamentos from "@/pages/Departamentos";
import Reports from "@/pages/Reports";
import Configuration from "@/pages/Configuration";
import Empresas from "@/pages/Empresas";
import Settings from "@/pages/Settings";
import Legal from "@/pages/Legal";
import REPSE from "@/pages/REPSE";
import Creditos from "@/pages/Creditos";
import Puestos from "@/pages/Puestos";
import Vacantes from "@/pages/reclutamiento/Vacantes";
import Candidatos from "@/pages/reclutamiento/Candidatos";
import ProcesoSeleccion from "@/pages/reclutamiento/ProcesoSeleccion";
import Vacaciones from "@/pages/vacaciones/Vacaciones";
import Incapacidades from "@/pages/incapacidades/Incapacidades";
import Permisos from "@/pages/permisos/Permisos";
import ActasAdministrativas from "@/pages/actas-administrativas/ActasAdministrativas";
import MediosPago from "@/pages/configuracion/MediosPago";
import Prestaciones from "@/pages/configuracion/Prestaciones";
import PlantillasNomina from "@/pages/configuracion/PlantillasNomina";
import ConceptosNomina from "@/pages/configuracion/ConceptosNomina";
import RelojChecador from "@/components/RelojChecador";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import SuperAdminLayout from "@/pages/super-admin/Layout";
import SuperAdminUsers from "@/pages/super-admin/Users";
import SuperAdminClientes from "@/pages/super-admin/Clientes";
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
      <Route path="/organizacion/puestos" component={Puestos} />
      <Route path="/organizacion/centros-trabajo" component={CentrosTrabajo} />
      <Route path="/organizacion/departamentos" component={Departamentos} />
      <Route path="/reclutamiento/vacantes" component={Vacantes} />
      <Route path="/reclutamiento/candidatos" component={Candidatos} />
      <Route path="/reclutamiento/proceso" component={ProcesoSeleccion} />
      <Route path="/vacaciones" component={Vacaciones} />
      <Route path="/incapacidades" component={Incapacidades} />
      <Route path="/permisos" component={Permisos} />
      <Route path="/actas-administrativas" component={ActasAdministrativas} />
      <Route path="/configuration/medios-pago" component={MediosPago} />
      <Route path="/configuration/prestaciones" component={Prestaciones} />
      <Route path="/configuration/plantillas-nomina" component={PlantillasNomina} />
      <Route path="/configuration/conceptos" component={ConceptosNomina} />
      <Route path="/reports" component={Reports} />
      <Route path="/legal" component={Legal} />
      <Route path="/repse" component={REPSE} />
      <Route path="/creditos" component={Creditos} />
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
          <Switch>
            <Route path="/super-admin/login" component={SuperAdminLogin} />
            <Route path="/super-admin/users">
              {() => (
                <SuperAdminLayout>
                  <SuperAdminUsers />
                </SuperAdminLayout>
              )}
            </Route>
            <Route path="/super-admin/clientes">
              {() => (
                <SuperAdminLayout>
                  <SuperAdminClientes />
                </SuperAdminLayout>
              )}
            </Route>
            <Route path="/super-admin">
              {() => (
                <SuperAdminLayout>
                  <SuperAdminUsers />
                </SuperAdminLayout>
              )}
            </Route>
            <Route>
              {() => (
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
              )}
            </Route>
          </Switch>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
