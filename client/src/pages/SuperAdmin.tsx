import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Shield, Trash2, X } from "lucide-react";

type User = {
  id: string;
  username: string;
  nombre: string | null;
  email: string | null;
  tipoUsuario: string;
  clienteId: string | null;
  activo: boolean;
};

type Modulo = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

type Cliente = {
  id: string;
  nombreComercial: string;
  razonSocial: string;
};

type Empresa = {
  id: string;
  razonSocial: string;
  clienteId: string;
};

type CentroTrabajo = {
  id: string;
  nombre: string;
  empresaId: string;
};

type UsuarioPermiso = {
  id: string;
  userId: string;
  moduloId: string;
  scope: string | null;
  scopeId: string | null;
  modulo?: { nombre: string; codigo: string };
};

export default function SuperAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: modulos = [] } = useQuery<Modulo[]>({
    queryKey: ["/api/modulos"],
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
      });
      setDeleteUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.nombre?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleOpenPermissions = (user: User) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  const getClienteName = (clienteId: string | null) => {
    if (!clienteId) return "N/A";
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nombreComercial || "N/A";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de usuarios y asignación de permisos del sistema
          </p>
        </div>
        <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-crear-usuario">
              <UserPlus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Usuario</DialogTitle>
              <DialogDescription>
                Crea un nuevo usuario en el sistema
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm onSuccess={() => setCreateUserDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuarios del Sistema</CardTitle>
            <div className="flex items-center gap-2 w-80">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.nombre || "—"}</TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.tipoUsuario === "maxtalent" ? "default" : "secondary"}>
                        {user.tipoUsuario === "maxtalent" ? "MaxTalent" : "Cliente"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getClienteName(user.clienteId)}</TableCell>
                    <TableCell>
                      <Badge variant={user.activo ? "default" : "secondary"}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPermissions(user)}
                          data-testid={`button-permisos-${user.id}`}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Permisos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteUserId(user.id)}
                          data-testid={`button-eliminar-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserPermissionsDialog
          user={selectedUser}
          modulos={modulos}
          clientes={clientes}
          open={permissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
        />
      )}

      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el usuario y todos sus permisos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
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

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<"maxtalent" | "cliente">("cliente");
  const [clienteId, setClienteId] = useState("");
  const { toast } = useToast();

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      username,
      password,
      nombre: nombre || null,
      email: email || null,
      tipoUsuario,
      clienteId: tipoUsuario === "cliente" && clienteId ? clienteId : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Usuario *</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          data-testid="input-username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="input-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre Completo</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          data-testid="input-nombre"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="input-email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tipoUsuario">Tipo de Usuario *</Label>
        <Select value={tipoUsuario} onValueChange={(v) => setTipoUsuario(v as any)}>
          <SelectTrigger data-testid="select-tipo-usuario">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="maxtalent">MaxTalent (Interno)</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {tipoUsuario === "cliente" && (
        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente *</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger data-testid="select-cliente">
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombreComercial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <DialogFooter>
        <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-user">
          {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function UserPermissionsDialog({
  user,
  modulos,
  clientes,
  open,
  onOpenChange,
}: {
  user: User;
  modulos: Modulo[];
  clientes: Cliente[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedModulo, setSelectedModulo] = useState("");
  const [selectedScope, setSelectedScope] = useState<string>("");
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const { toast } = useToast();

  const { data: userPermissions = [], isLoading } = useQuery<UsuarioPermiso[]>({
    queryKey: ["/api/usuarios-permisos", user.id],
    enabled: open,
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
    enabled: selectedScope === "empresa",
  });

  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
    enabled: selectedScope === "centro_trabajo",
  });

  const createPermissionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/usuarios-permisos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios-permisos", user.id] });
      toast({
        title: "Permiso asignado",
        description: "El permiso ha sido asignado correctamente",
      });
      setSelectedModulo("");
      setSelectedScope("");
      setSelectedScopeId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el permiso",
        variant: "destructive",
      });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId: string) => 
      apiRequest("DELETE", `/api/usuarios-permisos/${permissionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios-permisos", user.id] });
      toast({
        title: "Permiso eliminado",
        description: "El permiso ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el permiso",
        variant: "destructive",
      });
    },
  });

  const handleAddPermission = () => {
    if (!selectedModulo) {
      toast({
        title: "Error",
        description: "Debes seleccionar un módulo",
        variant: "destructive",
      });
      return;
    }

    const modulo = modulos.find(m => m.id === selectedModulo);
    if (!modulo) return;

    createPermissionMutation.mutate({
      userId: user.id,
      moduloId: selectedModulo,
      scope: selectedScope || null,
      scopeId: selectedScopeId || null,
    });
  };

  const getScopeLabel = (permission: UsuarioPermiso) => {
    if (!permission.scope) return "Global";
    if (permission.scope === "cliente") {
      const cliente = clientes.find(c => c.id === permission.scopeId);
      return `Cliente: ${cliente?.nombreComercial || "N/A"}`;
    }
    if (permission.scope === "empresa") {
      const empresa = empresas.find(e => e.id === permission.scopeId);
      return `Empresa: ${empresa?.razonSocial || "N/A"}`;
    }
    if (permission.scope === "centro_trabajo") {
      const centro = centrosTrabajo.find(ct => ct.id === permission.scopeId);
      return `Centro: ${centro?.nombre || "N/A"}`;
    }
    return permission.scope;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permisos de {user.username}</DialogTitle>
          <DialogDescription>
            Gestiona los permisos y alcances del usuario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asignar nuevo permiso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asignar Nuevo Permiso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Módulo</Label>
                  <Select value={selectedModulo} onValueChange={setSelectedModulo}>
                    <SelectTrigger data-testid="select-modulo">
                      <SelectValue placeholder="Selecciona un módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modulos.map((modulo) => (
                        <SelectItem key={modulo.id} value={modulo.id}>
                          {modulo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alcance</Label>
                  <Select value={selectedScope} onValueChange={(v) => {
                    setSelectedScope(v);
                    setSelectedScopeId("");
                  }}>
                    <SelectTrigger data-testid="select-scope">
                      <SelectValue placeholder="Selecciona alcance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Global (todos)</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="empresa">Empresa</SelectItem>
                      <SelectItem value="centro_trabajo">Centro de Trabajo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedScope === "cliente" && (
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={selectedScopeId} onValueChange={setSelectedScopeId}>
                    <SelectTrigger data-testid="select-scope-cliente">
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombreComercial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedScope === "empresa" && (
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select value={selectedScopeId} onValueChange={setSelectedScopeId}>
                    <SelectTrigger data-testid="select-scope-empresa">
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.razonSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedScope === "centro_trabajo" && (
                <div className="space-y-2">
                  <Label>Centro de Trabajo</Label>
                  <Select value={selectedScopeId} onValueChange={setSelectedScopeId}>
                    <SelectTrigger data-testid="select-scope-centro">
                      <SelectValue placeholder="Selecciona un centro" />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosTrabajo.map((centro) => (
                        <SelectItem key={centro.id} value={centro.id}>
                          {centro.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleAddPermission}
                disabled={createPermissionMutation.isPending}
                data-testid="button-asignar-permiso"
              >
                {createPermissionMutation.isPending ? "Asignando..." : "Asignar Permiso"}
              </Button>
            </CardContent>
          </Card>

          {/* Permisos actuales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permisos Actuales</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Cargando permisos...</p>
              ) : userPermissions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay permisos asignados</p>
              ) : (
                <div className="space-y-2">
                  {userPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`permission-${permission.id}`}
                    >
                      <div>
                        <p className="font-medium">{permission.modulo?.nombre || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {getScopeLabel(permission)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePermissionMutation.mutate(permission.id)}
                        data-testid={`button-eliminar-permiso-${permission.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
