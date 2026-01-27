import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Search,
  MoreVertical,
  GraduationCap,
  ClipboardCheck,
  Clock,
  Users,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCliente } from "@/contexts/ClienteContext";
import { CursoFormDialog } from "@/components/cursos/CursoFormDialog";
import { EvaluacionFormDialog } from "@/components/cursos/EvaluacionFormDialog";
import type { Curso, CategoriaCurso } from "@shared/schema";

export default function Cursos() {
  const { clienteId } = useCliente();
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [estatusFilter, setEstatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEvaluacionFormOpen, setIsEvaluacionFormOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [editingEvaluacion, setEditingEvaluacion] = useState<Curso | null>(null);
  const { toast } = useToast();

  const { data: cursos = [], isLoading } = useQuery<Curso[]>({
    queryKey: ["/api/cursos", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/cursos?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar cursos");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const { data: categorias = [] } = useQuery<CategoriaCurso[]>({
    queryKey: ["/api/categorias-cursos", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/categorias-cursos?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar categorías");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const { data: asignaciones = [] } = useQuery<any[]>({
    queryKey: ["/api/asignaciones-cursos", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/asignaciones-cursos?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar asignaciones");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cursos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cursos"] });
      toast({ title: "Curso eliminado", description: "El curso ha sido eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const publicarMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiRequest("POST", `/api/cursos/${id}/publicar`)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cursos"] });
      toast({ title: "Curso publicado", description: "El curso ahora está disponible para asignar" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const archivarMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiRequest("POST", `/api/cursos/${id}/archivar`)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cursos"] });
      toast({ title: "Curso archivado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredCursos = cursos.filter((curso) => {
    const matchesSearch = search === "" ||
      curso.nombre.toLowerCase().includes(search.toLowerCase()) ||
      curso.codigo.toLowerCase().includes(search.toLowerCase());
    const matchesCategoria = categoriaFilter === "all" || curso.categoriaId === categoriaFilter;
    const matchesEstatus = estatusFilter === "all" || curso.estatus === estatusFilter;
    return matchesSearch && matchesCategoria && matchesEstatus;
  });

  const getCategoriaNombre = (categoriaId: string | null) => {
    if (!categoriaId) return "Sin categoría";
    return categorias.find(c => c.id === categoriaId)?.nombre || "Sin categoría";
  };

  const getCategoriaColor = (categoriaId: string | null) => {
    if (!categoriaId) return "#6b7280";
    return categorias.find(c => c.id === categoriaId)?.color || "#6b7280";
  };

  const getAsignacionesCount = (cursoId: string) => {
    return asignaciones.filter(a => a.cursoId === cursoId).length;
  };

  const getCompletadosCount = (cursoId: string) => {
    return asignaciones.filter(a => a.cursoId === cursoId && a.estatus === 'completado').length;
  };

  const getEstatusVariant = (estatus: string | null) => {
    switch (estatus) {
      case 'publicado': return 'default';
      case 'borrador': return 'secondary';
      case 'archivado': return 'outline';
      default: return 'secondary';
    }
  };

  const getTipoCapacitacionLabel = (tipo: string | null) => {
    switch (tipo) {
      case 'obligatoria': return 'Obligatorio';
      case 'opcional': return 'Opcional';
      case 'induccion': return 'Inducción';
      case 'certificacion': return 'Certificación';
      default: return tipo;
    }
  };

  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCurso(null);
  };

  const cursosCountByEstatus = {
    all: cursos.length,
    borrador: cursos.filter(c => c.estatus === 'borrador').length,
    publicado: cursos.filter(c => c.estatus === 'publicado').length,
    archivado: cursos.filter(c => c.estatus === 'archivado').length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="h-8 w-8" />
          Cursos y Evaluaciones
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los cursos, capacitaciones y programas de desarrollo del personal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cursos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{cursosCountByEstatus.publicado}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asignaciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {asignaciones.filter(a => a.estatus !== 'completado').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {asignaciones.filter(a => a.estatus === 'completado').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estatusFilter} onValueChange={setEstatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({cursosCountByEstatus.all})</SelectItem>
            <SelectItem value="borrador">Borrador ({cursosCountByEstatus.borrador})</SelectItem>
            <SelectItem value="publicado">Publicado ({cursosCountByEstatus.publicado})</SelectItem>
            <SelectItem value="archivado">Archivado ({cursosCountByEstatus.archivado})</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Link href={`/${clienteId}/cursos-capacitaciones/categorias`}>
            <Button variant="outline">Categorías</Button>
          </Link>
          <Link href={`/${clienteId}/cursos-capacitaciones/asignaciones`}>
            <Button variant="outline">Asignaciones</Button>
          </Link>
          <Link href={`/${clienteId}/cursos-capacitaciones/reglas`}>
            <Button variant="outline">Reglas</Button>
          </Link>
          <Link href={`/${clienteId}/cursos-capacitaciones/reportes`}>
            <Button variant="outline">Reportes</Button>
          </Link>
          <Link href={`/${clienteId}/cursos-capacitaciones/certificados`}>
            <Button variant="outline">Certificados</Button>
          </Link>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </Button>
          <Button className="bg-sky-500 hover:bg-sky-600 text-white" onClick={() => setIsEvaluacionFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Evaluación
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando cursos...</p>
        </div>
      ) : filteredCursos.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {search || categoriaFilter !== "all" || estatusFilter !== "all"
              ? "No se encontraron cursos con esos filtros"
              : "No hay cursos registrados"}
          </p>
          {!search && categoriaFilter === "all" && estatusFilter === "all" && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer curso
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCursos.map((curso) => (
            <Card key={curso.id} className="flex flex-col overflow-hidden">
              {curso.imagenUrl && (
                <div className="relative w-full h-36 bg-muted">
                  <img
                    src={curso.imagenUrl}
                    alt={curso.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className={curso.imagenUrl ? "pb-3 pt-4" : "pb-3"}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {(curso as any).tipo === 'evaluacion' ? (
                        <Badge className="text-xs bg-sky-500 hover:bg-sky-600">
                          <ClipboardCheck className="h-3 w-3 mr-1" />
                          Evaluación
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-violet-500 hover:bg-violet-600">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          Curso
                        </Badge>
                      )}
                      <Badge
                        variant={getEstatusVariant(curso.estatus)}
                        className="text-xs"
                      >
                        {curso.estatus === 'publicado' ? 'Publicado' :
                         curso.estatus === 'borrador' ? 'Borrador' : 'Archivado'}
                      </Badge>
                      {curso.tipoCapacitacion === 'obligatoria' && (
                        <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{curso.nombre}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Código: {curso.codigo}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/${clienteId}/cursos-capacitaciones/${curso.id}/preview`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${clienteId}/cursos-capacitaciones/${curso.id}/editar`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar contenido
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(curso)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar información
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {curso.estatus === 'borrador' && (
                        <DropdownMenuItem onClick={() => publicarMutation.mutate(curso.id)}>
                          <Send className="h-4 w-4 mr-2" />
                          Publicar
                        </DropdownMenuItem>
                      )}
                      {curso.estatus === 'publicado' && (
                        <DropdownMenuItem onClick={() => archivarMutation.mutate(curso.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archivar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(curso.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {curso.descripcion || "Sin descripción"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    style={{ borderColor: getCategoriaColor(curso.categoriaId) }}
                  >
                    {getCategoriaNombre(curso.categoriaId)}
                  </Badge>
                  {curso.dificultad && (
                    <Badge variant="outline">{curso.dificultad}</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {curso.duracionEstimadaMinutos
                      ? `${Math.round(curso.duracionEstimadaMinutos / 60)}h ${curso.duracionEstimadaMinutos % 60}m`
                      : "N/A"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {getAsignacionesCount(curso.id)} asignados
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {getCompletadosCount(curso.id)} completados
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CursoFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        curso={editingCurso}
        categorias={categorias}
      />

      <EvaluacionFormDialog
        open={isEvaluacionFormOpen}
        onOpenChange={(open) => {
          setIsEvaluacionFormOpen(open);
          if (!open) setEditingEvaluacion(null);
        }}
        evaluacion={editingEvaluacion}
        categorias={categorias}
      />
    </div>
  );
}
