import { Link } from "wouter";
import {
  Folder,
  Users,
  Network,
  Megaphone,
  MessageSquare,
  Calendar,
  Shield,
  Gift,
  Settings,
  ChevronRight,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  {
    title: "Mis Documentos",
    description: "Contratos, constancias y más",
    icon: Folder,
    href: "/portal/mas/documentos",
    color: "bg-orange-500",
  },
  {
    title: "Directorio",
    description: "Buscar compañeros",
    icon: Users,
    href: "/portal/mas/directorio",
    color: "bg-blue-500",
  },
  {
    title: "Organigrama",
    description: "Estructura de la empresa",
    icon: Network,
    href: "/portal/mas/organigrama",
    color: "bg-indigo-500",
  },
  {
    title: "Anuncios",
    description: "Noticias de la empresa",
    icon: Megaphone,
    href: "/portal/mas/anuncios",
    color: "bg-red-500",
  },
  {
    title: "Mensajes",
    description: "Comunicación interna",
    icon: MessageSquare,
    href: "/portal/mas/mensajes",
    color: "bg-green-500",
  },
  {
    title: "Asistencia",
    description: "Historial de asistencia",
    icon: Calendar,
    href: "/portal/mas/asistencia",
    color: "bg-cyan-500",
  },
  {
    title: "Incapacidades",
    description: "Historial médico",
    icon: Shield,
    href: "/portal/mas/incapacidades",
    color: "bg-yellow-500",
  },
  {
    title: "Prestaciones",
    description: "Beneficios asignados",
    icon: Gift,
    href: "/portal/mas/prestaciones",
    color: "bg-pink-500",
  },
];

function MenuCard({ item }: { item: MenuItem }) {
  const Icon = item.icon;

  return (
    <Link href={item.href}>
      <Card className="hover:bg-accent/50 transition-colors active:scale-[0.98] touch-manipulation cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              item.color
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {item.description}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PortalMas() {
  const { logout } = usePortalAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/portal/login";
  };

  return (
    <PortalMobileLayout title="Más opciones">
      <div className="p-4 space-y-6">
        {/* Main Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <MenuCard key={item.href} item={item} />
          ))}
        </div>

        <Separator />

        {/* Settings & Help */}
        <div className="space-y-2">
          <Link href="/portal/mas/configuracion">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-500 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Configuración</p>
                  <p className="text-xs text-muted-foreground">
                    Preferencias de la app
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-400 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Ayuda</p>
                <p className="text-xs text-muted-foreground">
                  Preguntas frecuentes
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Cerrar sesión
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          Portal Empleados v1.0.0
        </p>
      </div>
    </PortalMobileLayout>
  );
}
