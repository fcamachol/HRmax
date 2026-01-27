import { Switch, Route, useLocation, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClienteProvider } from "@/contexts/ClienteContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PortalAuthProvider } from "@/contexts/PortalAuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { RequirePortalAuth } from "@/components/portal/RequirePortalAuth";
import { useEffect } from "react";
import Login from "@/pages/Login";
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
import CatalogosBase from "@/pages/configuracion/CatalogosBase";
import Usuarios from "@/pages/configuracion/Usuarios";
import ImssMovimientos from "@/pages/imss/Movimientos";
import SuaBimestres from "@/pages/imss/SuaBimestres";
import RelojChecador from "@/components/RelojChecador";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import SuperAdminLayout from "@/pages/super-admin/Layout";
import SuperAdminUsers from "@/pages/super-admin/Users";
import SuperAdminClientes from "@/pages/super-admin/Clientes";
import OnboardingWizard from "@/pages/onboarding-wizard";
import NotFound from "@/pages/not-found";

// Cursos y Evaluaciones
import Cursos from "@/pages/cursos-capacitaciones/Cursos";
import CursoBuilder from "@/pages/cursos-capacitaciones/CursoBuilder";
import Asignaciones from "@/pages/cursos-capacitaciones/Asignaciones";
import ReglasAsignacion from "@/pages/cursos-capacitaciones/ReglasAsignacion";
import ReportesCursos from "@/pages/cursos-capacitaciones/Reportes";
import CertificadosCursos from "@/pages/cursos-capacitaciones/Certificados";
import CursoPreview from "@/pages/cursos-capacitaciones/CursoPreview";
import CategoriasPage from "@/pages/cursos-capacitaciones/Categorias";

// Documentos (Templates)
import {
  PlantillasDocumento,
  EditorPlantilla,
  GenerarDocumento,
  ReglasAsignacion as ReglasAsignacionPlantillas,
} from "@/pages/documentos";

// Portal (Employee Self-Service) Pages
import PortalLogin from "@/pages/portal/Login";
import PortalHome from "@/pages/portal/Home";
import PortalSolicitudes from "@/pages/portal/Solicitudes";
import PortalRecibos from "@/pages/portal/Recibos";
import PortalMas from "@/pages/portal/Mas";
import PortalProfile from "@/pages/portal/Profile";
import PortalMisCursos from "@/pages/portal/MisCursos";
import PortalCursoPlayer from "@/pages/portal/CursoPlayer";
import PortalAsistencia from "@/pages/portal/Asistencia";
import PortalDocumentos from "@/pages/portal/Documentos";
import PortalDirectorio from "@/pages/portal/Directorio";
import PortalAprobaciones from "@/pages/portal/Aprobaciones";
import PortalNotificaciones from "@/pages/portal/Notificaciones";
import AgencyDashboard from "@/pages/AgencyDashboard";
import Denuncias from "@/pages/Denuncias";

// Anonymous Denuncia (Public) Pages
import DenunciaSubmit from "@/pages/denuncia/Submit";
import DenunciaTrack from "@/pages/denuncia/Track";

