import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, CheckCircle, AlertTriangle, Clock, FileText, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AvisoREPSE, ContratoREPSE } from "@shared/schema";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface AvisosREPSEProps {
  contratos: ContratoREPSE[];
}

export default function AvisosREPSE({ contratos }: AvisosREPSEProps) {
  const [isPresentarDialogOpen, setIsPresentarDialogOpen] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState<AvisoREPSE | null>(null);
  const [fechaPresentacion, setFechaPresentacion] = useState("");
  const [numeroFolio, setNumeroFolio] = useState("");
  const { toast } = useToast();

  const { data: avisos = [], isLoading } = useQuery<AvisoREPSE[]>({
    queryKey: ["/api/avisos-repse/pendientes"],
  });

  const presentarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      console.log("[AvisosREPSE] Presentando aviso:", id, data);
      const result = await apiRequest("POST", `/api/avisos-repse/${id}/presentar`, data);
      console.log("[AvisosREPSE] Respuesta de presentar:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("[AvisosREPSE] onSuccess ejecutado, cerrando diálogo");
      queryClient.invalidateQueries({ queryKey: ["/api/avisos-repse/pendientes"] });
      toast({
        title: "Aviso presentado",
        description: "El aviso ha sido marcado como presentado exitosamente",
      });
      setIsPresentarDialogOpen(false);
      setSelectedAviso(null);
      setFechaPresentacion("");
      setNumeroFolio("");
    },
    onError: (error: any) => {
      console.error("[AvisosREPSE] onError ejecutado:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar el aviso como presentado",
        variant: "destructive",
      });
    },
  });

  const deleteAvisoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/avisos-repse/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/avisos-repse/pendientes"] });
      toast({
        title: "Aviso eliminado",
        description: "El aviso ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el aviso",
        variant: "destructive",
      });
    },
  });

  const getUrgenciaStatus = (fechaLimite: string) => {
    const diasRestantes = differenceInDays(new Date(fechaLimite), new Date());
    
    if (diasRestantes < 0) {
      return { 
        variant: "destructive" as const, 
        text: "VENCIDO", 
        icon: AlertTriangle,
        className: "bg-red-500 text-white hover:bg-red-600"
      };
    } else if (diasRestantes === 0) {
      return { 
        variant: "destructive" as const, 
        text: "VENCE HOY", 
        icon: AlertTriangle,
        className: "bg-red-500 text-white hover:bg-red-600 animate-pulse"
      };
    } else if (diasRestantes <= 3) {
      return { 
        variant: "destructive" as const, 
        text: `Vence en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`, 
        icon: AlertTriangle,
        className: "bg-orange-500 text-white hover:bg-orange-600"
      };
    } else if (diasRestantes <= 7) {
      return { 
        variant: "default" as const, 
        text: `Vence en ${diasRestantes} días`, 
        icon: Clock,
        className: "bg-yellow-500 text-black hover:bg-yellow-600"
      };
    }
    return { 
      variant: "secondary" as const, 
      text: `Vence en ${diasRestantes} días`, 
      icon: Clock,
      className: ""
    };
  };

  const getTipoAvisoText = (tipo: string) => {
    switch (tipo) {
      case "REPORTE_TRIMESTRAL":
        return "Reporte Trimestral";
      case "NUEVO_CONTRATO":
        return "Nuevo Contrato";
      case "MODIFICACION_CONTRATO":
        return "Modificación de Contrato";
      case "TERMINACION_CONTRATO":
        return "Terminación de Contrato";
      case "CAMBIO_EMPRESA":
        return "Cambio en Empresa";
      default:
        return tipo;
    }
  };

  const getTipoAvisoVariant = (tipo: string) => {
    switch (tipo) {
      case "REPORTE_TRIMESTRAL":
        return "default";
      case "NUEVO_CONTRATO":
        return "default";
      case "MODIFICACION_CONTRATO":
        return "secondary";
      case "TERMINACION_CONTRATO":
        return "outline";
      case "CAMBIO_EMPRESA":
        return "outline";
      default:
        return "outline";
    }
  };

  const handlePresentar = (aviso: AvisoREPSE) => {
    setSelectedAviso(aviso);
    setFechaPresentacion(format(new Date(), 'yyyy-MM-dd'));
    setIsPresentarDialogOpen(true);
  };

  const handleSubmitPresentacion = () => {
    if (!selectedAviso || !fechaPresentacion) {
      toast({
        title: "Error",
        description: "Debe seleccionar una fecha de presentación",
        variant: "destructive",
      });
      return;
    }

    presentarMutation.mutate({
      id: selectedAviso.id,
      data: {
        fechaPresentacion,
        numeroFolioSTPS: numeroFolio || undefined,
      },
    });
  };

  const getContratoNumero = (contratoId: string | null) => {
    if (!contratoId) return "N/A";
    const contrato = contratos.find(c => c.id === contratoId);
    return contrato?.numeroContrato || "N/A";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Cargando avisos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-title-avisos">Avisos REPSE</h2>
          <p className="text-muted-foreground">
            Gestión de avisos y reportes obligatorios ante STPS e IMSS
          </p>
        </div>
      </div>

      {avisos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay avisos pendientes</h3>
            <p className="text-muted-foreground text-center">
              Todos los avisos están al corriente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {avisos.map((aviso) => {
            const urgencia = getUrgenciaStatus(aviso.fechaLimite);
            const UrgenciaIcon = urgencia.icon;

            return (
              <Card key={aviso.id} data-testid={`card-aviso-${aviso.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getTipoAvisoVariant(aviso.tipo)} data-testid={`badge-tipo-${aviso.id}`}>
                          {getTipoAvisoText(aviso.tipo)}
                        </Badge>
                        <Badge className={urgencia.className} data-testid={`badge-urgencia-${aviso.id}`}>
                          <UrgenciaIcon className="h-3 w-3 mr-1" />
                          {urgencia.text}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{aviso.descripcion}</CardTitle>
                      <CardDescription className="mt-1">
                        {aviso.contratoREPSEId && (
                          <span>Contrato: {getContratoNumero(aviso.contratoREPSEId)} • </span>
                        )}
                        {aviso.tipo === "REPORTE_TRIMESTRAL" && aviso.trimestre && (
                          <span>Q{aviso.trimestre} {aviso.año} • </span>
                        )}
                        Fecha límite: {format(new Date(aviso.fechaLimite), "dd 'de' MMMM, yyyy", { locale: es })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handlePresentar(aviso)}
                        data-testid={`button-presentar-${aviso.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como Presentado
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-delete-aviso-${aviso.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar aviso?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará el aviso permanentemente. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAvisoMutation.mutate(aviso.id)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {aviso.notas && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <strong>Notas:</strong> {aviso.notas}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isPresentarDialogOpen} onOpenChange={setIsPresentarDialogOpen}>
        <DialogContent data-testid="dialog-presentar-aviso">
          <DialogHeader>
            <DialogTitle>Marcar Aviso como Presentado</DialogTitle>
            <DialogDescription>
              Registre la presentación del aviso ante la autoridad correspondiente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fecha-presentacion">Fecha de Presentación *</Label>
              <Input
                id="fecha-presentacion"
                type="date"
                value={fechaPresentacion}
                onChange={(e) => setFechaPresentacion(e.target.value)}
                data-testid="input-fecha-presentacion"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero-folio">Número de Folio STPS (opcional)</Label>
              <Input
                id="numero-folio"
                type="text"
                placeholder="Ej: STPS-2025-001234"
                value={numeroFolio}
                onChange={(e) => setNumeroFolio(e.target.value)}
                data-testid="input-numero-folio"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPresentarDialogOpen(false);
                setSelectedAviso(null);
                setFechaPresentacion("");
                setNumeroFolio("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitPresentacion}
              disabled={!fechaPresentacion || presentarMutation.isPending}
              data-testid="button-confirmar-presentacion"
            >
              {presentarMutation.isPending ? "Guardando..." : "Confirmar Presentación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
