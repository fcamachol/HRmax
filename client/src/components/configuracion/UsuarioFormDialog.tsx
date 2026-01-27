import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { PublicUser, CentroTrabajo } from "@shared/schema";
import { X } from "lucide-react";

// Schema for creating a new user
const createUsuarioSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  role: z.enum(["user", "cliente_admin", "cliente_master", "supervisor"]),
  activo: z.boolean(),
});

// Schema for updating a user (password is optional)
const updateUsuarioSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
  nombre: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  role: z.enum(["user", "cliente_admin", "cliente_master", "supervisor"]),
  activo: z.boolean(),
});

type CreateUsuarioForm = z.infer<typeof createUsuarioSchema>;
type UpdateUsuarioForm = z.infer<typeof updateUsuarioSchema>;

interface UsuarioFormDialogProps {
  open: boolean;
  onClose: () => void;
  usuario?: PublicUser;
}

export function UsuarioFormDialog({ open, onClose, usuario }: UsuarioFormDialogProps) {
  const isEditing = !!usuario;
  const { user: currentUser } = useAuth();
  const isMaster = currentUser?.role === 'cliente_master';
  const isAdmin = currentUser?.role === 'cliente_admin' || isMaster;

  // State for supervisor centro assignments
  const [selectedCentroIds, setSelectedCentroIds] = useState<string[]>([]);

  // Fetch all centros de trabajo for this client
  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
    enabled: open && isAdmin,
  });

  // Fetch existing centro assignments when editing a supervisor
  const { data: assignedCentros = [] } = useQuery<CentroTrabajo[]>({
    queryKey: [`/api/usuarios/${usuario?.id}/centros`],
    enabled: open && isEditing && usuario?.role === 'supervisor',
  });

  const getDefaultValues = (): CreateUsuarioForm | UpdateUsuarioForm => {
    if (usuario) {
      return {
        username: usuario.username,
        password: "",
        nombre: usuario.nombre || "",
        email: usuario.email || "",
        role: (usuario.role as "user" | "cliente_admin" | "cliente_master" | "supervisor") || "user",
        activo: usuario.activo ?? true,
      };
    }
    return {
      username: "",
      password: "",
      nombre: "",
      email: "",
      role: "user",
      activo: true,
    };
  };

  const form = useForm<CreateUsuarioForm | UpdateUsuarioForm>({
    resolver: zodResolver(isEditing ? updateUsuarioSchema : createUsuarioSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedRole = form.watch("role");

  // Effect 1: Reset form when dialog opens or usuario changes
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
      setSelectedCentroIds([]);
    }
  }, [open, usuario?.id]);

  // Effect 2: Load assigned centros when editing a supervisor (separate from form reset)
  useEffect(() => {
    if (open && isEditing && usuario?.role === 'supervisor' && assignedCentros.length > 0) {
      setSelectedCentroIds(assignedCentros.map(c => c.id));
    }
  }, [open, isEditing, usuario?.role, assignedCentros]);

  // Mutation to save supervisor centro assignments
  const saveCentrosMutation = useMutation({
    mutationFn: ({ userId, centroIds }: { userId: string; centroIds: string[] }) =>
      apiRequest("POST", `/api/usuarios/${userId}/centros`, { centroIds }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateUsuarioForm) => {
      const response = await apiRequest("POST", "/api/usuarios", data);
      const newUser = await response.json();
      // If supervisor role, also save centro assignments
      if (data.role === 'supervisor' && selectedCentroIds.length > 0 && newUser?.id) {
        await saveCentrosMutation.mutateAsync({ userId: newUser.id, centroIds: selectedCentroIds });
      }
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      onClose();
      form.reset();
      setSelectedCentroIds([]);
    },
    onError: (error) => {
      console.error("Error creating user:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUsuarioForm) => {
      // Only include fields that have values - don't send null
      const payload: Record<string, unknown> = {
        role: data.role,
        activo: data.activo,
      };
      // Only include optional fields if they have a value
      if (data.nombre) payload.nombre = data.nombre;
      if (data.email) payload.email = data.email;

      const result = await apiRequest("PATCH", `/api/usuarios/${usuario?.id}`, payload);
      // If supervisor role, also save centro assignments
      if (data.role === 'supervisor' && usuario?.id) {
        await saveCentrosMutation.mutateAsync({ userId: usuario.id, centroIds: selectedCentroIds });
      } else if (data.role !== 'supervisor' && usuario?.id) {
        // Clear centro assignments if role changed away from supervisor
        await saveCentrosMutation.mutateAsync({ userId: usuario.id, centroIds: [] });
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      if (usuario?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/usuarios/${usuario.id}/centros`] });
      }
      onClose();
      setSelectedCentroIds([]);
    },
  });

  const onSubmit = (data: CreateUsuarioForm | UpdateUsuarioForm) => {
    if (isEditing) {
      updateMutation.mutate(data as UpdateUsuarioForm);
    } else {
      createMutation.mutate(data as CreateUsuarioForm);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del usuario"
              : "Crea un nuevo usuario para tu cuenta"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {(error as Error).message || "Ocurrió un error"}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de Usuario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="usuario123"
                      {...field}
                      disabled={isEditing}
                      data-testid="input-username"
                    />
                  </FormControl>
                  <FormDescription>
                    Este será el nombre con el que el usuario iniciará sesión
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEditing ? "Dejar vacío para mantener actual" : "••••••"}
                      {...field}
                      data-testid="input-password"
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditing
                      ? "Solo completa si deseas cambiar la contraseña"
                      : "Mínimo 6 caracteres"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Juan Pérez"
                      {...field}
                      data-testid="input-nombre"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@empresa.com"
                      {...field}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      {isMaster && (
                        <SelectItem value="cliente_admin">Administrador</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 'supervisor'
                      ? "Los supervisores pueden gestionar incidencias de sus centros de trabajo asignados"
                      : "Los administradores pueden crear y gestionar otros usuarios"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Centro de Trabajo selector - only shown for supervisor role */}
            {watchedRole === 'supervisor' && (
              <FormItem>
                <FormLabel>Centros de Trabajo Asignados</FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (!selectedCentroIds.includes(value)) {
                      setSelectedCentroIds([...selectedCentroIds, value]);
                    }
                  }}
                  value=""
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-centro">
                      <SelectValue placeholder="Agregar centro de trabajo..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {centrosTrabajo
                      .filter(c => !selectedCentroIds.includes(c.id))
                      .map((centro) => (
                        <SelectItem key={centro.id} value={centro.id}>
                          {centro.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedCentroIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCentroIds.map((centroId) => {
                      const centro = centrosTrabajo.find(c => c.id === centroId);
                      return (
                        <Badge key={centroId} variant="secondary" className="gap-1">
                          {centro?.nombre || centroId}
                          <button
                            type="button"
                            onClick={() => setSelectedCentroIds(selectedCentroIds.filter(id => id !== centroId))}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <FormDescription>
                  Selecciona los centros de trabajo que este supervisor podrá gestionar
                </FormDescription>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-activo"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Usuario activo</FormLabel>
                    <FormDescription>
                      Los usuarios inactivos no podrán iniciar sesión
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
