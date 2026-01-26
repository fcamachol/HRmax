import { Link, useLocation } from "wouter";
import { Home, FileText, Receipt, GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItemsConfig: NavItem[] = [
  { title: "Inicio", path: "", icon: Home },
  { title: "Solicitudes", path: "/solicitudes", icon: FileText },
  { title: "Cursos", path: "/cursos", icon: GraduationCap },
  { title: "Recibos", path: "/recibos", icon: Receipt },
  { title: "Perfil", path: "/perfil", icon: User },
];

export function BottomNavigation() {
  const [location] = useLocation();
  const { clienteId } = usePortalAuth();

  const baseUrl = `/portal/${clienteId}`;
  const navItems = navItemsConfig.map(item => ({
    ...item,
    url: `${baseUrl}${item.path}`,
  }));

  const isActive = (url: string, path: string) => {
    if (path === "") {
      return location === baseUrl || location === `${baseUrl}/`;
    }
    return location.startsWith(url);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item, index) => {
          const active = isActive(item.url, navItemsConfig[index].path);
          const Icon = item.icon;

          return (
            <Link key={item.url} href={item.url}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full min-w-[64px] px-2 py-1 rounded-lg transition-colors",
                  "active:bg-accent/50 touch-manipulation",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 mb-0.5 transition-transform",
                    active && "scale-110"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight",
                    active && "font-semibold"
                  )}
                >
                  {item.title}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
