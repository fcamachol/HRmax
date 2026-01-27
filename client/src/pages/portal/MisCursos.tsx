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
  Download,
  Award,
  Shield,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface Certificado {
  id: string;
  cursoNombre: string;
  fechaObtencion: string;
  pdfUrl: string;
}

type FilterType = "todos" | "en_curso" | "completado" | "pendiente";

// Course categories for the story carousel
const courseCategories = [
  { id: "seguridad", nombre: "Seguridad", color: "from-orange-500 to-red-500" },
  { id: "cumplimiento", nombre: "Cumplimiento", color: "from-blue-500 to-indigo-600" },
  { id: "liderazgo", nombre: "Liderazgo", color: "from-purple-500 to-pink-600" },
  { id: "tecnologia", nombre: "Tecnología", color: "from-cyan-500 to-blue-600" },
];

export default function MisCursos() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const { clienteId } = usePortalAuth();

  const { data: cursos = [], isLoading, refetch } = useQuery<CursoAsignado[]>({
    queryKey: ["/api/portal/mis-cursos"],
  });

  const { data: certificados = [] } = useQuery<Certificado[]>({
    queryKey: ["/api/portal/mis-certificados"],
    queryFn: async () => {
      const res = await fetch("/api/portal/mis-certificados", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  // Calculate stats
  const cursosObligatorios = cursos.filter((c) => c.esObligatorio);
  const cursosObligatoriosCompletados = cursosObligatorios.filter((c) => c.estatus === "completado");
  const progresoObligatorios = cursosObligatorios.length > 0
    ? Math.round((cursosObligatoriosCompletados.length / cursosObligatorios.length) * 100)
    : 0;

  const cursosEnProgreso = cursos.filter(
    (c) => c.estatus === "en_progreso"
  );
  const cursosPendientes = cursos.filter(
    (c) => c.estatus === "asignado"
  );
  const cursosCompletados = cursos.filter((c) => c.estatus === "completado");

  // Get the course to continue (most recent in progress or first pending)
  const cursoAContinuar = cursosEnProgreso[0] || cursosPendientes[0];

  const getFilteredCursos = () => {
    switch (activeFilter) {
      case "en_curso":
        return cursosEnProgreso;
      case "completado":
        return cursosCompletados;
      case "pendiente":
        return cursosPendientes;
      default:
        return cursos;
    }
  };

  const getEstatusLabel = (estatus: string) => {
    switch (estatus) {
      case "completado":
        return "Completado";
      case "en_progreso":
        return "En curso";
      case "asignado":
        return "No iniciado";
      case "vencido":
        return "Vencido";
      default:
        return estatus;
    }
  };

  const getEstatusBadgeStyle = (estatus: string) => {
    switch (estatus) {
      case "completado":
        return "bg-green-500 text-white";
      case "en_progreso":
        return "bg-[#135bec] text-white";
      case "asignado":
        return "bg-gray-500 text-white";
      case "vencido":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getProgressBarColor = (estatus: string) => {
    switch (estatus) {
      case "completado":
        return "bg-green-500";
      case "en_progreso":
        return "bg-[#135bec]";
      default:
        return "bg-gray-300";
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getRemainingTime = (asignacion: CursoAsignado) => {
    if (!asignacion.curso.duracionEstimadaMinutos) return null;
    const totalMinutes = asignacion.curso.duracionEstimadaMinutos;
    const remainingMinutes = Math.round(totalMinutes * (1 - asignacion.porcentajeProgreso / 100));
    return formatDuration(remainingMinutes);
  };

  const renderCourseCard = (asignacion: CursoAsignado) => {
    const remainingTime = getRemainingTime(asignacion);
    const duration = formatDuration(asignacion.curso.duracionEstimadaMinutos);

    return (
      <Link key={asignacion.id} href={`/portal/${clienteId}/cursos/${asignacion.id}`}>
        <div className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
          {/* Course Image */}
          <div
            className="relative h-28 bg-cover bg-center bg-gradient-to-br from-[#135bec] to-blue-400"
            style={asignacion.curso.imagenUrl ? { backgroundImage: `url("${asignacion.curso.imagenUrl}")` } : {}}
          >
            {/* Status Badge */}
            <div className={cn(
              "absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1",
              getEstatusBadgeStyle(asignacion.estatus)
            )}>
              {asignacion.estatus === "completado" && <Check className="h-3 w-3" />}
              {getEstatusLabel(asignacion.estatus)}
            </div>
          </div>

          {/* Course Info */}
          <div className="p-3 flex flex-col flex-1 justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                {asignacion.curso.nombre}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {asignacion.estatus === "completado" && asignacion.calificacionFinal !== null
                  ? `Calificación: ${asignacion.calificacionFinal}%`
                  : asignacion.estatus === "en_progreso" && remainingTime
                    ? `${remainingTime} restantes`
                    : duration || ""}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn("h-1.5 rounded-full transition-all", getProgressBarColor(asignacion.estatus))}
                style={{ width: `${asignacion.porcentajeProgreso}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <PortalMobileLayout showHeader={false}>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-[#f6f6f8] min-h-screen pb-24">
          {/* Page Title */}
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Capacitación</h1>
          </div>

          {/* Progress Card - Mandatory Courses */}
          <div className="px-4 pb-4">
            <div className="relative flex flex-col rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              {/* Background decorative element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#135bec]/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />

              <div className="p-5 flex flex-col gap-4 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                      Cursos Obligatorios
                    </h3>
                    <p className="text-sm text-gray-500">Progreso anual de cumplimiento</p>
                  </div>
                  <div className="flex items-center justify-center bg-[#135bec]/10 rounded-full p-2 text-[#135bec]">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-bold text-gray-900">{progresoObligatorios}%</span>
                    <span className="text-xs font-medium text-gray-500 mb-1">
                      {cursosObligatoriosCompletados.length} de {cursosObligatorios.length} completados
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#135bec] h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progresoObligatorios}%` }}
                    />
                  </div>
                </div>

                {cursoAContinuar && (
                  <Link href={`/portal/${clienteId}/cursos/${cursoAContinuar.id}`}>
                    <Button className="mt-2 w-full h-10 bg-[#135bec] hover:bg-[#135bec]/90 text-white font-semibold shadow-lg shadow-[#135bec]/20">
                      <span>Continuar aprendizaje</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Categories Carousel */}
          {courseCategories.length > 0 && (
            <div className="flex flex-col pt-2">
              <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="text-lg font-bold text-gray-900">Categorías</h2>
                <button className="text-sm font-medium text-[#135bec]">Ver todas</button>
              </div>
              <div className="flex w-full overflow-x-auto no-scrollbar px-4 pb-4 snap-x snap-mandatory">
                <div className="flex flex-row gap-4">
                  {courseCategories.map((category) => (
                    <div key={category.id} className="flex flex-col gap-2 w-[100px] snap-start">
                      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
                        <div className={cn(
                          "w-full h-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-110 flex items-center justify-center",
                          category.color
                        )}>
                          <GraduationCap className="h-10 w-10 text-white/80" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-2 left-2 text-white font-medium text-xs">
                          {category.nombre}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Course Grid Section */}
          <div className="flex flex-col mt-2">
            <div className="px-4 pb-3">
              <h2 className="text-xl font-bold text-gray-900">Mis Cursos</h2>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "en_curso", label: "En curso" },
                  { key: "completado", label: "Completado" },
                  { key: "pendiente", label: "Pendiente" },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={cn(
                    "flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                    activeFilter === filter.key
                      ? "bg-[#135bec] text-white shadow-md shadow-[#135bec]/20"
                      : "bg-white border border-gray-200 text-gray-600"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Course Grid */}
            <div className="px-4">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      <Skeleton className="h-28 w-full" />
                      <div className="p-3">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-20 mb-3" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : getFilteredCursos().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="bg-gray-100 rounded-full p-6 mb-4">
                    <GraduationCap className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {activeFilter === "completado"
                      ? "Sin cursos completados"
                      : activeFilter === "en_curso"
                        ? "Sin cursos en progreso"
                        : activeFilter === "pendiente"
                          ? "Sin cursos pendientes"
                          : "Sin cursos asignados"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    {activeFilter === "todos"
                      ? "Cuando te asignen cursos aparecerán aquí."
                      : "No tienes cursos en esta categoría."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {getFilteredCursos().map(renderCourseCard)}
                </div>
              )}
            </div>
          </div>

          {/* Certificates Section */}
          {certificados.length > 0 && (
            <div className="mt-6 px-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Mis Certificados
              </h2>
              <div className="space-y-3">
                {certificados.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {cert.cursoNombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        Obtenido el{" "}
                        {format(new Date(cert.fechaObtencion), "d MMM yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => window.open(cert.pdfUrl, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-8" />
        </div>
      </PullToRefresh>
    </PortalMobileLayout>
  );
}
