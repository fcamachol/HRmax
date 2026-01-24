import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface PortalHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function PortalHeader({ title }: PortalHeaderProps) {
  const { employee } = usePortalAuth();

  // Fetch unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ["/api/portal/notificaciones/count"],
    queryFn: async () => {
      const res = await fetch("/api/portal/notificaciones/count", {
        credentials: "include",
      });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const unreadCount = notificationsData?.count || 0;

  // Get first name for greeting
  const firstName = employee?.nombre?.split(" ")[0] || "Usuario";

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex-1 min-w-0">
          {title ? (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Hola,</p>
              <p className="text-base font-semibold truncate">{firstName}</p>
            </div>
          )}
        </div>

        <Link href="/portal/notificaciones">
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            <span className="sr-only">
              {unreadCount} notificaciones sin leer
            </span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
