import { Link, useLocation } from "wouter";
import { Home, FileText, Clock, GraduationCap, User } from "lucide-react";
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
  { title: "Asistencia", path: "/asistencia", icon: Clock },
  { title: "Capacitación", path: "/cursos", icon: GraduationCap },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-[72px] max-w-lg mx-auto px-2">
          {navItems.map((item, index) => {
            const active = isActive(item.url, navItemsConfig[index].path);
            const Icon = item.icon;

            return (
              <Link key={item.url} href={item.url}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[64px] py-2 transition-all duration-200",
                    "active:scale-95 touch-manipulation"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-2xl mb-0.5 transition-all duration-300",
                      active
                        ? "bg-[#135bec] shadow-lg shadow-blue-500/30"
                        : "bg-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px] transition-colors duration-200",
                        active ? "text-white" : "text-gray-400"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors duration-200",
                      active ? "text-[#135bec]" : "text-gray-400"
                    )}
                  >
                    {item.title}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
