import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  GraduationCap,
  Clock,
  CheckCircle,
  PlayCircle,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

interface CursoAsignado {
  id: string;
  cursoId: string;
  estatus: string;
  porcentajeProgreso: number;
  fechaAsignacion: string;
  fechaVencimiento: string | null;
  esObligatorio: boolean;
  calificacionFinal: number | null;
  aprobado: boolean | null;
  curso: {
    id: string;
    nombre: string;
    descripcion: string;
    imagenUrl: string | null;
    duracionEstimadaMinutos: number | null;
    tipoCapacitacion: string;
    tipoEvaluacion: string | null;
  };
}

export default function MisCursos() {
  const [activeTab, setActiveTab] = useState("en_progreso");
  const { clienteId } = usePortalAuth();

  const { data: cursos = [], isLoading, refetch } = useQuery<CursoAsignado[]>({
    queryKey: ["/api/portal/mis-cursos"],
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const cursosEnProgreso = cursos.filter(
    (c) => c.estatus === "asignado" || c.estatus === "en_progreso"
  );
  const cursosCompletados = cursos.filter((c) => c.estatus === "completado");
  const cursosVencidos = cursos.filter((c) => c.estatus === "vencido");

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case "completado":
        return "text-green-600 bg-green-100";
      case "en_progreso":
        return "text-blue-600 bg-blue-100";
      case "asignado":
        return "text-gray-600 bg-gray-100";
      case "vencido":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getEstatusLabel = (estatus: string) => {
    switch (estatus) {
      case "completado":
        return "Completado";
      case "en_progreso":
        return "En progreso";
      case "asignado":
        return "Por iniciar";
      case "vencido":
        return "Vencido";
      default:
        return estatus;
    }
  };

  const getDaysUntilDue = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null;
    const today = new Date();
    const dueDate = new Date(fechaVencimiento);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderCursoCard = (asignacion: CursoAsignado) => {
    const daysUntilDue = getDaysUntilDue(asignacion.fechaVencimiento);
    const isUrgent = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0;
    const isOverdue = daysUntilDue !== null && daysUntilDue <= 0;

    return (
      <Link key={asignacion.id} href={`/portal/${clienteId}/cursos/${asignacion.id}`}>
        <Card className="mb-3 active:scale-[0.98] transition-transform">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                {asignacion.curso.imagenUrl ? (
                  <img
                    src={asignacion.curso.imagenUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <GraduationCap className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm line-clamp-2">
                    {asignacion.curso.nombre}
                  </h3>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getEstatusColor(asignacion.estatus)}`}
                  >
                    {getEstatusLabel(asignacion.estatus)}
                  </Badge>
                  {asignacion.esObligatorio && (
                    <Badge variant="destructive" className="text-xs">
                      Obligatorio
                    </Badge>
                  )}
                </div>
                {asignacion.estatus !== "completado" && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progreso</span>
                      <span>{asignacion.porcentajeProgreso}%</span>
                    </div>
                    <Progress value={asignacion.porcentajeProgreso} className="h-1.5" />
                  </div>
                )}
                {asignacion.estatus === "completado" && asignacion.calificacionFinal !== null && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">
                      Calificación: {asignacion.calificacionFinal}%
                    </span>
                    {asignacion.aprobado && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                )}
                {(isUrgent || isOverdue) && asignacion.estatus !== "completado" && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? "text-red-600" : "text-orange-600"}`}>
                    <AlertCircle className="h-3 w-3" />
                    {isOverdue
                      ? "Fecha límite pasada"
                      : `${daysUntilDue} días restantes`}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12">
      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <PortalMobileLayout title="Mis Cursos">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 text-center">
                <PlayCircle className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                <div className="text-2xl font-bold">{cursosEnProgreso.length}</div>
                <div className="text-xs text-muted-foreground">En progreso</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
                <div className="text-2xl font-bold">{cursosCompletados.length}</div>
                <div className="text-xs text-muted-foreground">Completados</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <AlertCircle className="h-6 w-6 mx-auto text-red-500 mb-1" />
                <div className="text-2xl font-bold">{cursosVencidos.length}</div>
                <div className="text-xs text-muted-foreground">Vencidos</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="en_progreso" className="text-xs">
                En Progreso ({cursosEnProgreso.length})
              </TabsTrigger>
              <TabsTrigger value="completados" className="text-xs">
                Completados ({cursosCompletados.length})
              </TabsTrigger>
              <TabsTrigger value="vencidos" className="text-xs">
                Vencidos ({cursosVencidos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="en_progreso" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : cursosEnProgreso.length === 0 ? (
                renderEmptyState("No tienes cursos en progreso")
              ) : (
                cursosEnProgreso.map(renderCursoCard)
              )}
            </TabsContent>

            <TabsContent value="completados" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : cursosCompletados.length === 0 ? (
                renderEmptyState("No has completado cursos aún")
              ) : (
                cursosCompletados.map(renderCursoCard)
              )}
            </TabsContent>

            <TabsContent value="vencidos" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 rounded-lg" />
                </div>
              ) : cursosVencidos.length === 0 ? (
                renderEmptyState("No tienes cursos vencidos")
              ) : (
                cursosVencidos.map(renderCursoCard)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>
    </PortalMobileLayout>
  );
}
