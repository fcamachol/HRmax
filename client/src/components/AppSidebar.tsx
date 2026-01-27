import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Settings,
  Building2,
  Calculator,
  Scale,
  UserPlus,
  UserMinus,
  UserCheck,
  RefreshCw,
  ChevronRight,
  LayoutList,
  MapPin,
  CreditCard,
  Briefcase,
  UserSearch,
  Clipboard,
  FileCheck,
  Umbrella,
  Shield,
  Clock,
  UserCog,
  FileWarning,
  Wallet,
  Gift,
  Database,
  FileUp,
  CalendarRange,
  LogOut,
  User,
  GraduationCap,
  FileSignature,
  ListChecks,
  History,
  MessageSquareWarning,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useCliente } from "@/contexts/ClienteContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ClienteSelector } from "@/components/ClienteSelector";
import { Separator } from "@/components/ui/separator";

const employeeSubItems = [
  {
    title: "Vista General",
    url: "/employees",
    icon: LayoutList,
  },
  {
    title: "Altas",
    url: "/employees/altas",
    icon: UserPlus,
  },
  {
    title: "Bajas",
    url: "/employees/bajas",
    icon: UserMinus,
  },
  {
    title: "Reingresos",
    url: "/employees/reingresos",
    icon: UserCheck,
  },
  {
    title: "Cambios",
    url: "/employees/cambios",
    icon: RefreshCw,
  },
];

const payrollSubItems = [
  {
    title: "Incidencias",
    url: "/attendance",
    icon: Calendar,
  },
  {
    title: "Crear Nómina",
    url: "/payroll",
    icon: Calculator,
  },
  {
    title: "Grupos de Nómina",
    url: "/payroll/grupos",
    icon: Users,
  },
];

const organizacionSubItems = [
  {
    title: "Puestos",
    url: "/organizacion/puestos",
    icon: Briefcase,
  },
  {
    title: "Centros de Trabajo",
    url: "/organizacion/centros-trabajo",
    icon: MapPin,
  },
  {
    title: "Departamentos",
    url: "/organizacion/departamentos",
    icon: Building2,
  },
];

const reclutamientoSubItems = [
  {
    title: "Vacantes",
    url: "/reclutamiento/vacantes",
    icon: Clipboard,
  },
  {
    title: "Candidatos",
    url: "/reclutamiento/candidatos",
    icon: UserSearch,
  },
  {
    title: "Proceso de Selección",
    url: "/reclutamiento/proceso",
    icon: FileCheck,
  },
];

const gestionPersonalSubItems = [
  {
    title: "Vacaciones",
    url: "/vacaciones",
    icon: Umbrella,
  },
  {
    title: "Incapacidades",
    url: "/incapacidades",
    icon: Shield,
  },
  {
    title: "Permisos",
    url: "/permisos",
    icon: Clock,
  },
  {
    title: "Actas Administrativas",
    url: "/actas-administrativas",
    icon: FileWarning,
  },
  {
    title: "Créditos y Descuentos",
    url: "/creditos",
    icon: CreditCard,
  },
];

const imssSubItems = [
  {
    title: "Movimientos IMSS",
    url: "/imss/movimientos",
    icon: FileUp,
  },
  {
    title: "SUA Bimestres",
    url: "/imss/sua-bimestres",
    icon: CalendarRange,
  },
];

const configuracionSubItems = [
  {
    title: "General",
    url: "/configuration",
    icon: Settings,
  },
  {
    title: "Usuarios",
    url: "/configuration/usuarios",
    icon: UserCog,
    requiresAdmin: true,
  },
  {
    title: "Prestaciones",
    url: "/configuration/prestaciones",
    icon: Gift,
  },
  {
    title: "Medios de Pago",
    url: "/configuration/medios-pago",
    icon: Wallet,
  },
  {
    title: "Plantillas de Nómina",
    url: "/configuration/plantillas-nomina",
    icon: FileText,
  },
  {
    title: "Catálogo de Conceptos",
    url: "/configuration/conceptos",
    icon: Calculator,
  },
  {
    title: "Catálogos SAT",
    url: "/configuration/catalogos",
    icon: Database,
  },
];

