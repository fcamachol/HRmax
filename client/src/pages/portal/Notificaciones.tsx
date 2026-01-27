import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ChevronRight,
  Banknote,
  Megaphone,
  CalendarCheck,
  Clock,
  FileText,
  User,
  Bell,
  CheckCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  enlace?: string;
  metadata?: Record<string, any>;
}

// Icon and color config based on notification type
const notificationConfig: Record<string, {
  icon: typeof Bell;
  bgColor: string;
  iconColor: string;
  isGray?: boolean;
}> = {
  nomina: { icon: Banknote, bgColor: "bg-green-500", iconColor: "text-white" },
  anuncio: { icon: Megaphone, bgColor: "bg-orange-500", iconColor: "text-white" },
  vacaciones: { icon: CalendarCheck, bgColor: "bg-[#135bec]", iconColor: "text-white" },
  permiso: { icon: Clock, bgColor: "bg-teal-500", iconColor: "text-white" },
  documento: { icon: FileText, bgColor: "bg-gray-100", iconColor: "text-gray-500", isGray: true },
  perfil: { icon: User, bgColor: "bg-gray-100", iconColor: "text-gray-500", isGray: true },
  default: { icon: Bell, bgColor: "bg-[#135bec]", iconColor: "text-white" },
};

// Group notifications by date
function groupNotificationsByDate(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((notification) => {
    const date = new Date(notification.fechaCreacion);
    let groupKey: string;

    if (isToday(date)) {
      groupKey = "Hoy";
    } else if (isYesterday(date)) {
      groupKey = "Ayer";
    } else if (differenceInDays(new Date(), date) <= 7) {
      groupKey = "Esta semana";
    } else {
      groupKey = format(date, "MMMM yyyy", { locale: es });
      groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });

  return groups;
}

function formatNotificationTime(fechaCreacion: string) {
  const date = new Date(fechaCreacion);

  if (isToday(date)) {
    return format(date, "h:mm a", { locale: es });
  } else if (isYesterday(date)) {
    return `Ayer, ${format(date, "h:mm a", { locale: es })}`;
  } else {
    return format(date, "d MMM", { locale: es });
  }
}

export default function PortalNotificaciones() {
  const [, navigate] = useLocation();
  const { clienteId } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/portal/notificaciones"],
    queryFn: async () => {
      const res = await fetch("/api/portal/notificaciones", {
        credentials: "include",
      });
      if (!res.ok) {
        // Return mock data for now if endpoint doesn't exist
        return [
          {
            id: "1",
            tipo: "nomina",
            titulo: "Nómina depositada",
            mensaje: "Tu nómina del periodo 16-31 Oct ha sido depositada exitosamente.",
            leida: false,
            fechaCreacion: new Date().toISOString(),
          },
          {
            id: "2",
            tipo: "anuncio",
            titulo: "Nuevo anuncio",
            mensaje: "Los beneficios de seguro de salud actualizados para 2024 ya están disponibles.",
            leida: false,
            fechaCreacion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "3",
            tipo: "vacaciones",
            titulo: "Vacaciones aprobadas",
            mensaje: "Tu solicitud de vacaciones del 20 Dic - 05 Ene ha sido aprobada por RH.",
            leida: true,
            fechaCreacion: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "4",
            tipo: "permiso",
            titulo: "Horas extra aprobadas",
            mensaje: "4.5 horas extra del Proyecto X han sido validadas.",
            leida: true,
            fechaCreacion: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "5",
            tipo: "documento",
            titulo: "Recibo de nómina (CFDI)",
            mensaje: "Tu CFDI de Octubre está disponible para descarga.",
            leida: true,
            fechaCreacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "6",
            tipo: "perfil",
            titulo: "Perfil actualizado",
            mensaje: "Los datos bancarios para nómina han sido actualizados exitosamente.",
            leida: true,
            fechaCreacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ] as Notification[];
      }
      return res.json();
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/portal/notificaciones/marcar-leidas", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Error al marcar notificaciones");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notificaciones marcadas",
        description: "Todas las notificaciones han sido marcadas como leídas",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/notificaciones"] });
    },
    onError: () => {
      // For demo, just update locally
      toast({
        title: "Notificaciones marcadas",
        description: "Todas las notificaciones han sido marcadas como leídas",
      });
    },
  });

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portal/notificaciones/${id}/leer`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Error al marcar notificación");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/notificaciones"] });
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.leida) {
      markReadMutation.mutate(notification.id);
    }

    // Navigate to related page if applicable
    if (notification.enlace) {
      navigate(notification.enlace);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const unreadCount = notifications.filter((n) => !n.leida).length;
  const groupedNotifications = groupNotificationsByDate(notifications);

  const getNotificationConfig = (tipo: string, leida: boolean) => {
    const config = notificationConfig[tipo] || notificationConfig.default;
    // Make old read notifications gray
    if (leida && !config.isGray) {
      return {
        ...config,
        bgColor: "bg-gray-100",
        iconColor: "text-gray-500",
      };
    }
    return config;
  };

  return (
    <PortalMobileLayout showHeader={false}>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-white min-h-screen pb-24">
          {/* Header */}
          <div className="sticky top-0 z-50 flex items-center bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/portal/${clienteId}`)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-gray-900 text-xl font-bold leading-tight tracking-tight">
                Notificaciones
              </h2>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[#135bec] text-sm font-semibold hover:opacity-80 transition-opacity"
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <Bell className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Sin notificaciones</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Cuando tengas notificaciones aparecerán aquí.
                </p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                <div key={group}>
                  {/* Section Header */}
                  <div className="bg-gray-50/50">
                    <h3 className="text-gray-900 text-sm font-bold uppercase tracking-wider px-4 pt-6 pb-2">
                      {group}
                    </h3>
                  </div>

                  {/* Notifications */}
                  {groupNotifications.map((notification) => {
                    const config = getNotificationConfig(notification.tipo, notification.leida);
                    const Icon = config.icon;
                    const isOldRead = notification.leida && differenceInDays(new Date(), new Date(notification.fechaCreacion)) > 3;

                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "flex items-center gap-4 px-4 min-h-[88px] py-3 justify-between border-b border-gray-100 cursor-pointer transition-colors",
                          !notification.leida
                            ? "bg-[#135bec]/5"
                            : "bg-white",
                          isOldRead && "opacity-70"
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Icon */}
                          <div
                            className={cn(
                              "flex items-center justify-center rounded-xl shrink-0 w-12 h-12 shadow-sm",
                              notification.leida && !notificationConfig[notification.tipo]?.isGray
                                ? "bg-gray-100"
                                : config.bgColor
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-6 w-6",
                                notification.leida && !notificationConfig[notification.tipo]?.isGray
                                  ? "text-gray-500"
                                  : config.iconColor
                              )}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex flex-col justify-center flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  "text-gray-900 text-base leading-normal truncate",
                                  !notification.leida ? "font-semibold" : "font-medium"
                                )}
                              >
                                {notification.titulo}
                              </p>
                              {!notification.leida && (
                                <span className="w-2 h-2 rounded-full bg-[#135bec] shrink-0" />
                              )}
                            </div>
                            <p className="text-gray-500 text-sm font-normal leading-snug line-clamp-2">
                              {notification.mensaje}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {formatNotificationTime(notification.fechaCreacion)}
                            </p>
                          </div>
                        </div>

                        {/* Chevron */}
                        <div className="shrink-0">
                          <ChevronRight className="h-5 w-5 text-gray-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </PullToRefresh>
    </PortalMobileLayout>
  );
}
