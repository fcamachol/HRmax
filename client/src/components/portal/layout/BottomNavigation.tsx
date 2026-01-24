import { Link, useLocation } from "wouter";
import { Home, FileText, Receipt, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: "Inicio", url: "/portal", icon: Home },
  { title: "Solicitudes", url: "/portal/solicitudes", icon: FileText },
  { title: "Recibos", url: "/portal/recibos", icon: Receipt },
  { title: "Más", url: "/portal/mas", icon: Menu },
  { title: "Perfil", url: "/portal/perfil", icon: User },
];

export function BottomNavigation() {
  const [location] = useLocation();

  const isActive = (url: string) => {
    if (url === "/portal") {
      return location === "/portal" || location === "/portal/";
    }
    return location.startsWith(url);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.url);
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
