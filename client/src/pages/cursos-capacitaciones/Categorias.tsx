import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Tag,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCliente } from "@/contexts/ClienteContext";
import { CategoriaCursoFormDialog } from "@/components/cursos/CategoriaCursoFormDialog";
import type { CategoriaCurso } from "@shared/schema";

export default function Categorias() {
  const { clienteId } = useCliente();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaCurso | null>(null);
  const [deletingCategoria, setDeletingCategoria] = useState<CategoriaCurso | null>(null);
  const { toast } = useToast();

  const { data: categorias = [], isLoading } = useQuery<CategoriaCurso[]>({
    queryKey: ["/api/categorias-cursos", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/categorias-cursos?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar categorías");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categorias-cursos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-cursos"] });
      setDeletingCategoria(null);
      toast({ title: "Categoría eliminada", description: "La categoría ha sido eliminada exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredCategorias = categorias
    .filter((cat) => {
      if (!search) return true;
      return (
        cat.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (cat.descripcion?.toLowerCase() || "").includes(search.toLowerCase())
      );
    })
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const handleEdit = (categoria: CategoriaCurso) => {
    setEditingCategoria(categoria);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCategoria(null);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href={`/${clienteId}/cursos-capacitaciones`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Cursos
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Tag className="h-8 w-8" />
          Categorías de Cursos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las categorías para organizar tus cursos y capacitaciones
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="ml-auto">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando categorías...</p>
        </div>
      ) : filteredCategorias.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {search
              ? "No se encontraron categorías con ese nombre"
              : "No hay categorías registradas"}
          </p>
          {!search && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera categoría
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Orden</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[100px]">Color</TableHead>
                <TableHead className="w-[100px]">Estado</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      {categoria.orden || 0}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{categoria.nombre}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {categoria.descripcion || "-"}
                  </TableCell>
                  <TableCell>
                    {categoria.color ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: categoria.color }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {categoria.color}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={categoria.activo ? "default" : "secondary"}>
                      {categoria.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(categoria)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingCategoria(categoria)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Dialog */}
      <CategoriaCursoFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        categoria={editingCategoria}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCategoria} onOpenChange={() => setDeletingCategoria(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría "{deletingCategoria?.nombre}".
              Los cursos asignados a esta categoría quedarán sin categoría.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategoria && deleteMutation.mutate(deletingCategoria.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
