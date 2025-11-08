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
  Clock,
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

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Nómina",
    url: "/payroll",
    icon: DollarSign,
  },
  {
    title: "Grupos de Nómina",
    url: "/payroll-groups",
    icon: Clock,
  },
  {
    title: "Asistencia",
    url: "/attendance",
    icon: Calendar,
  },
  {
    title: "Centros de Trabajo",
    url: "/centros-trabajo",
    icon: MapPin,
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
    title: "Configuración",
    url: "/configuration",
    icon: Calculator,
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
