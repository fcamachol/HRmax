import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Circle,
  PlayCircle,
  FileText,
  Video,
  Link as LinkIcon,
  HelpCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Award,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import type { Curso, ModuloCurso, LeccionCurso, AsignacionCurso, ProgresoLeccion, QuizCurso, PreguntaQuiz } from "@shared/schema";

interface ModuloConLecciones extends ModuloCurso {
  lecciones: LeccionCurso[];
}

interface QuizConPreguntas extends QuizCurso {
  preguntas: PreguntaQuiz[];
}

interface CursoContenido {
  asignacion: AsignacionCurso;
  curso: Curso;
  modulos: ModuloConLecciones[];
  progresos: ProgresoLeccion[];
  quizzes: QuizConPreguntas[];
}

export default function CursoPlayer() {
  const params = useParams<{ asignacionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clienteId } = usePortalAuth();

  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  const [currentLeccion, setCurrentLeccion] = useState<LeccionCurso | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; correctAnswers: Record<string, boolean> } | null>(null);

  const { data: contenido, isLoading } = useQuery<CursoContenido>({
    queryKey: [`/api/portal/cursos/${params.asignacionId}`],
    enabled: !!params.asignacionId,
  });

  const iniciarMutation = useMutation({
    mutationFn: async () => {
      return (await apiRequest("POST", `/api/portal/cursos/${params.asignacionId}/iniciar`)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portal/cursos/${params.asignacionId}`] });
    },
  });

  const completarLeccionMutation = useMutation({
    mutationFn: async ({ leccionId, tiempoSegundos }: { leccionId: string; tiempoSegundos: number }) => {
      return (await apiRequest("POST", `/api/portal/lecciones/${leccionId}/completar`, {
        asignacionId: params.asignacionId,
        tiempoSegundos,
      })).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portal/cursos/${params.asignacionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/mis-cursos"] });
      toast({ title: "Lección completada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async ({ quizId, respuestas }: { quizId: string; respuestas: Record<string, string | string[]> }) => {
      return (await apiRequest("POST", `/api/portal/quiz/${quizId}/submit`, {
        asignacionId: params.asignacionId,
        respuestas,
      })).json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      setQuizSubmitted(true);
      queryClient.invalidateQueries({ queryKey: [`/api/portal/cursos/${params.asignacionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/mis-cursos"] });
      if (data.passed) {
        toast({ title: "¡Felicidades!", description: `Aprobaste con ${data.score}%` });
      } else {
        toast({ title: "Quiz completado", description: `Obtuviste ${data.score}%. Se requiere ${data.minScore}% para aprobar.`, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Auto-start course if not started
  useEffect(() => {
    if (contenido?.asignacion?.estatus === "asignado" && !iniciarMutation.isPending) {
      iniciarMutation.mutate();
    }
  }, [contenido?.asignacion?.estatus]);

  // Set first uncompleted lesson as current
  useEffect(() => {
    if (contenido && !currentLeccion) {
      const completedIds = new Set(
        contenido.progresos
          .filter((p) => p.estatus === "completado")
          .map((p) => p.leccionId)
      );

      for (const modulo of contenido.modulos) {
        for (const leccion of modulo.lecciones) {
          if (!completedIds.has(leccion.id)) {
            setCurrentLeccion(leccion);
            setExpandedModulos(new Set([modulo.id]));
            return;
          }
        }
      }

      // All completed, show first lesson
      if (contenido.modulos[0]?.lecciones[0]) {
        setCurrentLeccion(contenido.modulos[0].lecciones[0]);
        setExpandedModulos(new Set([contenido.modulos[0].id]));
      }
    }
  }, [contenido, currentLeccion]);

  // Track time spent
  useEffect(() => {
    if (currentLeccion) {
      setStartTime(new Date());
    }
  }, [currentLeccion?.id]);

  const getLeccionProgreso = (leccionId: string) => {
    return contenido?.progresos.find((p) => p.leccionId === leccionId);
  };

  const isLeccionCompleted = (leccionId: string) => {
    const progreso = getLeccionProgreso(leccionId);
    return progreso?.estatus === "completado";
  };

  const handleSelectLeccion = (leccion: LeccionCurso) => {
    setCurrentLeccion(leccion);
    setStartTime(new Date());
    // Reset quiz state when changing lessons
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  // Get all lessons in order for navigation
  const getAllLecciones = (): LeccionCurso[] => {
    if (!contenido) return [];
    return contenido.modulos.flatMap((m) => m.lecciones);
  };

  const getCurrentLeccionIndex = (): number => {
    if (!currentLeccion) return -1;
    return getAllLecciones().findIndex((l) => l.id === currentLeccion.id);
  };

  const handlePreviousLeccion = () => {
    const allLecciones = getAllLecciones();
    const currentIndex = getCurrentLeccionIndex();
    if (currentIndex > 0) {
      const prevLeccion = allLecciones[currentIndex - 1];
      handleSelectLeccion(prevLeccion);
      // Expand the module containing this lesson
      const modulo = contenido?.modulos.find((m) =>
        m.lecciones.some((l) => l.id === prevLeccion.id)
      );
      if (modulo) {
        setExpandedModulos((prev) => new Set([...Array.from(prev), modulo.id]));
      }
    }
  };

  const handleNextLeccion = () => {
    const allLecciones = getAllLecciones();
    const currentIndex = getCurrentLeccionIndex();
    if (currentIndex < allLecciones.length - 1) {
      const nextLeccion = allLecciones[currentIndex + 1];
      handleSelectLeccion(nextLeccion);
      // Expand the module containing this lesson
      const modulo = contenido?.modulos.find((m) =>
        m.lecciones.some((l) => l.id === nextLeccion.id)
      );
      if (modulo) {
        setExpandedModulos((prev) => new Set([...Array.from(prev), modulo.id]));
      }
    }
  };

  const hasPreviousLeccion = getCurrentLeccionIndex() > 0;
  const hasNextLeccion = getCurrentLeccionIndex() < getAllLecciones().length - 1;

  const handleCompletarLeccion = () => {
    if (!currentLeccion || !startTime) return;

    const tiempoSegundos = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
    completarLeccionMutation.mutate({
      leccionId: currentLeccion.id,
      tiempoSegundos,
    });

    // Move to next lesson
    if (contenido) {
      let foundCurrent = false;
      for (const modulo of contenido.modulos) {
        for (const leccion of modulo.lecciones) {
          if (foundCurrent && !isLeccionCompleted(leccion.id)) {
            setCurrentLeccion(leccion);
            setExpandedModulos((prev) => new Set([...Array.from(prev), modulo.id]));
            return;
          }
          if (leccion.id === currentLeccion.id) {
            foundCurrent = true;
          }
        }
      }
    }
  };

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
          <p>Selecciona una lección para comenzar</p>
        </div>
      );
    }

    const isCompleted = isLeccionCompleted(currentLeccion.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{currentLeccion.nombre}</h2>
          {isCompleted && (
            <Badge variant="secondary" className="text-green-600 bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completado
            </Badge>
          )}
        </div>

        {currentLeccion.descripcion && (
          <p className="text-sm text-muted-foreground">{currentLeccion.descripcion}</p>
        )}

        {/* Content based on type */}
        <div className="min-h-[200px]">
          {currentLeccion.tipoContenido === "video" && currentLeccion.videoUrl && (
            <div>
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
              {(currentLeccion.contenido as any)?.textoAdicional && (
                <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg mt-4">
                  {(currentLeccion.contenido as any).textoAdicional}
                </div>
              )}
            </div>
          )}

          {currentLeccion.tipoContenido === "texto" && (
            <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg">
              {(currentLeccion.contenido as any)?.texto || "Sin contenido"}
            </div>
          )}

          {currentLeccion.tipoContenido === "link" && currentLeccion.videoUrl && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
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
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm mb-2">{currentLeccion.archivoNombre || "Documento"}</p>
              <a
                href={currentLeccion.archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  Abrir documento
                </Button>
              </a>
            </div>
          )}

          {currentLeccion.tipoContenido === "quiz" && (
            <div className="p-4 bg-muted/50 rounded-lg">
              {(() => {
                const quizId = (currentLeccion as any).quizId;
                const quiz = contenido?.quizzes?.find((q) => q.id === quizId);

                if (!quiz) {
                  return (
                    <div className="text-center py-8">
                      <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        No se encontró el quiz asociado a esta lección.
                      </p>
                    </div>
                  );
                }

                const handleAnswerChange = (preguntaId: string, value: string, isMultiple: boolean) => {
                  if (isMultiple) {
                    setQuizAnswers(prev => {
                      const current = (prev[preguntaId] as string[]) || [];
                      if (current.includes(value)) {
                        return { ...prev, [preguntaId]: current.filter(v => v !== value) };
                      }
                      return { ...prev, [preguntaId]: [...current, value] };
                    });
                  } else {
                    setQuizAnswers(prev => ({ ...prev, [preguntaId]: value }));
                  }
                };

                const handleSubmitQuiz = () => {
                  submitQuizMutation.mutate({ quizId: quiz.id, respuestas: quizAnswers });
                };

                const allQuestionsAnswered = quiz.preguntas?.every(p => {
                  const answer = quizAnswers[p.id];
                  if (p.tipoPregunta === 'multiple_select') {
                    return Array.isArray(answer) && answer.length > 0;
                  }
                  return answer && answer.length > 0;
                });

                return (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <HelpCircle className="h-12 w-12 mx-auto text-primary mb-2" />
                      <h3 className="font-semibold text-lg">{quiz.nombre}</h3>
                      {quiz.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">{quiz.descripcion}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        {quiz.preguntas?.length || 0} preguntas
                        {quiz.calificacionMinima && ` • Mínimo ${quiz.calificacionMinima}% para aprobar`}
                      </p>
                    </div>

                    {quizResult && (
                      <div className={`p-4 rounded-lg mb-4 ${quizResult.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <div className="flex items-center gap-2">
                          {quizResult.passed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <AlertCircle className="h-5 w-5" />
                          )}
                          <span className="font-medium">
                            {quizResult.passed ? '¡Aprobado!' : 'No aprobado'}
                          </span>
                        </div>
                        <p className="text-sm mt-1">Calificación: {quizResult.score}%</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {quiz.preguntas?.sort((a, b) => a.orden - b.orden).map((pregunta, idx) => {
                        const isCorrect = quizResult?.correctAnswers?.[pregunta.id];

                        return (
                          <div
                            key={pregunta.id}
                            className={`border rounded-lg p-4 bg-background ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-red-300 bg-red-50'
                                : ''
                            }`}
                          >
                            <p className="font-medium mb-3">
                              {idx + 1}. {pregunta.pregunta}
                            </p>
                            <div className="space-y-2 ml-4">
                              {pregunta.tipoPregunta === "true_false" ? (
                                <>
                                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                                    <input
                                      type="radio"
                                      name={`q-${pregunta.id}`}
                                      className="accent-primary"
                                      disabled={quizSubmitted}
                                      checked={quizAnswers[pregunta.id] === 'true'}
                                      onChange={() => handleAnswerChange(pregunta.id, 'true', false)}
                                    />
                                    Verdadero
                                  </label>
                                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                                    <input
                                      type="radio"
                                      name={`q-${pregunta.id}`}
                                      className="accent-primary"
                                      disabled={quizSubmitted}
                                      checked={quizAnswers[pregunta.id] === 'false'}
                                      onChange={() => handleAnswerChange(pregunta.id, 'false', false)}
                                    />
                                    Falso
                                  </label>
                                </>
                              ) : pregunta.tipoPregunta === "free_text" ? (
                                <textarea
                                  placeholder="Escribe tu respuesta aquí..."
                                  className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                  rows={3}
                                  disabled={quizSubmitted}
                                  value={(quizAnswers[pregunta.id] as string) || ''}
                                  onChange={(e) => handleAnswerChange(pregunta.id, e.target.value, false)}
                                />
                              ) : (
                                (pregunta.opciones as any[])?.map((opcion: any, optIdx: number) => (
                                  <label key={optIdx} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                                    <input
                                      type={pregunta.tipoPregunta === "multiple_select" ? "checkbox" : "radio"}
                                      name={`q-${pregunta.id}`}
                                      className="accent-primary"
                                      disabled={quizSubmitted}
                                      checked={
                                        pregunta.tipoPregunta === "multiple_select"
                                          ? ((quizAnswers[pregunta.id] as string[]) || []).includes(String(optIdx))
                                          : quizAnswers[pregunta.id] === String(optIdx)
                                      }
                                      onChange={() => handleAnswerChange(
                                        pregunta.id,
                                        String(optIdx),
                                        pregunta.tipoPregunta === "multiple_select"
                                      )}
                                    />
                                    {opcion.texto}
                                  </label>
                                ))
                              )}
                            </div>
                            {quizSubmitted && pregunta.explicacion && (
                              <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                                <strong>Explicación:</strong> {pregunta.explicacion}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!quizSubmitted && (
                      <div className="flex justify-end pt-4">
                        <Button
                          className="px-8"
                          onClick={handleSubmitQuiz}
                          disabled={!allQuestionsAnswered || submitQuizMutation.isPending}
                        >
                          {submitQuizMutation.isPending ? "Enviando..." : "Enviar respuestas"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Mark as complete button */}
        {!isCompleted && currentLeccion.tipoContenido !== "quiz" && (
          <Button
            className="w-full"
            onClick={handleCompletarLeccion}
            disabled={completarLeccionMutation.isPending}
          >
            {completarLeccionMutation.isPending ? "Guardando..." : "Marcar como completada"}
          </Button>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={handlePreviousLeccion}
            disabled={!hasPreviousLeccion}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {getCurrentLeccionIndex() + 1} de {getAllLecciones().length}
          </span>
          <Button
            onClick={handleNextLeccion}
            disabled={!hasNextLeccion}
          >
            Siguiente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!contenido) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Curso no encontrado</p>
          <Link href={`/portal/${clienteId}/cursos`}>
            <Button>Volver a Mis Cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { curso, modulos, asignacion } = contenido;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Link href={`/portal/${clienteId}/cursos`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{curso.nombre}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Progress value={asignacion.porcentajeProgreso || 0} className="w-20 h-1.5" />
              <span>{asignacion.porcentajeProgreso || 0}% completado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main content area */}
        <div className="flex-1 p-4">
          <Card>
            <CardContent className="p-4">{renderLeccionContent()}</CardContent>
          </Card>
        </div>

        {/* Sidebar - Course structure */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l bg-muted/30">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Contenido del curso</h3>
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
                      <span className="text-sm font-medium truncate">
                        {moduloIndex + 1}. {modulo.nombre}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-1">
                    {modulo.lecciones.map((leccion, leccionIndex) => {
                      const isActive = currentLeccion?.id === leccion.id;
                      const completed = isLeccionCompleted(leccion.id);

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
                          {completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : isActive ? (
                            <PlayCircle className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
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
                    })}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