const documentosSubItems = [
  {
    title: "Plantillas",
    url: "/documentos/plantillas",
    icon: FileSignature,
  },
  {
    title: "Reglas de Asignación",
    url: "/documentos/reglas-asignacion",
    icon: ListChecks,
  },
  {
    title: "Generados",
    url: "/documentos/generados",
    icon: History,
  },
];

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Reportes",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Legal",
    url: "/legal",
    icon: Scale,
  },
  {
    title: "Canal de Denuncias",
    url: "/denuncias",
    icon: MessageSquareWarning,
  },
  {
    title: "REPSE",
    url: "/repse",
    icon: FileCheck,
  },
  {
    title: "Empresas",
    url: "/empresas",
    icon: Building2,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { clienteId } = useCliente();
  const { user } = useAuth();

  // Check if user is a supervisor (limited menu)
  const isSupervisor = user?.role === 'supervisor';

  // Filter configuration items based on user role
  const filteredConfiguracionSubItems = configuracionSubItems.filter(item => {
    if ('requiresAdmin' in item && item.requiresAdmin) {
      return user?.role === 'cliente_admin' || user?.role === 'cliente_master';
    }
    return true;
  });

  // Helper to build cliente-scoped URLs
  const url = (path: string) => clienteId ? `/${clienteId}${path}` : path;

  // Helper to check if a path is active (ignoring the clienteId prefix)
  const pathWithoutCliente = clienteId ? location.replace(`/${clienteId}`, '') : location;
  const isActive = (path: string) => pathWithoutCliente === path || pathWithoutCliente === '';
  const startsWithPath = (prefix: string) => pathWithoutCliente.startsWith(prefix);

  const isEmployeesActive = startsWithPath("/employees");
  const isPayrollActive = startsWithPath("/payroll") || startsWithPath("/attendance");
  const isOrganizacionActive = startsWithPath("/organizacion");
  const isReclutamientoActive = startsWithPath("/reclutamiento");
  const isGestionPersonalActive = startsWithPath("/vacaciones") || startsWithPath("/incapacidades") || startsWithPath("/permisos") || startsWithPath("/creditos") || startsWithPath("/actas-administrativas");
  const isCursosActive = startsWithPath("/cursos-capacitaciones");
  const isDocumentosActive = startsWithPath("/documentos");
  const isImssActive = startsWithPath("/imss");
  const isConfiguracionActive = startsWithPath("/configuration");

  // Supervisor limited menu
  if (isSupervisor) {
    return (
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 px-2 mb-2">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-base font-semibold">PeopleOps</h1>
              <span className="text-xs text-muted-foreground">Supervisor</span>
            </div>
          </div>
          <Separator className="mt-2" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menú</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathWithoutCliente === "" || pathWithoutCliente === "/"}
                    data-testid="link-dashboard"
                  >
                    <Link href={url("")}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isEmployeesActive}
                    data-testid="link-empleados"
                  >
                    <Link href={url("/employees")}>
                      <Users className="h-4 w-4" />
                      <span>Empleados</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={startsWithPath("/attendance")}
                    data-testid="link-incidencias"
                  >
                    <Link href={url("/attendance")}>
                      <Calendar className="h-4 w-4" />
                      <span>Incidencias</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={startsWithPath("/vacaciones")}
                    data-testid="link-vacaciones"
                  >
                    <Link href={url("/vacaciones")}>
                      <Umbrella className="h-4 w-4" />
                      <span>Vacaciones</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={startsWithPath("/permisos")}
                    data-testid="link-permisos"
                  >
                    <Link href={url("/permisos")}>
                      <Clock className="h-4 w-4" />
                      <span>Permisos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <UserFooter />
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2 mb-2">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-base font-semibold">PeopleOps</h1>
          </div>
        </div>
        <ClienteSelector />
        <Separator className="mt-2" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathWithoutCliente === "" || pathWithoutCliente === "/"}
                  data-testid="link-dashboard"
                >
                  <Link href={url("")}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <Collapsible defaultOpen={isEmployeesActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isEmployeesActive}
                      data-testid="link-empleados"
                    >
                      <Users className="h-4 w-4" />
                      <span>Empleados</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {employeeSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathWithoutCliente === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase()}`}
                          >
                            <Link href={url(subItem.url)}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isPayrollActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isPayrollActive}
                      data-testid="link-nomina"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Nómina</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {payrollSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathWithoutCliente === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={url(subItem.url)}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isOrganizacionActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isOrganizacionActive}
                      data-testid="link-organizacion"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Organización</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {organizacionSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathWithoutCliente === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase()}`}
                          >
                            <Link href={url(subItem.url)}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isReclutamientoActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isReclutamientoActive}
                      data-testid="link-reclutamiento"
                    >
                      <UserSearch className="h-4 w-4" />
                      <span>Reclutamiento</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {reclutamientoSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathWithoutCliente === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={url(subItem.url)}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCursosActive}
                  data-testid="link-cursos-capacitaciones"
                >
                  <Link href={url("/cursos-capacitaciones")}>
                    <GraduationCap className="h-4 w-4" />
                    <span>Cursos y Evaluaciones</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isDocumentosActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isDocumentosActive}
                      data-testid="link-documentos"
                    >
                      <FileSignature className="h-4 w-4" />
                      <span>Documentos</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {documentosSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathWithoutCliente === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={url(subItem.url)}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isGestionPersonalActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isGestionPersonalActive}
                      data-testid="link-gestion-personal"
                    >
                      <UserCog className="h-4 w-4" />
                      <span>Gestión de Personal</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {gestionPersonalSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathWithoutCliente === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase()}`}
                          >
                            <Link href={url(subItem.url)}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isImssActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isImssActive}
                      data-testid="link-imss"
                    >
                      <Shield className="h-4 w-4" />
                      <span>IMSS / SUA</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {imssSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathWithoutCliente === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={url(subItem.url)}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isConfiguracionActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isConfiguracionActive}
                      data-testid="link-configuracion"
                    >
                      <Calculator className="h-4 w-4" />
                      <span>Configuración</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {filteredConfiguracionSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathWithoutCliente === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={url(subItem.url)}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {mainMenuItems.filter(item => item.title !== "Dashboard").map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathWithoutCliente === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={url(item.url)}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <UserFooter />
    </Sidebar>
  );
}

function UserFooter() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const initials = user.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.username.slice(0, 2).toUpperCase();

  return (
    <SidebarFooter className="border-t">
      <div className="flex items-center gap-3 p-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" data-testid="text-user-name">
            {user.nombre || user.username}
          </p>
          <p className="text-xs text-muted-foreground truncate" data-testid="text-user-role">
            {user.tipoUsuario === 'internal' ? 'MaxTalent' : 'Cliente'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="shrink-0"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </SidebarFooter>
  );
}
