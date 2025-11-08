import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FileText, AlertTriangle, Upload } from "lucide-react";
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
import type { RegistroREPSE, Empresa } from "@shared/schema";
import RegistroREPSEForm from "@/components/RegistroREPSEForm";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface RegistrosREPSEProps {
  empresas: Empresa[];
}

export default function RegistrosREPSE({ empresas }: RegistrosREPSEProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroREPSE | null>(null);
  const { toast } = useToast();

  const { data: registros = [], isLoading } = useQuery<RegistroREPSE[]>({
    queryKey: ["/api/registros-repse"],
  });

  const deleteRegistroMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/registros-repse/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registros-repse"] });
      toast({
        title: "Registro eliminado",
        description: "El registro REPSE ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el registro",
        variant: "destructive",
      });
    },
  });

  const handleRegistroCreated = () => {
    setIsFormOpen(false);
    setEditingRegistro(null);
    queryClient.invalidateQueries({ queryKey: ["/api/registros-repse"] });
  };

  const handleEdit = (registro: RegistroREPSE) => {
    setEditingRegistro(registro);
    setIsFormOpen(true);
  };

  const getEmpresaName = (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.razonSocial || "N/A";
  };

  const getVencimientoStatus = (fechaVencimiento: string) => {
    const diasRestantes = differenceInDays(new Date(fechaVencimiento), new Date());
    
    if (diasRestantes < 0) {
      return { variant: "destructive" as const, text: "Vencido", showAlert: true };
    } else if (diasRestantes <= 30) {
      return { variant: "destructive" as const, text: `Vence en ${diasRestantes} días`, showAlert: true };
    } else if (diasRestantes <= 60) {
      return { variant: "default" as const, text: `Vence en ${diasRestantes} días`, showAlert: true };
    } else if (diasRestantes <= 90) {
      return { variant: "secondary" as const, text: `Vence en ${diasRestantes} días`, showAlert: true };
    }
    return { variant: "outline" as const, text: `Vence en ${diasRestantes} días`, showAlert: false };
  };

  const getEstatusVariant = (estatus: string) => {
    switch (estatus) {
      case "vigente":
        return "default";
      case "vencido":
        return "destructive";
      case "suspendido":
        return "secondary";
      case "en_tramite":
        return "outline";
      default:
        return "outline";
    }
  };

  const getEstatusText = (estatus: string) => {
    switch (estatus) {
      case "vigente":
        return "Vigente";
      case "vencido":
        return "Vencido";
      case "suspendido":
        return "Suspendido";
      case "en_tramite":
        return "En Trámite";
      default:
        return estatus;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando registros REPSE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Registros REPSE</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona los registros REPSE de las empresas
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingRegistro(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-registro-repse">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRegistro ? "Editar Registro REPSE" : "Nuevo Registro REPSE"}
              </DialogTitle>
              <DialogDescription>
                {editingRegistro 
                  ? "Modifica los datos del registro REPSE" 
                  : "Agrega un nuevo registro REPSE para la empresa"}
              </DialogDescription>
            </DialogHeader>
            <RegistroREPSEForm 
              registro={editingRegistro}
              empresas={empresas}
              onSuccess={handleRegistroCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      {registros.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No hay registros REPSE</p>
            <p className="text-muted-foreground text-sm">
              Agrega tu primer registro REPSE para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registros.map((registro) => {
            const vencimientoStatus = getVencimientoStatus(registro.fechaVencimiento);
            
            return (
              <Card key={registro.id} data-testid={`card-registro-repse-${registro.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {registro.numeroRegistro}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {getEmpresaName(registro.empresaId)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={getEstatusVariant(registro.estatus || "vigente")}>
                        {getEstatusText(registro.estatus || "vigente")}
                      </Badge>
                      {vencimientoStatus.showAlert && (
                        <Badge variant={vencimientoStatus.variant} className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {vencimientoStatus.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">
                        {registro.tipoRegistro === "servicios_especializados" 
                          ? "Servicios Especializados" 
                          : "Obras Especializadas"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha Emisión:</span>
                      <span className="font-medium">
                        {format(new Date(registro.fechaEmision), "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha Vencimiento:</span>
                      <span className="font-medium">
                        {format(new Date(registro.fechaVencimiento), "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    {registro.archivoUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Archivo:</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => window.open(registro.archivoUrl!, '_blank')}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {registro.archivoNombre || "Ver PDF"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(registro)}
                      data-testid={`button-edit-registro-${registro.id}`}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-delete-registro-${registro.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el registro y todos los contratos asociados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRegistroMutation.mutate(registro.id)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