// Agency routes (for MaxTalent users without a specific client selected)
function AgencyRouter() {
  return (
    <Switch>
      <Route path="/agency" component={AgencyDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Routes within a client context (all use /:clienteId prefix)
function ClienteRouter() {
  return (
    <Switch>
      <Route path="/:clienteId" component={Dashboard} />
      <Route path="/:clienteId/employees" component={Employees} />
      <Route path="/:clienteId/employees/altas" component={Altas} />
      <Route path="/:clienteId/employees/bajas" component={Bajas} />
      <Route path="/:clienteId/employees/reingresos" component={Reingresos} />
      <Route path="/:clienteId/employees/cambios" component={Cambios} />
      <Route path="/:clienteId/payroll" component={Payroll} />
      <Route path="/:clienteId/payroll/grupos" component={GruposNomina} />
      <Route path="/:clienteId/attendance" component={Attendance} />
      <Route path="/:clienteId/reloj-checador" component={RelojChecador} />
      <Route path="/:clienteId/organizacion/puestos" component={Puestos} />
      <Route path="/:clienteId/organizacion/centros-trabajo" component={CentrosTrabajo} />
      <Route path="/:clienteId/organizacion/departamentos" component={Departamentos} />
      <Route path="/:clienteId/reclutamiento/vacantes" component={Vacantes} />
      <Route path="/:clienteId/reclutamiento/candidatos" component={Candidatos} />
      <Route path="/:clienteId/reclutamiento/proceso" component={ProcesoSeleccion} />
      <Route path="/:clienteId/vacaciones" component={Vacaciones} />
      <Route path="/:clienteId/incapacidades" component={Incapacidades} />
      <Route path="/:clienteId/permisos" component={Permisos} />
      <Route path="/:clienteId/actas-administrativas" component={ActasAdministrativas} />
      <Route path="/:clienteId/configuration/usuarios" component={Usuarios} />
      <Route path="/:clienteId/configuration/medios-pago" component={MediosPago} />
      <Route path="/:clienteId/configuration/prestaciones" component={Prestaciones} />
      <Route path="/:clienteId/configuration/plantillas-nomina" component={PlantillasNomina} />
      <Route path="/:clienteId/configuration/conceptos" component={ConceptosNomina} />
      <Route path="/:clienteId/configuration/catalogos" component={CatalogosBase} />
      <Route path="/:clienteId/imss/movimientos" component={ImssMovimientos} />
      <Route path="/:clienteId/imss/sua-bimestres" component={SuaBimestres} />
      <Route path="/:clienteId/reports" component={Reports} />
      <Route path="/:clienteId/legal" component={Legal} />
      <Route path="/:clienteId/denuncias" component={Denuncias} />
      <Route path="/:clienteId/repse" component={REPSE} />
      <Route path="/:clienteId/creditos" component={Creditos} />
      <Route path="/:clienteId/configuration" component={Configuration} />
      <Route path="/:clienteId/empresas" component={Empresas} />
      <Route path="/:clienteId/cursos-capacitaciones/categorias" component={CategoriasPage} />
      <Route path="/:clienteId/cursos-capacitaciones/asignaciones" component={Asignaciones} />
      <Route path="/:clienteId/cursos-capacitaciones/reglas" component={ReglasAsignacion} />
      <Route path="/:clienteId/cursos-capacitaciones/reportes" component={ReportesCursos} />
      <Route path="/:clienteId/cursos-capacitaciones/certificados" component={CertificadosCursos} />
      <Route path="/:clienteId/cursos-capacitaciones/:id/editar" component={CursoBuilder} />
      <Route path="/:clienteId/cursos-capacitaciones/:id/preview" component={CursoPreview} />
      <Route path="/:clienteId/cursos-capacitaciones" component={Cursos} />
      <Route path="/:clienteId/documentos/plantillas/:id" component={EditorPlantilla} />
      <Route path="/:clienteId/documentos/plantillas" component={PlantillasDocumento} />
      <Route path="/:clienteId/documentos/reglas-asignacion" component={ReglasAsignacionPlantillas} />
      <Route path="/:clienteId/documentos/generar/:id" component={GenerarDocumento} />
      <Route path="/:clienteId/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Redirect to client-scoped URL after login
function ClienteRedirect() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      // Client users go to their assigned client
      if (user.tipoUsuario === "cliente" && user.clienteId) {
        setLocation(`/${user.clienteId}`);
      } else {
        // MaxTalent users - go to agency dashboard (client-agnostic)
        // They can select a client from the selector when needed
        setLocation("/agency");
      }
    }
  }, [user, setLocation]);

  return <div className="flex items-center justify-center h-screen">Redirecting...</div>;
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
          <AuthProvider>
            <Switch>
              {/* Public routes */}
              <Route path="/login" component={Login} />
              <Route path="/super-admin/login" component={SuperAdminLogin} />

              {/* Portal (Employee Self-Service) routes */}
              <Route path="/portal/:clienteId/login">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <PortalLogin />
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalHome />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/solicitudes">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalSolicitudes />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/recibos">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalRecibos />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/mas">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalMas />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/perfil">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalProfile />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/cursos/:asignacionId">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalCursoPlayer />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/cursos">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalMisCursos />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/asistencia">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalAsistencia />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/documentos">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalDocumentos />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/directorio">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalDirectorio />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/aprobaciones">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalAprobaciones />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>
              <Route path="/portal/:clienteId/notificaciones">
                {(params) => (
                  <PortalAuthProvider clienteId={params.clienteId}>
                    <RequirePortalAuth>
                      <PortalNotificaciones />
                    </RequirePortalAuth>
                  </PortalAuthProvider>
                )}
              </Route>

              {/* Anonymous Denuncia (Public) routes - no auth required */}
              <Route path="/denuncia/:clienteId/:empresaId/seguimiento" component={DenunciaTrack} />
              <Route path="/denuncia/:clienteId/:empresaId" component={DenunciaSubmit} />

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
            <Route path="/onboarding" component={OnboardingWizard} />

            {/* Root redirect - send authenticated users to their client */}
            <Route path="/">
              {() => (
                <RequireAuth>
                  <ClienteRedirect />
                </RequireAuth>
              )}
            </Route>

            {/* Agency view for MaxTalent users (no client selected) */}
            <Route path="/agency/*?">
              {() => (
                <RequireAuth>
                  <ClienteProvider>
                    <SidebarProvider style={style as React.CSSProperties}>
                      <div className="flex h-screen w-full">
                        <AppSidebar />
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <header className="flex items-center justify-between p-4 border-b bg-background">
                            <SidebarTrigger data-testid="button-sidebar-toggle" />
                            <ThemeToggle />
                          </header>
                          <main className="flex-1 overflow-auto p-6 md:p-8">
                            <AgencyRouter />
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ClienteProvider>
                </RequireAuth>
              )}
            </Route>

            {/* Client-scoped routes - matches /:clienteId and /:clienteId/anything */}
            <Route path="/:clienteId/*?">
              {() => (
                <RequireAuth>
                  <ClienteProvider>
                    <SidebarProvider style={style as React.CSSProperties}>
                      <div className="flex h-screen w-full">
                        <AppSidebar />
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <header className="flex items-center justify-between p-4 border-b bg-background">
                            <SidebarTrigger data-testid="button-sidebar-toggle" />
                            <ThemeToggle />
                          </header>
                          <main className="flex-1 overflow-auto p-6 md:p-8">
                            <ClienteRouter />
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ClienteProvider>
                </RequireAuth>
              )}
            </Route>
            </Switch>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
