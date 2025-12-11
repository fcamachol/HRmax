import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, MoreVertical, Building } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { Departamento, Empresa } from "@shared/schema";
import DepartamentoForm from "@/components/DepartamentoForm";

export default function Departamentos() {
  const [search, setSearch] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState<Departamento | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingDepartamento, setDeletingDepartamento] = useState<Departamento | null>(null);
  const { toast } = useToast();

  const { data: departamentos = [], isLoading } = useQuery<Departamento[]>({
    queryKey: ["/api/departamentos"],
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const deleteDepartamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/departamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departamentos"] });
      setDeletingDepartamento(null);
      toast({
        title: "Departamento eliminado",
        description: "El departamento ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el departamento",
        variant: "destructive",
      });
    },
  });

  const handleDepartamentoCreated = () => {
    setIsFormOpen(false);
    setSelectedDepartamento(null);
    queryClient.invalidateQueries({ queryKey: ["/api/departamentos"] });
  };

  const getEmpresaNombre = (empresaId: string) => {
    const empresa = empresas.find((e) => e.id === empresaId);
    return empresa?.nombreComercial || empresa?.razonSocial || "Sin empresa";
  };

  const filteredDepartamentos = departamentos.filter((dept) =>
    search === ""
      ? true
      : dept.nombre.toLowerCase().includes(search.toLowerCase()) ||
        dept.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
        getEmpresaNombre(dept.empresaId).toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (departamento: Departamento) => {
    setSelectedDepartamento(departamento);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedDepartamento(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los departamentos de tu organización
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, descripción o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Button onClick={handleCreate} data-testid="button-nuevo-departamento">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Departamento
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando departamentos...</p>
        </div>
      ) : filteredDepartamentos.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search
              ? "No se encontraron departamentos con ese criterio"
              : "No hay departamentos registrados"}
          </p>
          {!search && (
            <Button onClick={handleCreate} className="mt-4" data-testid="button-crear-primero">
              <Plus className="h-4 w-4 mr-2" />
              Crear Departamento
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartamentos.map((departamento) => (
                <TableRow key={departamento.id} data-testid={`row-departamento-${departamento.id}`}>
                  <TableCell className="font-medium">
                    {departamento.nombre}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {departamento.descripcion || "-"}
                  </TableCell>
                  <TableCell>
                    {getEmpresaNombre(departamento.empresaId)}
                  </TableCell>
                  <TableCell>
                    {departamento.responsable || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={departamento.estatus === "activo" ? "default" : "secondary"}
                    >
                      {departamento.estatus === "activo" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-actions-${departamento.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleEdit(departamento)}
                          data-testid={`button-edit-${departamento.id}`}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingDepartamento(departamento)}
                          data-testid={`button-delete-${departamento.id}`}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDepartamento ? "Editar Departamento" : "Nuevo Departamento"}
            </DialogTitle>
            <DialogDescription>
              {selectedDepartamento
                ? "Actualiza la información del departamento"
                : "Registra un nuevo departamento"}
            </DialogDescription>
          </DialogHeader>
          <DepartamentoForm
            departamento={selectedDepartamento || undefined}
            onSuccess={handleDepartamentoCreated}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDepartamento} onOpenChange={(open) => !open && setDeletingDepartamento(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar departamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El departamento "{deletingDepartamento?.nombre}"
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDepartamento && deleteDepartamentoMutation.mutate(deletingDepartamento.id)}
              data-testid="button-confirmar-eliminar"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
