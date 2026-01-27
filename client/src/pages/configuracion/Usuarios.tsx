import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Shield, User, Eye } from "lucide-react";
import { UsuarioFormDialog } from "@/components/configuracion/UsuarioFormDialog";
import type { PublicUser } from "@shared/schema";

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<PublicUser | undefined>();

  const { data: usuarios = [], isLoading } = useQuery<PublicUser[]>({
    queryKey: ["/api/usuarios"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/usuarios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
    },
  });

  const filteredUsuarios = usuarios.filter((usuario) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      usuario.username?.toLowerCase().includes(searchLower) ||
      usuario.nombre?.toLowerCase().includes(searchLower) ||
      usuario.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (usuario: PublicUser) => {
    setSelectedUsuario(usuario);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedUsuario(undefined);
  };

  const getRoleBadge = (role: string | null | undefined) => {
    if (role === "cliente_master") {
      return (
        <Badge variant="destructive" className="gap-1">
          <Shield className="h-3 w-3" />
          Admin Principal
        </Badge>
      );
    }
    if (role === "cliente_admin") {
      return (
        <Badge variant="default" className="gap-1">
          <Shield className="h-3 w-3" />
          Administrador
        </Badge>
      );
    }
    if (role === "supervisor") {
      return (
        <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600">
          <Eye className="h-3 w-3" />
          Supervisor
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <User className="h-3 w-3" />
        Usuario
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los usuarios de tu cuenta
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Usuarios</h2>
          <p className="text-muted-foreground text-sm">
            Crea, edita y administra los usuarios que tienen acceso al sistema
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          data-testid="button-nuevo-usuario"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre de usuario, nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-usuarios"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : filteredUsuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id} data-testid={`row-usuario-${usuario.id}`}>
                  <TableCell className="font-medium" data-testid={`text-username-${usuario.id}`}>
                    {usuario.username}
                  </TableCell>
                  <TableCell data-testid={`text-nombre-${usuario.id}`}>
                    {usuario.nombre || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`text-email-${usuario.id}`}>
                    {usuario.email || "-"}
                  </TableCell>
                  <TableCell data-testid={`badge-role-${usuario.id}`}>
                    {getRoleBadge(usuario.role)}
                  </TableCell>
                  <TableCell className="text-center" data-testid={`badge-estado-${usuario.id}`}>
                    {usuario.activo ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(usuario)}
                        data-testid={`button-edit-${usuario.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(usuario.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${usuario.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UsuarioFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        usuario={selectedUsuario}
      />
    </div>
  );
}
