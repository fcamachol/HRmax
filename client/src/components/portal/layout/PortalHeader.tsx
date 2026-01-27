import { Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PortalHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

// Helper to capitalize first letter
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function PortalHeader({ title }: PortalHeaderProps) {
  const { employee, clienteId } = usePortalAuth();

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

  // Fetch pending approvals count for managers
  const { data: approvalsData } = useQuery({
    queryKey: ["/api/portal/aprobaciones/count"],
    queryFn: async () => {
      const res = await fetch("/api/portal/aprobaciones/count", {
        credentials: "include",
      });
      if (!res.ok) return { count: 0, isManager: false };
      return res.json();
    },
    refetchInterval: 60000,
  });

  const unreadCount = notificationsData?.count || 0;
  const pendingApprovals = approvalsData?.count || 0;
  const isManager = approvalsData?.isManager || false;

  // Get first name for greeting
  const firstName = employee?.nombre?.split(" ")[0] || "Usuario";

  // Format current date in Spanish
  const today = new Date();
  const formattedDate = capitalize(format(today, "EEEE, d 'de' MMMM", { locale: es }));

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 safe-area-top shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
        <div className="flex-1 min-w-0">
          {title ? (
            <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{formattedDate}</p>
              <p className="text-lg font-semibold text-gray-900 truncate">
                Hola, {firstName}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Manager approvals badge */}
          {isManager && pendingApprovals > 0 && (
            <Link href={`/portal/${clienteId}/aprobaciones`}>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <CheckCircle className="h-5 w-5" />
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-amber-500 hover:bg-amber-500"
                >
                  {pendingApprovals > 99 ? "99+" : pendingApprovals}
                </Badge>
                <span className="sr-only">
                  {pendingApprovals} aprobaciones pendientes
                </span>
              </Button>
            </Link>
          )}

          {/* Notifications bell */}
          <Link href={`/portal/${clienteId}/notificaciones`}>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-red-500"
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
      </div>
    </header>
  );
}
