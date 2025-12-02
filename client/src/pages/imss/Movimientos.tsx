import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileUp, 
  FileCheck, 
  XCircle, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Filter,
  RefreshCw,
  Users
} from "lucide-react";
import type { ImssMovimiento, Empresa } from "@shared/schema";

const tipoMovimientoLabels: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "bg-green-500" },
  baja: { label: "Baja", color: "bg-red-500" },
  modificacion_salario: { label: "Mod. Salario", color: "bg-blue-500" },
  reingreso: { label: "Reingreso", color: "bg-purple-500" },
};

const estatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendiente: { label: "Pendiente", variant: "secondary" },
  enviado: { label: "Enviado", variant: "outline" },
  aceptado: { label: "Aceptado", variant: "default" },
  rechazado: { label: "Rechazado", variant: "destructive" },
};

export default function ImssMovimientos() {
  const { toast } = useToast();
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [filterEstatus, setFilterEstatus] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"enviar" | "aceptar" | "rechazar">("enviar");
  const [selectedMovimiento, setSelectedMovimiento] = useState<ImssMovimiento | null>(null);
  const [numeroAcuse, setNumeroAcuse] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const { data: movimientos = [], isLoading, refetch } = useQuery<ImssMovimiento[]>({
    queryKey: ["/api/imss/movimientos", { empresaId: selectedEmpresa, estatus: filterEstatus !== "all" ? filterEstatus : undefined, tipoMovimiento: filterTipo !== "all" ? filterTipo : undefined }],
    enabled: !!selectedEmpresa,
  });

  const enviarMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/imss/movimientos/${id}/enviar`),
    onSuccess: () => {
      refetch();
      toast({ title: "Movimiento enviado", description: "El movimiento ha sido marcado como enviado al IMSS" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const aceptarMutation = useMutation({
    mutationFn: ({ id, numeroAcuse }: { id: string; numeroAcuse: string }) => 
      apiRequest("POST", `/api/imss/movimientos/${id}/aceptar`, { numeroAcuse }),
    onSuccess: () => {
      refetch();
      toast({ title: "Movimiento aceptado", description: "El movimiento ha sido registrado como aceptado por el IMSS" });
      setDialogOpen(false);
      setNumeroAcuse("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: ({ id, motivoRechazo }: { id: string; motivoRechazo: string }) => 
      apiRequest("POST", `/api/imss/movimientos/${id}/rechazar`, { motivoRechazo }),
    onSuccess: () => {
      refetch();
      toast({ title: "Movimiento rechazado", description: "El movimiento ha sido registrado como rechazado" });
      setDialogOpen(false);
      setMotivoRechazo("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const openActionDialog = (movimiento: ImssMovimiento, type: "enviar" | "aceptar" | "rechazar") => {
    setSelectedMovimiento(movimiento);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleDialogConfirm = () => {
    if (!selectedMovimiento) return;
    
    switch (dialogType) {
      case "enviar":
        enviarMutation.mutate(selectedMovimiento.id);
        break;
      case "aceptar":
        aceptarMutation.mutate({ id: selectedMovimiento.id, numeroAcuse });
        break;
      case "rechazar":
        rechazarMutation.mutate({ id: selectedMovimiento.id, motivoRechazo });
        break;
    }
  };

  const countByEstatus = (estatus: string) => 
    movimientos.filter(m => m.estatus === estatus).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-imss-movimientos-title">Movimientos IMSS</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de movimientos afiliatorios ante el IMSS (altas, bajas, modificaciones de salario, reingresos)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByEstatus("pendiente")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByEstatus("enviado")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Aceptados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByEstatus("aceptado")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rechazados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByEstatus("rechazado")}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Empresa</Label>
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger data-testid="select-empresa">
                  <SelectValue placeholder="Seleccionar empresa" />
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
            <div className="w-[180px]">
              <Label>Estatus</Label>
              <Select value={filterEstatus} onValueChange={setFilterEstatus}>
                <SelectTrigger data-testid="select-estatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aceptado">Aceptado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Label>Tipo Movimiento</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger data-testid="select-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="modificacion_salario">Mod. Salario</SelectItem>
                  <SelectItem value="reingreso">Reingreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {!selectedEmpresa ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecciona una empresa para ver los movimientos IMSS</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : movimientos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay movimientos IMSS registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Tipo</TableHead>
                <TableHead className="w-28">NSS</TableHead>
                <TableHead>Fecha Mov.</TableHead>
                <TableHead>SBC</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Fecha IMSS</TableHead>
                <TableHead>Acuse</TableHead>
                <TableHead className="w-40 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimientos.map((mov) => (
                <TableRow key={mov.id} data-testid={`row-movimiento-${mov.id}`}>
                  <TableCell>
                    <Badge className={tipoMovimientoLabels[mov.tipoMovimiento]?.color || "bg-gray-500"}>
                      {tipoMovimientoLabels[mov.tipoMovimiento]?.label || mov.tipoMovimiento}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{mov.nss || "-"}</TableCell>
                  <TableCell>{formatDate(mov.fechaMovimiento)}</TableCell>
                  <TableCell>{formatCurrency(mov.sbcDecimal)}</TableCell>
                  <TableCell>
                    <Badge variant={estatusLabels[mov.estatus]?.variant || "secondary"}>
                      {estatusLabels[mov.estatus]?.label || mov.estatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(mov.fechaPresentacionImss)}</TableCell>
                  <TableCell className="font-mono text-xs">{mov.numeroAcuse || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {mov.estatus === "pendiente" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openActionDialog(mov, "enviar")}
                          data-testid={`button-enviar-${mov.id}`}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                      {mov.estatus === "enviado" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openActionDialog(mov, "aceptar")}
                            data-testid={`button-aceptar-${mov.id}`}
                          >
                            <FileCheck className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openActionDialog(mov, "rechazar")}
                            data-testid={`button-rechazar-${mov.id}`}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "enviar" && "Confirmar Envío al IMSS"}
              {dialogType === "aceptar" && "Registrar Aceptación"}
              {dialogType === "rechazar" && "Registrar Rechazo"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "enviar" && "¿Confirmas que este movimiento ha sido enviado al IMSS?"}
              {dialogType === "aceptar" && "Ingresa el número de acuse proporcionado por el IMSS"}
              {dialogType === "rechazar" && "Indica el motivo del rechazo por parte del IMSS"}
            </DialogDescription>
          </DialogHeader>
          
          {dialogType === "aceptar" && (
            <div className="space-y-2">
              <Label htmlFor="numeroAcuse">Número de Acuse</Label>
              <Input
                id="numeroAcuse"
                value={numeroAcuse}
                onChange={(e) => setNumeroAcuse(e.target.value)}
                placeholder="Ej: ACUSE-2025-001234"
                data-testid="input-numero-acuse"
              />
            </div>
          )}
          
          {dialogType === "rechazar" && (
            <div className="space-y-2">
              <Label htmlFor="motivoRechazo">Motivo del Rechazo</Label>
              <Textarea
                id="motivoRechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Describe el motivo del rechazo..."
                data-testid="input-motivo-rechazo"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDialogConfirm}
              disabled={
                (dialogType === "aceptar" && !numeroAcuse) ||
                (dialogType === "rechazar" && !motivoRechazo)
              }
              data-testid="button-dialog-confirm"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
