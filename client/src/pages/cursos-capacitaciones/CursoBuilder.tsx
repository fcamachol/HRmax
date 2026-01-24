import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  MoreVertical,
  Edit,
  Trash2,
  Video,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  Upload,
  ChevronDown,
  ChevronRight,
  Eye,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Curso, ModuloCurso, LeccionCurso } from "@shared/schema";

interface ModuloConLecciones extends ModuloCurso {
  lecciones: LeccionCurso[];
}

interface CursoCompleto {
  curso: Curso;
  modulos: ModuloConLecciones[];
  quizzes: any[];
}

export default function CursoBuilder() {
  const params = useParams<{ id: string }>();
  const cursoId = params.id;
  const { toast } = useToast();

  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  const [isModuloDialogOpen, setIsModuloDialogOpen] = useState(false);
  const [isLeccionDialogOpen, setIsLeccionDialogOpen] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloCurso | null>(null);
  const [editingLeccion, setEditingLeccion] = useState<LeccionCurso | null>(null);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);

  // Form state
  const [moduloForm, setModuloForm] = useState({ nombre: "", descripcion: "", duracionEstimadaMinutos: 0 });
  const [leccionForm, setLeccionForm] = useState({
    nombre: "",
    descripcion: "",
    tipoContenido: "texto" as string,
    duracionEstimadaMinutos: 0,
    videoUrl: "",
    contenido: "",
    archivoUrl: "",
    archivoNombre: "",
  });

  const { data: cursoCompleto, isLoading } = useQuery<CursoCompleto>({
    queryKey: [`/api/cursos/${cursoId}/completo`],
    enabled: !!cursoId,
  });

  const curso = cursoCompleto?.curso;
  const modulos = cursoCompleto?.modulos || [];

  // Mutations
  const createModuloMutation = useMutation({
    mutationFn: async (data: any) => {
      const orden = modulos.length + 1;
      const response = await apiRequest("POST", `/api/cursos/${cursoId}/modulos`, { ...data, orden });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/completo`] });
      setIsModuloDialogOpen(false);
      resetModuloForm();
      toast({ title: "Módulo creado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateModuloMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/cursos/${cursoId}/modulos/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/completo`] });
      setIsModuloDialogOpen(false);
      setEditingModulo(null);
      resetModuloForm();
      toast({ title: "Módulo actualizado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteModuloMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cursos/${cursoId}/modulos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/completo`] });
      toast({ title: "Módulo eliminado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createLeccionMutation = useMutation({
    mutationFn: async ({ moduloId, data }: { moduloId: string; data: any }) => {
      const modulo = modulos.find(m => m.id === moduloId);
      const orden = (modulo?.lecciones.length || 0) + 1;
      const response = await apiRequest("POST", `/api/modulos/${moduloId}/lecciones`, { ...data, orden });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/completo`] });
      setIsLeccionDialogOpen(false);
      setSelectedModuloId(null);
      resetLeccionForm();
      toast({ title: "Lección creada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateLeccionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/lecciones/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/completo`] });
      setIsLeccionDialogOpen(false);
      setEditingLeccion(null);
      resetLeccionForm();
      toast({ title: "Lección actualizada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteLeccionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lecciones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/completo`] });
      toast({ title: "Lección eliminada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const publicarMutation = useMutation({
    mutationFn: async () => {
      return (await apiRequest("POST", `/api/cursos/${cursoId}/publicar`)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/${cursoId}/completo`] });
      queryClient.invalidateQueries({ queryKey: ["/api/cursos"] });
      toast({ title: "Curso publicado", description: "El curso ahora está disponible para asignar" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetModuloForm = () => {
    setModuloForm({ nombre: "", descripcion: "", duracionEstimadaMinutos: 0 });
  };

  const resetLeccionForm = () => {
    setLeccionForm({
      nombre: "",
      descripcion: "",
      tipoContenido: "texto",
      duracionEstimadaMinutos: 0,
      videoUrl: "",
      contenido: "",
      archivoUrl: "",
      archivoNombre: "",
    });
  };

  const handleOpenModuloDialog = (modulo?: ModuloCurso) => {
    if (modulo) {
      setEditingModulo(modulo);
      setModuloForm({
        nombre: modulo.nombre,
        descripcion: modulo.descripcion || "",
        duracionEstimadaMinutos: modulo.duracionEstimadaMinutos || 0,
      });
    } else {
      setEditingModulo(null);
      resetModuloForm();
    }
    setIsModuloDialogOpen(true);
  };

  const handleOpenLeccionDialog = (moduloId: string, leccion?: LeccionCurso) => {
    setSelectedModuloId(moduloId);
    if (leccion) {
      setEditingLeccion(leccion);
      setLeccionForm({
        nombre: leccion.nombre,
        descripcion: leccion.descripcion || "",
        tipoContenido: leccion.tipoContenido,
        duracionEstimadaMinutos: leccion.duracionEstimadaMinutos || 0,
        videoUrl: leccion.videoUrl || "",
        contenido: (leccion.contenido as any)?.texto || "",
        archivoUrl: leccion.archivoUrl || "",
        archivoNombre: leccion.archivoNombre || "",
      });
    } else {
      setEditingLeccion(null);
      resetLeccionForm();
    }
    setIsLeccionDialogOpen(true);
  };

  const handleSaveModulo = () => {
    if (editingModulo) {
      updateModuloMutation.mutate({ id: editingModulo.id, data: moduloForm });
    } else {
      createModuloMutation.mutate(moduloForm);
    }
  };

  const handleSaveLeccion = () => {
    const data = {
      nombre: leccionForm.nombre,
      descripcion: leccionForm.descripcion,
      tipoContenido: leccionForm.tipoContenido,
      duracionEstimadaMinutos: leccionForm.duracionEstimadaMinutos || null,
      videoUrl: leccionForm.tipoContenido === "video" ? leccionForm.videoUrl : null,
      contenido: leccionForm.tipoContenido === "texto" ? { texto: leccionForm.contenido } : null,
      archivoUrl: leccionForm.tipoContenido === "documento" ? leccionForm.archivoUrl : null,
      archivoNombre: leccionForm.tipoContenido === "documento" ? leccionForm.archivoNombre : null,
    };

    if (editingLeccion) {
      updateLeccionMutation.mutate({ id: editingLeccion.id, data });
    } else if (selectedModuloId) {
      createLeccionMutation.mutate({ moduloId: selectedModuloId, data });
    }
  };

  const toggleModulo = (moduloId: string) => {
    const newExpanded = new Set(expandedModulos);
    if (newExpanded.has(moduloId)) {
      newExpanded.delete(moduloId);
    } else {
      newExpanded.add(moduloId);
    }
    setExpandedModulos(newExpanded);
  };

  const getTipoContenidoIcon = (tipo: string) => {
    switch (tipo) {
      case "video": return <Video className="h-4 w-4" />;
      case "texto": return <FileText className="h-4 w-4" />;
      case "documento": return <Upload className="h-4 w-4" />;
      case "link": return <LinkIcon className="h-4 w-4" />;
      case "quiz": return <HelpCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTotalLecciones = () => {
    return modulos.reduce((acc, m) => acc + m.lecciones.length, 0);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Curso no encontrado</p>
          <Link href="/cursos-capacitaciones">
            <Button variant="link">Volver a cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/cursos-capacitaciones">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{curso.nombre}</h1>
            <Badge variant={curso.estatus === "publicado" ? "default" : "secondary"}>
              {curso.estatus === "publicado" ? "Publicado" : "Borrador"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {modulos.length} módulos · {getTotalLecciones()} lecciones
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/cursos-capacitaciones/${cursoId}/preview`}>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </Button>
          </Link>
          {curso.estatus === "borrador" && (
            <Button onClick={() => publicarMutation.mutate()} disabled={publicarMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          )}
        </div>
      </div>

      {/* Course Content Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Modules and Lessons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contenido del Curso</h2>
            <Button onClick={() => handleOpenModuloDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Módulo
            </Button>
          </div>

          {modulos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Este curso no tiene módulos todavía
                </p>
                <Button onClick={() => handleOpenModuloDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer módulo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {modulos.map((modulo, index) => (
                <Card key={modulo.id}>
                  <Collapsible
                    open={expandedModulos.has(modulo.id)}
                    onOpenChange={() => toggleModulo(modulo.id)}
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-auto">
                            {expandedModulos.has(modulo.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            Módulo {index + 1}: {modulo.nombre}
                          </CardTitle>
                          {modulo.descripcion && (
                            <CardDescription className="text-xs mt-1">
                              {modulo.descripcion}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {modulo.lecciones.length} lecciones
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModuloDialog(modulo)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar módulo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenLeccionDialog(modulo.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar lección
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteModuloMutation.mutate(modulo.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar módulo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {modulo.lecciones.length === 0 ? (
                          <div className="text-center py-4 border rounded-lg border-dashed">
                            <p className="text-sm text-muted-foreground mb-2">
                              Sin lecciones
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenLeccionDialog(modulo.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar lección
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {modulo.lecciones.map((leccion, leccionIndex) => (
                              <div
                                key={leccion.id}
                                className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                <div className="flex items-center gap-2 flex-1">
                                  {getTipoContenidoIcon(leccion.tipoContenido)}
                                  <span className="text-sm">
                                    {index + 1}.{leccionIndex + 1} {leccion.nombre}
                                  </span>
                                </div>
                                {leccion.duracionEstimadaMinutos && (
                                  <span className="text-xs text-muted-foreground">
                                    {leccion.duracionEstimadaMinutos} min
                                  </span>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenLeccionDialog(modulo.id, leccion)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => deleteLeccionMutation.mutate(leccion.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleOpenLeccionDialog(modulo.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar lección
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Course Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Código:</span>{" "}
                <span className="font-medium">{curso.codigo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>{" "}
                <Badge variant="outline" className="ml-1">
                  {curso.tipoCapacitacion}
                </Badge>
              </div>
              {curso.dificultad && (
                <div>
                  <span className="text-muted-foreground">Dificultad:</span>{" "}
                  <span className="font-medium capitalize">{curso.dificultad}</span>
                </div>
              )}
              {curso.duracionEstimadaMinutos && (
                <div>
                  <span className="text-muted-foreground">Duración:</span>{" "}
                  <span className="font-medium">
                    {Math.floor(curso.duracionEstimadaMinutos / 60)}h{" "}
                    {curso.duracionEstimadaMinutos % 60}m
                  </span>
                </div>
              )}
              {curso.tipoEvaluacion && curso.tipoEvaluacion !== "none" && (
                <div>
                  <span className="text-muted-foreground">Evaluación:</span>{" "}
                  <Badge variant="outline" className="ml-1">
                    {curso.tipoEvaluacion === "quiz" ? "Quiz" :
                     curso.tipoEvaluacion === "assessment" ? "Evaluación" :
                     "Examen de certificación"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progreso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Módulos</span>
                <span className="font-medium">{modulos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lecciones</span>
                <span className="font-medium">{getTotalLecciones()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Module Dialog */}
      <Dialog open={isModuloDialogOpen} onOpenChange={setIsModuloDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModulo ? "Editar Módulo" : "Nuevo Módulo"}</DialogTitle>
            <DialogDescription>
              Los módulos organizan las lecciones del curso en secciones temáticas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre del Módulo *</label>
              <Input
                placeholder="Ej: Introducción"
                value={moduloForm.nombre}
                onChange={(e) => setModuloForm({ ...moduloForm, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                placeholder="Describe el contenido del módulo..."
                value={moduloForm.descripcion}
                onChange={(e) => setModuloForm({ ...moduloForm, descripcion: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duración Estimada (minutos)</label>
              <Input
                type="number"
                placeholder="30"
                value={moduloForm.duracionEstimadaMinutos || ""}
                onChange={(e) => setModuloForm({ ...moduloForm, duracionEstimadaMinutos: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuloDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveModulo}
              disabled={!moduloForm.nombre || createModuloMutation.isPending || updateModuloMutation.isPending}
            >
              {createModuloMutation.isPending || updateModuloMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLeccionDialogOpen} onOpenChange={setIsLeccionDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingLeccion ? "Editar Lección" : "Nueva Lección"}</DialogTitle>
            <DialogDescription>
              Agrega contenido educativo al módulo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre de la Lección *</label>
              <Input
                placeholder="Ej: ¿Qué es la empresa?"
                value={leccionForm.nombre}
                onChange={(e) => setLeccionForm({ ...leccionForm, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                placeholder="Breve descripción de la lección..."
                value={leccionForm.descripcion}
                onChange={(e) => setLeccionForm({ ...leccionForm, descripcion: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo de Contenido *</label>
                <Select
                  value={leccionForm.tipoContenido}
                  onValueChange={(v) => setLeccionForm({ ...leccionForm, tipoContenido: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="link">Enlace externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Duración (minutos)</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={leccionForm.duracionEstimadaMinutos || ""}
                  onChange={(e) => setLeccionForm({ ...leccionForm, duracionEstimadaMinutos: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Content type specific fields */}
            {leccionForm.tipoContenido === "texto" && (
              <div>
                <label className="text-sm font-medium">Contenido</label>
                <Textarea
                  placeholder="Escribe el contenido de la lección..."
                  value={leccionForm.contenido}
                  onChange={(e) => setLeccionForm({ ...leccionForm, contenido: e.target.value })}
                  rows={6}
                />
              </div>
            )}

            {leccionForm.tipoContenido === "video" && (
              <div>
                <label className="text-sm font-medium">URL del Video (YouTube/Vimeo)</label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={leccionForm.videoUrl}
                  onChange={(e) => setLeccionForm({ ...leccionForm, videoUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Soporta enlaces de YouTube y Vimeo
                </p>
              </div>
            )}

            {leccionForm.tipoContenido === "documento" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">URL del Documento</label>
                <Input
                  placeholder="https://..."
                  value={leccionForm.archivoUrl}
                  onChange={(e) => setLeccionForm({ ...leccionForm, archivoUrl: e.target.value })}
                />
                <label className="text-sm font-medium">Nombre del archivo</label>
                <Input
                  placeholder="documento.pdf"
                  value={leccionForm.archivoNombre}
                  onChange={(e) => setLeccionForm({ ...leccionForm, archivoNombre: e.target.value })}
                />
              </div>
            )}

            {leccionForm.tipoContenido === "link" && (
              <div>
                <label className="text-sm font-medium">Enlace Externo</label>
                <Input
                  placeholder="https://..."
                  value={leccionForm.videoUrl}
                  onChange={(e) => setLeccionForm({ ...leccionForm, videoUrl: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeccionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveLeccion}
              disabled={!leccionForm.nombre || createLeccionMutation.isPending || updateLeccionMutation.isPending}
            >
              {createLeccionMutation.isPending || updateLeccionMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
