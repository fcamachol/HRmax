import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  HelpCircle,
  CheckCircle,
  XCircle,
  GripVertical,
  Clock,
  Target,
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuizCurso, PreguntaQuiz } from "@shared/schema";

interface QuizConPreguntas extends QuizCurso {
  preguntas: PreguntaQuiz[];
}

interface QuizBuilderProps {
  cursoId: string;
}

interface OpcionPregunta {
  id: string;
  texto: string;
  esCorrecta: boolean;
}

export default function QuizBuilder({ cursoId }: QuizBuilderProps) {
  const { toast } = useToast();
  const [expandedQuizzes, setExpandedQuizzes] = useState<Set<string>>(new Set());

  // Quiz dialog state
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizCurso | null>(null);
  const [quizForm, setQuizForm] = useState({
    nombre: "",
    descripcion: "",
    tipo: "quiz" as string,
    tiempoLimiteMinutos: 0,
    calificacionMinima: 70,
    intentosMaximos: 3,
    mostrarRespuestasCorrectas: true,
    ordenAleatorio: false,
    mezclarOpciones: false,
  });

  // Question dialog state
  const [isPreguntaDialogOpen, setIsPreguntaDialogOpen] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState<PreguntaQuiz | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [preguntaForm, setPreguntaForm] = useState({
    tipoPregunta: "multiple_choice" as string,
    pregunta: "",
    explicacion: "",
    puntos: 1,
    opciones: [
      { id: "1", texto: "", esCorrecta: true },
      { id: "2", texto: "", esCorrecta: false },
    ] as OpcionPregunta[],
  });

  // Delete confirmation
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [deletePreguntaId, setDeletePreguntaId] = useState<string | null>(null);

  // Fetch quizzes
  const { data: quizzes = [], isLoading } = useQuery<QuizConPreguntas[]>({
    queryKey: [`/api/cursos/${cursoId}/quizzes`],
    enabled: !!cursoId,
  });

  // Quiz mutations
  const createQuizMutation = useMutation({
    mutationFn: async (data: typeof quizForm) => {
      return (await apiRequest("POST", `/api/cursos/${cursoId}/quizzes`, data)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/quizzes`] });
      setIsQuizDialogOpen(false);
      resetQuizForm();
      toast({ title: "Quiz creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof quizForm }) => {
      return (await apiRequest("PATCH", `/api/quizzes/${id}`, data)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/quizzes`] });
      setIsQuizDialogOpen(false);
      resetQuizForm();
      toast({ title: "Quiz actualizado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/quizzes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/quizzes`] });
      toast({ title: "Quiz eliminado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Question mutations
  const createPreguntaMutation = useMutation({
    mutationFn: async ({ quizId, data }: { quizId: string; data: any }) => {
      const quiz = quizzes.find(q => q.id === quizId);
      const orden = (quiz?.preguntas?.length || 0) + 1;
      return (await apiRequest("POST", `/api/quizzes/${quizId}/preguntas`, { ...data, orden })).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/quizzes`] });
      setIsPreguntaDialogOpen(false);
      resetPreguntaForm();
      toast({ title: "Pregunta agregada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePreguntaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return (await apiRequest("PATCH", `/api/preguntas/${id}`, data)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/quizzes`] });
      setIsPreguntaDialogOpen(false);
      resetPreguntaForm();
      toast({ title: "Pregunta actualizada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePreguntaMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/preguntas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/quizzes`] });
      toast({ title: "Pregunta eliminada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetQuizForm = () => {
    setQuizForm({
      nombre: "",
      descripcion: "",
      tipo: "quiz",
      tiempoLimiteMinutos: 0,
      calificacionMinima: 70,
      intentosMaximos: 3,
      mostrarRespuestasCorrectas: true,
      ordenAleatorio: false,
      mezclarOpciones: false,
    });
    setEditingQuiz(null);
  };

  const resetPreguntaForm = () => {
    setPreguntaForm({
      tipoPregunta: "multiple_choice",
      pregunta: "",
      explicacion: "",
      puntos: 1,
      opciones: [
        { id: "1", texto: "", esCorrecta: true },
        { id: "2", texto: "", esCorrecta: false },
      ],
    });
    setEditingPregunta(null);
    setSelectedQuizId(null);
  };

  const handleOpenQuizDialog = (quiz?: QuizCurso) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        nombre: quiz.nombre,
        descripcion: quiz.descripcion || "",
        tipo: quiz.tipo,
        tiempoLimiteMinutos: quiz.tiempoLimiteMinutos || 0,
        calificacionMinima: quiz.calificacionMinima || 70,
        intentosMaximos: quiz.intentosMaximos || 3,
        mostrarRespuestasCorrectas: quiz.mostrarRespuestasCorrectas ?? true,
        ordenAleatorio: quiz.ordenAleatorio ?? false,
        mezclarOpciones: quiz.mezclasOpciones ?? false,
      });
    } else {
      resetQuizForm();
    }
    setIsQuizDialogOpen(true);
  };

  const handleOpenPreguntaDialog = (quizId: string, pregunta?: PreguntaQuiz) => {
    setSelectedQuizId(quizId);
    if (pregunta) {
      setEditingPregunta(pregunta);
      setPreguntaForm({
        tipoPregunta: pregunta.tipoPregunta,
        pregunta: pregunta.pregunta,
        explicacion: pregunta.explicacion || "",
        puntos: pregunta.puntos || 1,
        opciones: (pregunta.opciones as OpcionPregunta[]) || [
          { id: "1", texto: "", esCorrecta: true },
          { id: "2", texto: "", esCorrecta: false },
        ],
      });
    } else {
      resetPreguntaForm();
      setSelectedQuizId(quizId);
    }
    setIsPreguntaDialogOpen(true);
  };

  const handleSaveQuiz = () => {
    if (editingQuiz) {
      updateQuizMutation.mutate({ id: editingQuiz.id, data: quizForm });
    } else {
      createQuizMutation.mutate(quizForm);
    }
  };

  const handleSavePregunta = () => {
    const data = {
      tipoPregunta: preguntaForm.tipoPregunta,
      pregunta: preguntaForm.pregunta,
      explicacion: preguntaForm.explicacion || null,
      puntos: preguntaForm.puntos,
      opciones: preguntaForm.tipoPregunta === "free_text" ? null : preguntaForm.opciones,
    };

    if (editingPregunta) {
      updatePreguntaMutation.mutate({ id: editingPregunta.id, data });
    } else if (selectedQuizId) {
      createPreguntaMutation.mutate({ quizId: selectedQuizId, data });
    }
  };

  const addOpcion = () => {
    const newId = String(preguntaForm.opciones.length + 1);
    setPreguntaForm({
      ...preguntaForm,
      opciones: [...preguntaForm.opciones, { id: newId, texto: "", esCorrecta: false }],
    });
  };

  const removeOpcion = (id: string) => {
    if (preguntaForm.opciones.length <= 2) return;
    setPreguntaForm({
      ...preguntaForm,
      opciones: preguntaForm.opciones.filter((o) => o.id !== id),
    });
  };

  const updateOpcion = (id: string, field: keyof OpcionPregunta, value: string | boolean) => {
    setPreguntaForm({
      ...preguntaForm,
      opciones: preguntaForm.opciones.map((o) => {
        if (o.id === id) {
          return { ...o, [field]: value };
        }
        // For single choice, uncheck others when one is selected
        if (field === "esCorrecta" && value === true && preguntaForm.tipoPregunta !== "multiple_select") {
          return { ...o, esCorrecta: false };
        }
        return o;
      }),
    });
  };

  const toggleQuiz = (quizId: string) => {
    setExpandedQuizzes((prev) => {
      const next = new Set(prev);
      if (next.has(quizId)) {
        next.delete(quizId);
      } else {
        next.add(quizId);
      }
      return next;
    });
  };

  const getTipoPreguntaLabel = (tipo: string) => {
    switch (tipo) {
      case "multiple_choice": return "Opción múltiple";
      case "true_false": return "Verdadero/Falso";
      case "multiple_select": return "Selección múltiple";
      case "free_text": return "Respuesta libre";
      default: return tipo;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Evaluaciones</h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Cargando quizzes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Evaluaciones</h2>
        <Button onClick={() => handleOpenQuizDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay evaluaciones en este curso
            </p>
            <Button onClick={() => handleOpenQuizDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <Collapsible
                open={expandedQuizzes.has(quiz.id)}
                onOpenChange={() => toggleQuiz(quiz.id)}
              >
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {expandedQuizzes.has(quiz.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <CardTitle className="text-base">{quiz.nombre}</CardTitle>
                      {quiz.descripcion && (
                        <CardDescription className="text-xs mt-1">
                          {quiz.descripcion}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {quiz.preguntas?.length || 0} preguntas
                      </Badge>
                      <Badge variant="outline">
                        {quiz.tipo === "quiz" ? "Quiz" :
                         quiz.tipo === "assessment" ? "Evaluación" : "Examen"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenQuizDialog(quiz)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteQuizId(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Quiz settings summary */}
                    <div className="flex gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b">
                      {quiz.tiempoLimiteMinutos && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {quiz.tiempoLimiteMinutos} min
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {quiz.calificacionMinima}% para aprobar
                      </div>
                      {quiz.intentosMaximos && (
                        <div className="flex items-center gap-1">
                          <RotateCcw className="h-4 w-4" />
                          {quiz.intentosMaximos} intentos
                        </div>
                      )}
                    </div>

                    {/* Questions */}
                    <div className="space-y-2">
                      {quiz.preguntas && quiz.preguntas.length > 0 ? (
                        quiz.preguntas.map((pregunta, index) => (
                          <div
                            key={pregunta.id}
                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            <div className="flex-1">
                              <p className="text-sm">{pregunta.pregunta}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getTipoPreguntaLabel(pregunta.tipoPregunta)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {pregunta.puntos} {pregunta.puntos === 1 ? "punto" : "puntos"}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenPreguntaDialog(quiz.id, pregunta)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletePreguntaId(pregunta.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay preguntas en este quiz
                        </p>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOpenPreguntaDialog(quiz.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Pregunta
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Editar Quiz" : "Nuevo Quiz"}</DialogTitle>
            <DialogDescription>
              Configura las opciones del quiz o evaluación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Evaluación del Módulo 1"
                value={quizForm.nombre}
                onChange={(e) => setQuizForm({ ...quizForm, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                placeholder="Instrucciones para el empleado..."
                value={quizForm.descripcion}
                onChange={(e) => setQuizForm({ ...quizForm, descripcion: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={quizForm.tipo}
                  onValueChange={(v) => setQuizForm({ ...quizForm, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz (básico)</SelectItem>
                    <SelectItem value="assessment">Evaluación</SelectItem>
                    <SelectItem value="certification_exam">Examen de certificación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tiempo límite (min)</Label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={quizForm.tiempoLimiteMinutos || ""}
                  onChange={(e) => setQuizForm({ ...quizForm, tiempoLimiteMinutos: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Calificación mínima (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={quizForm.calificacionMinima}
                  onChange={(e) => setQuizForm({ ...quizForm, calificacionMinima: parseInt(e.target.value) || 70 })}
                />
              </div>
              <div>
                <Label>Intentos máximos</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ilimitados"
                  value={quizForm.intentosMaximos || ""}
                  onChange={(e) => setQuizForm({ ...quizForm, intentosMaximos: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="mostrarRespuestas">Mostrar respuestas correctas</Label>
                <Switch
                  id="mostrarRespuestas"
                  checked={quizForm.mostrarRespuestasCorrectas}
                  onCheckedChange={(v) => setQuizForm({ ...quizForm, mostrarRespuestasCorrectas: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ordenAleatorio">Orden aleatorio de preguntas</Label>
                <Switch
                  id="ordenAleatorio"
                  checked={quizForm.ordenAleatorio}
                  onCheckedChange={(v) => setQuizForm({ ...quizForm, ordenAleatorio: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="mezclarOpciones">Mezclar opciones de respuesta</Label>
                <Switch
                  id="mezclarOpciones"
                  checked={quizForm.mezclarOpciones}
                  onCheckedChange={(v) => setQuizForm({ ...quizForm, mezclarOpciones: v })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuizDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveQuiz}
              disabled={!quizForm.nombre || createQuizMutation.isPending || updateQuizMutation.isPending}
            >
              {createQuizMutation.isPending || updateQuizMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={isPreguntaDialogOpen} onOpenChange={setIsPreguntaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPregunta ? "Editar Pregunta" : "Nueva Pregunta"}</DialogTitle>
            <DialogDescription>
              Configura la pregunta y sus opciones de respuesta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Pregunta *</Label>
                <Select
                  value={preguntaForm.tipoPregunta}
                  onValueChange={(v) => {
                    setPreguntaForm({
                      ...preguntaForm,
                      tipoPregunta: v,
                      opciones: v === "true_false"
                        ? [
                            { id: "1", texto: "Verdadero", esCorrecta: true },
                            { id: "2", texto: "Falso", esCorrecta: false },
                          ]
                        : v === "free_text"
                        ? []
                        : preguntaForm.opciones,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Opción múltiple</SelectItem>
                    <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                    <SelectItem value="multiple_select">Selección múltiple</SelectItem>
                    <SelectItem value="free_text">Respuesta libre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Puntos</Label>
                <Input
                  type="number"
                  min={1}
                  value={preguntaForm.puntos}
                  onChange={(e) => setPreguntaForm({ ...preguntaForm, puntos: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div>
              <Label>Pregunta *</Label>
              <Textarea
                placeholder="Escribe la pregunta..."
                value={preguntaForm.pregunta}
                onChange={(e) => setPreguntaForm({ ...preguntaForm, pregunta: e.target.value })}
                rows={3}
              />
            </div>

            {/* Options for choice questions */}
            {preguntaForm.tipoPregunta !== "free_text" && (
              <div>
                <Label className="mb-2 block">
                  Opciones de Respuesta
                  {preguntaForm.tipoPregunta === "multiple_select" && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (puede haber múltiples correctas)
                    </span>
                  )}
                </Label>
                <div className="space-y-2">
                  {preguntaForm.opciones.map((opcion, index) => (
                    <div key={opcion.id} className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={opcion.esCorrecta ? "text-green-600" : "text-muted-foreground"}
                        onClick={() => updateOpcion(opcion.id, "esCorrecta", !opcion.esCorrecta)}
                        disabled={preguntaForm.tipoPregunta === "true_false"}
                      >
                        {opcion.esCorrecta ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </Button>
                      <Input
                        placeholder={`Opción ${index + 1}`}
                        value={opcion.texto}
                        onChange={(e) => updateOpcion(opcion.id, "texto", e.target.value)}
                        disabled={preguntaForm.tipoPregunta === "true_false"}
                        className="flex-1"
                      />
                      {preguntaForm.tipoPregunta !== "true_false" && preguntaForm.opciones.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOpcion(opcion.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {preguntaForm.tipoPregunta !== "true_false" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOpcion}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar opción
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Haz clic en el icono para marcar la respuesta correcta
                </p>
              </div>
            )}

            <div>
              <Label>Explicación (opcional)</Label>
              <Textarea
                placeholder="Explica la respuesta correcta..."
                value={preguntaForm.explicacion}
                onChange={(e) => setPreguntaForm({ ...preguntaForm, explicacion: e.target.value })}
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se muestra después de responder si está habilitado
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreguntaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePregunta}
              disabled={
                !preguntaForm.pregunta ||
                (preguntaForm.tipoPregunta !== "free_text" && !preguntaForm.opciones.some((o) => o.esCorrecta)) ||
                createPreguntaMutation.isPending ||
                updatePreguntaMutation.isPending
              }
            >
              {createPreguntaMutation.isPending || updatePreguntaMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Confirmation */}
      <AlertDialog open={!!deleteQuizId} onOpenChange={() => setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todas las preguntas asociadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteQuizId) {
                  deleteQuizMutation.mutate(deleteQuizId);
                  setDeleteQuizId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirmation */}
      <AlertDialog open={!!deletePreguntaId} onOpenChange={() => setDeletePreguntaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePreguntaId) {
                  deletePreguntaMutation.mutate(deletePreguntaId);
                  setDeletePreguntaId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
