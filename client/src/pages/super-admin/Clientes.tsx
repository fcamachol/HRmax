import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Cliente } from "@shared/schema";
import ClienteForm from "@/components/ClienteForm";

export default function Clientes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const { toast } = useToast();

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const deleteClienteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/clientes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente",
      });
      setDeletingCliente(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
        variant: "destructive",
      });
      setDeletingCliente(null);
    },
  });

  const handleClienteCreated = () => {
    setIsFormOpen(false);
    setEditingCliente(null);
    queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsFormOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingCliente(null);
    }
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
            Gestiona los clientes del sistema
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-cliente">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <ClienteForm
              cliente={editingCliente}
              onSuccess={handleClienteCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      {clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No hay clientes registrados
            </p>
            <Button 
              onClick={() => setIsFormOpen(true)}
              data-testid="button-crear-primer-cliente"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear primer cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="hover-elevate" data-testid={`card-cliente-${cliente.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1" data-testid={`text-nombre-${cliente.id}`}>
                      {cliente.nombreComercial}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {cliente.razonSocial}
                    </p>
                    <Badge 
                      variant={cliente.activo ? "default" : "secondary"}
                      data-testid={`badge-status-${cliente.id}`}
                    >
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground w-16">RFC:</span>
                    <span className="font-medium" data-testid={`text-rfc-${cliente.id}`}>
                      {cliente.rfc}
                    </span>
                  </div>
                  {cliente.email && (
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground w-16">Email:</span>
                      <span className="truncate" data-testid={`text-email-${cliente.id}`}>
                        {cliente.email}
                      </span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground w-16">Tel:</span>
                      <span data-testid={`text-telefono-${cliente.id}`}>
                        {cliente.telefono}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                    className="flex-1"
                    data-testid={`button-edit-${cliente.id}`}
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingCliente(cliente)}
                    data-testid={`button-delete-${cliente.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingCliente} onOpenChange={(open) => !open && setDeletingCliente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
              <strong> {deletingCliente?.nombreComercial}</strong>.
              {deletingCliente && (
                <div className="mt-2 text-destructive">
                  Nota: No podrás eliminar este cliente si tiene empresas asociadas.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCliente && deleteClienteMutation.mutate(deletingCliente.id)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
