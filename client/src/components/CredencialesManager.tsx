import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Key, Shield, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CredencialSistema, InsertCredencialSistema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCredencialSistemaSchema, tiposSistema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CredencialesManagerProps {
  empresaId: string;
}

const tiposSistemaLabels: Record<string, string> = {
  imss_escritorio_virtual: "IMSS Escritorio Virtual",
  sipare: "SIPARE",
  infonavit_portal_empresarial: "Infonavit Portal Empresarial",
  fonacot: "Fonacot",
  idse: "IDSE (IMSS)",
  sua: "SUA (Sistema Único de Autodeterminación)",
  otro: "Otro",
};

export default function CredencialesManager({ empresaId }: CredencialesManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCredencial, setEditingCredencial] = useState<CredencialSistema | null>(null);
  const { toast } = useToast();

  const { data: credenciales = [], isLoading } = useQuery<CredencialSistema[]>({
    queryKey: ["/api/credenciales", empresaId],
    queryFn: async () => {
      const response = await fetch(`/api/credenciales?empresaId=${empresaId}`);
      if (!response.ok) throw new Error("Error al cargar credenciales");
      return response.json();
    },
  });

  const deleteCredencialMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/credenciales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credenciales", empresaId] });
      toast({
        title: "Credencial eliminada",
        description: "La credencial ha sido eliminada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la credencial",
        variant: "destructive",
      });
    },
  });

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCredencial(null);
  };

  const handleSuccess = () => {
    handleFormClose();
    queryClient.invalidateQueries({ queryKey: ["/api/credenciales", empresaId] });
  };

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Cargando credenciales...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Gestiona las credenciales de acceso a sistemas gubernamentales
        </p>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-nueva-credencial">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Credencial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCredencial ? "Editar Credencial" : "Nueva Credencial"}
              </DialogTitle>
              <DialogDescription>
                Configura el acceso a un sistema gubernamental
              </DialogDescription>
            </DialogHeader>
            <CredencialForm
              empresaId={empresaId}
              credencial={editingCredencial || undefined}
              onSuccess={handleSuccess}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {credenciales.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Key className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No hay credenciales configuradas
            </p>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primera Credencial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {credenciales.map((credencial) => (
            <Card key={credencial.id} className="hover-elevate" data-testid={`card-credencial-${credencial.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate flex items-center gap-2">
                      {credencial.nombreSistema}
                      {credencial.url && (
                        <a
                          href={credencial.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {tiposSistemaLabels[credencial.tipoSistema] || credencial.tipoSistema}
                    </CardDescription>
                  </div>
                  <Badge variant={credencial.estatus === 'activo' ? 'default' : credencial.estatus === 'vencido' ? 'destructive' : 'secondary'}>
                    {credencial.estatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm">
                  {credencial.usuario && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Usuario:</span>
                      <span className="font-mono text-sm">{credencial.usuario}</span>
                    </div>
                  )}
                  {credencial.passwordSecretKey && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">
                        Contraseña en Secret: <code className="text-xs bg-muted px-1 rounded">{credencial.passwordSecretKey}</code>
                      </span>
                    </div>
                  )}
                  {credencial.efirmaRfc && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">RFC e.firma:</span>
                      <span className="font-mono text-sm">{credencial.efirmaRfc}</span>
                    </div>
                  )}
                  {credencial.fechaVencimiento && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vencimiento:</span>
                      <span>{new Date(credencial.fechaVencimiento).toLocaleDateString('es-MX')}</span>
                    </div>
                  )}
                  {credencial.descripcion && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {credencial.descripcion}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCredencial(credencial);
                      setIsFormOpen(true);
                    }}
                    data-testid={`button-editar-credencial-${credencial.id}`}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-eliminar-credencial-${credencial.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar credencial?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente la credencial "{credencial.nombreSistema}".
                          No eliminará el Secret de Replit.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCredencialMutation.mutate(credencial.id!)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface CredencialFormProps {
  empresaId: string;
  credencial?: CredencialSistema;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function CredencialForm({ empresaId, credencial, onSuccess, onCancel }: CredencialFormProps) {
  const { toast } = useToast();
  const isEditing = !!credencial;

  const form = useForm<InsertCredencialSistema>({
    resolver: zodResolver(insertCredencialSistemaSchema),
    defaultValues: credencial || {
      empresaId,
      tipoSistema: "imss_escritorio_virtual",
      nombreSistema: "",
      usuario: "",
      passwordSecretKey: "",
      efirmaRfc: "",
      efirmaCertPath: "",
      efirmaKeyPath: "",
      efirmaPasswordSecretKey: "",
      url: "",
      descripcion: "",
      notasSeguridad: "",
      estatus: "activo",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertCredencialSistema) => {
      const endpoint = isEditing ? `/api/credenciales/${credencial.id}` : "/api/credenciales";
      const method = isEditing ? "PATCH" : "POST";
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Credencial actualizada" : "Credencial creada",
        description: isEditing
          ? "La credencial ha sido actualizada correctamente"
          : "La credencial ha sido creada correctamente. No olvides crear el Secret en Replit.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la credencial",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCredencialSistema) => {
    saveMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tipoSistema"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Sistema *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-tipo-sistema">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tiposSistema.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tiposSistemaLabels[tipo] || tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nombreSistema"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Descriptivo *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ej: IMSS Escritorio Virtual - Empresa ABC" data-testid="input-nombre-sistema" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Alert className="border-blue-500/50 bg-blue-500/10">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100 text-sm">
            Contraseñas seguras con Replit Secrets
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs space-y-1">
            <p>
              1. Especifica un nombre de Secret (ej: <code className="bg-muted px-1 rounded">EMPRESA_ABC_IMSS_PASSWORD</code>)
            </p>
            <p>
              2. Ve a la pestaña "Secrets" en Replit y crea el Secret con ese nombre exacto
            </p>
            <p>
              3. El valor del Secret será la contraseña real (nunca se almacena en la base de datos)
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
          <h4 className="text-sm font-medium">Credenciales de Acceso</h4>
          
          <FormField
            control={form.control}
            name="usuario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario / RFC</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Usuario o RFC para acceder al sistema" data-testid="input-usuario" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordSecretKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Secret (Contraseña)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="EMPRESA_ABC_IMSS_PASSWORD"
                    className="font-mono uppercase"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                    data-testid="input-password-secret-key"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Nombre del Secret en Replit que contiene la contraseña
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL del Sistema</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="url" placeholder="https://..." data-testid="input-url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
          <h4 className="text-sm font-medium">e.firma (FIEL) - Opcional</h4>
          <p className="text-xs text-muted-foreground">
            Para sistemas que requieren Firma Electrónica (IMSS, SAT, etc.)
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="efirmaRfc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFC de la e.firma</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      maxLength={13}
                      className="font-mono uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      data-testid="input-efirma-rfc"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="efirmaPasswordSecretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret (Contraseña e.firma)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="EMPRESA_ABC_EFIRMA_PASSWORD"
                      className="font-mono uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                      data-testid="input-efirma-password-secret-key"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="efirmaCertPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruta archivo .cer</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Ruta al certificado .cer" data-testid="input-efirma-cert-path" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Ruta en object storage del archivo .cer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="efirmaKeyPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruta archivo .key</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Ruta a la clave privada .key" data-testid="input-efirma-key-path" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Ruta en object storage del archivo .key
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="estatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estatus</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "activo"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  rows={2}
                  placeholder="Información adicional sobre esta credencial..."
                  data-testid="input-descripcion"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notasSeguridad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas de Seguridad</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  rows={2}
                  placeholder="Notas importantes sobre seguridad..."
                  data-testid="input-notas-seguridad"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending
              ? isEditing
                ? "Actualizando..."
                : "Creando..."
              : isEditing
              ? "Actualizar"
              : "Crear Credencial"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
