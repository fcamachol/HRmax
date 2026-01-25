import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  PlayCircle,
  FileText,
  Video,
  Link as LinkIcon,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Curso, ModuloCurso, LeccionCurso } from "@shared/schema";

interface ModuloConLecciones extends ModuloCurso {
  lecciones: LeccionCurso[];
}

interface CursoCompleto {
  curso: Curso;
  modulos: ModuloConLecciones[];
}

export default function CursoPreview() {
  const params = useParams<{ id: string }>();
  const cursoId = params.id;

  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  const [currentLeccion, setCurrentLeccion] = useState<LeccionCurso | null>(null);

  const { data: cursoCompleto, isLoading } = useQuery<CursoCompleto>({
    queryKey: [`/api/cursos/${cursoId}/completo`],
    enabled: !!cursoId,
  });

  // Set first lesson as current when data loads
  useEffect(() => {
    if (cursoCompleto && !currentLeccion) {
      const firstModulo = cursoCompleto.modulos[0];
      if (firstModulo?.lecciones[0]) {
        setCurrentLeccion(firstModulo.lecciones[0]);
        setExpandedModulos(new Set([firstModulo.id]));
      }
    }
  }, [cursoCompleto, currentLeccion]);

  const toggleModulo = (moduloId: string) => {
    setExpandedModulos((prev) => {
      const next = new Set(prev);
      if (next.has(moduloId)) {
        next.delete(moduloId);
      } else {
        next.add(moduloId);
      }
      return next;
    });
  };

  const handleSelectLeccion = (leccion: LeccionCurso) => {
    setCurrentLeccion(leccion);
  };

  const getTipoContenidoIcon = (tipo: string) => {
    switch (tipo) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "texto":
        return <FileText className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      case "quiz":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
  };

  const renderLeccionContent = () => {
    if (!currentLeccion) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Selecciona una lección para ver su contenido</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{currentLeccion.nombre}</h2>
          <Badge variant="outline">
            {getTipoContenidoIcon(currentLeccion.tipoContenido)}
            <span className="ml-1 capitalize">{currentLeccion.tipoContenido}</span>
          </Badge>
        </div>

        {currentLeccion.descripcion && (
          <p className="text-sm text-muted-foreground">{currentLeccion.descripcion}</p>
        )}

        {currentLeccion.duracionEstimadaMinutos && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{currentLeccion.duracionEstimadaMinutos} minutos</span>
          </div>
        )}

        {/* Content based on type */}
        <div className="min-h-[300px] bg-muted/30 rounded-lg">
          {currentLeccion.tipoContenido === "video" && currentLeccion.videoUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              {extractYouTubeId(currentLeccion.videoUrl) ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${extractYouTubeId(currentLeccion.videoUrl)}`}
                  title={currentLeccion.nombre}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="border-0"
                />
              ) : (
                <video
                  src={currentLeccion.videoUrl}
                  controls
                  className="w-full h-full"
                />
              )}
            </div>
          )}

          {currentLeccion.tipoContenido === "texto" && (
            <div className="prose prose-sm max-w-none p-6">
              {(currentLeccion.contenido as any)?.texto || (
                <p className="text-muted-foreground italic">Sin contenido de texto</p>
              )}
            </div>
          )}

          {currentLeccion.tipoContenido === "link" && currentLeccion.videoUrl && (
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-3">
                Este recurso es un enlace externo:
              </p>
              <a
                href={currentLeccion.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                {currentLeccion.videoUrl}
              </a>
            </div>
          )}

          {currentLeccion.tipoContenido === "documento" && currentLeccion.archivoUrl && (
            <div className="p-6 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm mb-3">{currentLeccion.archivoNombre || "Documento"}</p>
              <a
                href={currentLeccion.archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  Abrir documento
                </Button>
              </a>
            </div>
          )}

          {currentLeccion.tipoContenido === "quiz" && (
            <div className="p-6 text-center">
              <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Esta lección contiene un quiz que los empleados deberán completar.
              </p>
            </div>
          )}

          {!currentLeccion.videoUrl &&
           !currentLeccion.archivoUrl &&
           !(currentLeccion.contenido as any)?.texto &&
           currentLeccion.tipoContenido !== "quiz" && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No hay contenido configurado para esta lección</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!cursoCompleto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Curso no encontrado</p>
          <Link href="/cursos-capacitaciones">
            <Button>Volver a Cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { curso, modulos } = cursoCompleto;
  const totalLecciones = modulos.reduce((acc, m) => acc + m.lecciones.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Link href={`/cursos-capacitaciones/${cursoId}/editar`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold truncate">{curso.nombre}</h1>
              <Badge variant="secondary">
                <Eye className="h-3 w-3 mr-1" />
                Vista Previa
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{modulos.length} módulos</span>
              <span>{totalLecciones} lecciones</span>
              {curso.duracionEstimadaMinutos && (
                <span>{curso.duracionEstimadaMinutos} min</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main content area */}
        <div className="flex-1 p-4">
          <Card>
            <CardContent className="p-6">{renderLeccionContent()}</CardContent>
          </Card>
        </div>

        {/* Sidebar - Course structure */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l bg-muted/30">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Contenido del curso</h3>
            {modulos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay módulos en este curso
              </p>
            ) : (
              <div className="space-y-2">
                {modulos.map((modulo, moduloIndex) => (
                  <Collapsible
                    key={modulo.id}
                    open={expandedModulos.has(modulo.id)}
                    onOpenChange={() => toggleModulo(modulo.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-2 h-auto"
                      >
                        {expandedModulos.has(modulo.id) ? (
                          <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate text-left">
                          {moduloIndex + 1}. {modulo.nombre}
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 space-y-1">
                      {modulo.lecciones.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2">
                          Sin lecciones
                        </p>
                      ) : (
                        modulo.lecciones.map((leccion, leccionIndex) => {
                          const isActive = currentLeccion?.id === leccion.id;

                          return (
                            <button
                              key={leccion.id}
                              onClick={() => handleSelectLeccion(leccion)}
                              className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted"
                              }`}
                            >
                              {isActive ? (
                                <PlayCircle className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                getTipoContenidoIcon(leccion.tipoContenido)
                              )}
                              <span className="truncate flex-1">
                                {moduloIndex + 1}.{leccionIndex + 1} {leccion.nombre}
                              </span>
                              {leccion.duracionEstimadaMinutos && (
                                <span className="text-xs text-muted-foreground">
                                  {leccion.duracionEstimadaMinutos}m
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
