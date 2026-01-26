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
  path: string;
  color: string;
  badge?: number;
}

const menuItemsConfig: MenuItem[] = [
  {
    title: "Mis Documentos",
    description: "Contratos, constancias y más",
    icon: Folder,
    path: "/mas/documentos",
    color: "bg-orange-500",
  },
  {
    title: "Directorio",
    description: "Buscar compañeros",
    icon: Users,
    path: "/mas/directorio",
    color: "bg-blue-500",
  },
  {
    title: "Organigrama",
    description: "Estructura de la empresa",
    icon: Network,
    path: "/mas/organigrama",
    color: "bg-indigo-500",
  },
  {
    title: "Anuncios",
    description: "Noticias de la empresa",
    icon: Megaphone,
    path: "/mas/anuncios",
    color: "bg-red-500",
  },
  {
    title: "Mensajes",
    description: "Comunicación interna",
    icon: MessageSquare,
    path: "/mas/mensajes",
    color: "bg-green-500",
  },
  {
    title: "Asistencia",
    description: "Historial de asistencia",
    icon: Calendar,
    path: "/mas/asistencia",
    color: "bg-cyan-500",
  },
  {
    title: "Incapacidades",
    description: "Historial médico",
    icon: Shield,
    path: "/mas/incapacidades",
    color: "bg-yellow-500",
  },
  {
    title: "Prestaciones",
    description: "Beneficios asignados",
    icon: Gift,
    path: "/mas/prestaciones",
    color: "bg-pink-500",
  },
];

function MenuCard({ item, clienteId }: { item: MenuItem; clienteId: string }) {
  const Icon = item.icon;

  return (
    <Link href={`/portal/${clienteId}${item.path}`}>
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
  const { logout, clienteId } = usePortalAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = `/portal/${clienteId}/login`;
  };

  return (
    <PortalMobileLayout title="Más opciones">
      <div className="p-4 space-y-6">
        {/* Main Menu Items */}
        <div className="space-y-2">
          {menuItemsConfig.map((item) => (
            <MenuCard key={item.path} item={item} clienteId={clienteId} />
          ))}
        </div>

        <Separator />

        {/* Settings & Help */}
        <div className="space-y-2">
          <Link href={`/portal/${clienteId}/mas/configuracion`}>
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
