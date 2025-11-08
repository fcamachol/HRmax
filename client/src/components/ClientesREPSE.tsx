import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
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
import type { ClienteREPSE } from "@shared/schema";
import ClienteREPSEForm from "@/components/ClienteREPSEForm";

export default function ClientesREPSE() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteREPSE | null>(null);
  const { toast } = useToast();

  const { data: clientes = [], isLoading } = useQuery<ClienteREPSE[]>({
    queryKey: ["/api/clientes-repse"],
  });

  const deleteClienteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/clientes-repse/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes-repse"] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    },
  });

  const handleClienteCreated = () => {
    setIsFormOpen(false);
    setEditingCliente(null);
    queryClient.invalidateQueries({ queryKey: ["/api/clientes-repse"] });
  };

  const handleEdit = (cliente: ClienteREPSE) => {
    setEditingCliente(cliente);
    setIsFormOpen(true);
  };

  const formatDireccion = (cliente: ClienteREPSE): string | null => {
    const parts = [
      cliente.calle,
      cliente.numeroExterior && `#${cliente.numeroExterior}`,
      cliente.colonia,
      cliente.municipio,
      cliente.estado,
      cliente.codigoPostal && `CP ${cliente.codigoPostal}`
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona los clientes para contratos REPSE
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCliente(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-cliente-repse">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingCliente 
                  ? "Modifica los datos del cliente" 
                  : "Agrega un nuevo cliente para contratos REPSE"}
              </DialogDescription>
            </DialogHeader>
            <ClienteREPSEForm 
              cliente={editingCliente}
              onSuccess={handleClienteCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      {clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No hay clientes registrados</p>
            <p className="text-muted-foreground text-sm">
              Agrega tu primer cliente para comenzar a gestionar contratos REPSE
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientes.map((cliente) => (
            <Card key={cliente.id} data-testid={`card-cliente-repse-${cliente.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {cliente.razonSocial}
                    </CardTitle>
                    {cliente.nombreComercial && (
                      <CardDescription className="mt-1">
                        {cliente.nombreComercial}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={cliente.estatus === "activo" ? "default" : "secondary"}>
                    {cliente.estatus === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RFC:</span>
                    <span className="font-medium">{cliente.rfc}</span>
                  </div>
                  {cliente.giro && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giro:</span>
                      <span className="font-medium">{cliente.giro}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="font-medium">{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{cliente.email}</span>
                    </div>
                  )}
                  {formatDireccion(cliente) && (
                    <div>
                      <span className="text-muted-foreground">Dirección:</span>
                      <p className="text-sm mt-1">{formatDireccion(cliente)}</p>
                    </div>
                  )}
                  {cliente.contactoPrincipal && (
                    <div>
                      <span className="text-muted-foreground">Contacto:</span>
                      <p className="text-sm mt-1">
                        {cliente.contactoPrincipal}
                        {cliente.puestoContacto && ` - ${cliente.puestoContacto}`}
                      </p>
                      {cliente.telefonoContacto && (
                        <p className="text-sm text-muted-foreground">
                          Tel: {cliente.telefonoContacto}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                    data-testid={`button-edit-cliente-${cliente.id}`}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-delete-cliente-${cliente.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará el cliente y todos los contratos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteClienteMutation.mutate(cliente.id)}
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
