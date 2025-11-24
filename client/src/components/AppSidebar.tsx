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
  ClipboardCheck,
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

const configuracionSubItems = [
  {
    title: "General",
    url: "/configuration",
    icon: Settings,
  },
  {
    title: "Medios de Pago",
    url: "/configuration/medios-pago",
    icon: Wallet,
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
    title: "REPSE",
    url: "/repse",
    icon: ClipboardCheck,
  },
  {
    title: "Empresas",
    url: "/empresas",
    icon: Building2,
  },
  {
    title: "Ajustes",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const isEmployeesActive = location.startsWith("/employees");
  const isPayrollActive = location.startsWith("/payroll") || location.startsWith("/attendance");
  const isOrganizacionActive = location.startsWith("/organizacion");
  const isReclutamientoActive = location.startsWith("/reclutamiento");
  const isGestionPersonalActive = location.startsWith("/vacaciones") || location.startsWith("/incapacidades") || location.startsWith("/permisos") || location.startsWith("/creditos") || location.startsWith("/actas-administrativas");
  const isConfiguracionActive = location.startsWith("/configuration");

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">NominaHub</h1>
            <p className="text-xs text-muted-foreground">Sistema RH México</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/"}
                  data-testid="link-dashboard"
                >
                  <Link href="/">
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
                            isActive={location === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase()}`}
                          >
                            <Link href={subItem.url}>
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
                            isActive={location === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={subItem.url}>
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
                            isActive={location === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase()}`}
                          >
                            <Link href={subItem.url}>
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
                            isActive={location === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={subItem.url}>
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
                            isActive={location === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase()}`}
                          >
                            <Link href={subItem.url}>
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
                      {configuracionSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === subItem.url}
                            data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={subItem.url}>
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
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
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
    </Sidebar>
  );
}
