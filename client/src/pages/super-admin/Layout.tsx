import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Users, Building2, LogOut, Shield } from "lucide-react";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const superAdminUser = localStorage.getItem("superAdminUser");
    if (!superAdminUser) {
      toast({
        title: "Acceso denegado",
        description: "Debe iniciar sesión como super administrador",
        variant: "destructive",
      });
      setLocation("/super-admin/login");
    }
  }, [setLocation, toast]);

  const handleLogout = () => {
    localStorage.removeItem("superAdminUser");
    toast({
      title: "Sesión cerrada",
      description: "Ha cerrado sesión exitosamente",
    });
    setLocation("/super-admin/login");
  };

  const menuItems = [
    {
      title: "Usuarios",
      url: "/super-admin/users",
      icon: Users,
    },
    {
      title: "Clientes",
      url: "/super-admin/clientes",
      icon: Building2,
    },
  ];

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 px-2 py-4">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Super Admin</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <div className="mt-auto p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
