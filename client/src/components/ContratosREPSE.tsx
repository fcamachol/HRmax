import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FileText, CheckCircle, XCircle } from "lucide-react";
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
import type { ContratoREPSE, Empresa, ClienteREPSE, RegistroREPSE } from "@shared/schema";
import ContratoREPSEForm from "@/components/ContratoREPSEForm";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ContratosREPSEProps {
  empresas: Empresa[];
}

export default function ContratosREPSE({ empresas }: ContratosREPSEProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<ContratoREPSE | null>(null);
  const { toast } = useToast();

  const { data: contratos = [], isLoading } = useQuery<ContratoREPSE[]>({
    queryKey: ["/api/contratos-repse"],
  });

  const { data: clientes = [] } = useQuery<ClienteREPSE[]>({
    queryKey: ["/api/clientes-repse"],
  });

  const { data: registros = [] } = useQuery<RegistroREPSE[]>({
    queryKey: ["/api/registros-repse"],
  });

  const deleteContratoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contratos-repse/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contratos-repse"] });
      toast({
        title: "Contrato eliminado",
        description: "El contrato ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el contrato",
        variant: "destructive",
      });
    },
  });

  const handleContratoCreated = () => {
    setIsFormOpen(false);
    setEditingContrato(null);
    queryClient.invalidateQueries({ queryKey: ["/api/contratos-repse"] });
  };

  const handleEdit = (contrato: ContratoREPSE) => {
    setEditingContrato(contrato);
    setIsFormOpen(true);
  };

  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.razonSocial || "N/A";
  };

  const getEmpresaName = (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.razonSocial || "N/A";
  };

  const getEstatusVariant = (estatus: string) => {
    switch (estatus) {
      case "vigente": return "default";
      case "finalizado": return "secondary";
      case "suspendido": return "outline";
      case "cancelado": return "destructive";
      default: return "outline";
    }
  };

  const getEstatusText = (estatus: string) => {
    switch (estatus) {
      case "vigente": return "Vigente";
      case "finalizado": return "Finalizado";
      case "suspendido": return "Suspendido";
      case "cancelado": return "Cancelado";
      default: return estatus;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando contratos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contratos REPSE</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona los contratos con clientes
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingContrato(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-contrato-repse">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContrato ? "Editar Contrato" : "Nuevo Contrato"}
              </DialogTitle>
              <DialogDescription>
                {editingContrato 
                  ? "Modifica los datos del contrato" 
                  : "Agrega un nuevo contrato REPSE"}
              </DialogDescription>
            </DialogHeader>
            <ContratoREPSEForm 
              contrato={editingContrato}
              empresas={empresas}
              clientes={clientes}
              registros={registros}
              onSuccess={handleContratoCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      {contratos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No hay contratos registrados</p>
            <p className="text-muted-foreground text-sm">
              Agrega tu primer contrato REPSE para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contratos.map((contrato) => (
            <Card key={contrato.id} data-testid={`card-contrato-repse-${contrato.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {contrato.numeroContrato}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Cliente: {getClienteName(contrato.clienteId)}
                    </CardDescription>
                  </div>
                  <Badge variant={getEstatusVariant(contrato.estatus || "vigente")}>
                    {getEstatusText(contrato.estatus || "vigente")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Empresa:</span>
                    <span className="font-medium">{getEmpresaName(contrato.empresaId)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Periodo:</span>
                    <span className="font-medium">
                      {format(new Date(contrato.fechaInicio), "dd/MM/yyyy", { locale: es })}
                      {contrato.fechaFin && ` - ${format(new Date(contrato.fechaFin), "dd/MM/yyyy", { locale: es })}`}
                    </span>
                  </div>
                  {contrato.montoContrato && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Monto:</span>
                      <span className="font-medium">
                        ${parseFloat(contrato.montoContrato).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Notificado IMSS:</span>
                    {contrato.notificadoIMSS ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sí
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </div>
                </div>

                {contrato.serviciosEspecializados && (
                  <div>
                    <span className="text-muted-foreground text-sm">Servicios:</span>
                    <p className="text-sm mt-1">{contrato.serviciosEspecializados}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(contrato)}
                    data-testid={`button-edit-contrato-${contrato.id}`}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-delete-contrato-${contrato.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar contrato?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará el contrato y todas las asignaciones de personal asociadas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteContratoMutation.mutate(contrato.id)}
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
