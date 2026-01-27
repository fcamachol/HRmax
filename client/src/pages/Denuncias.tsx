import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Send,
  Eye,
  ExternalLink,
  Copy,
  Settings,
  Users,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCliente } from "@/contexts/ClienteContext";

const estatusLabels: Record<string, string> = {
  nuevo: "Nuevo",
  en_revision: "En Revisión",
  en_investigacion: "En Investigación",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  descartado: "Descartado",
};

const estatusColors: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  en_revision: "bg-yellow-100 text-yellow-800",
  en_investigacion: "bg-orange-100 text-orange-800",
  resuelto: "bg-green-100 text-green-800",
  cerrado: "bg-gray-100 text-gray-800",
  descartado: "bg-red-100 text-red-800",
};

const prioridadLabels: Record<string, string> = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

const prioridadColors: Record<string, string> = {
  baja: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  alta: "bg-orange-100 text-orange-800",
  urgente: "bg-red-100 text-red-800",
};

const categoriaLabels: Record<string, string> = {
  harassment_abuse: "Acoso y Abuso",
  ethics_compliance: "Ética y Cumplimiento",
  suggestions: "Sugerencias",
  safety_concerns: "Seguridad Laboral",
};

interface Denuncia {
  id: string;
  caseNumber: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  estatus: string;
  prioridad: string;
  notasInternas: string | null;
  resolucionDescripcion: string | null;
  createdAt: string;
  resolvedAt: string | null;
  unreadMessageCount: number;
  empresaId: string | null;
}

interface Mensaje {
  id: string;
  contenido: string;
  esDeReportante: boolean;
  usuarioNombre: string | null;
  leido: boolean;
  createdAt: string;
}

interface DenunciaDetail extends Denuncia {
  mensajes: Mensaje[];
  adjuntos: any[];
  auditLog: any[];
}

export default function Denuncias() {
  const { clienteId, cliente, empresas } = useCliente();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDenuncia, setSelectedDenuncia] = useState<string | null>(null);
  const [filterEstatus, setFilterEstatus] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Fetch denuncias
  const { data: denuncias = [], isLoading } = useQuery<Denuncia[]>({
    queryKey: [`/api/denuncias?clienteId=${clienteId}`],
    enabled: !!clienteId,
  });

  // Fetch selected denuncia details
  const { data: denunciaDetail, isLoading: loadingDetail } = useQuery<DenunciaDetail>({
    queryKey: [`/api/denuncias/${selectedDenuncia}?clienteId=${clienteId}`],
    enabled: !!selectedDenuncia && !!clienteId,
  });

  // Update denuncia
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/denuncias/${id}?clienteId=${clienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/denuncias?clienteId=${clienteId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/denuncias/${selectedDenuncia}?clienteId=${clienteId}`] });
      toast({ title: "Actualizado", description: "Cambios guardados" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar" });
    },
  });

  // Send message
  const messageMutation = useMutation({
    mutationFn: async ({ id, contenido }: { id: string; contenido: string }) => {
      const res = await fetch(`/api/denuncias/${id}/mensaje?clienteId=${clienteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al enviar mensaje");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/denuncias/${selectedDenuncia}?clienteId=${clienteId}`] });
      setNewMessage("");
      toast({ title: "Enviado", description: "Mensaje enviado al reportante" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo enviar" });
    },
  });

  // Filter denuncias
  const filteredDenuncias = denuncias.filter((d) => {
    if (filterEstatus !== "all" && d.estatus !== filterEstatus) return false;
    if (filterCategoria !== "all" && d.categoria !== filterCategoria) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        d.caseNumber.toLowerCase().includes(search) ||
        d.titulo.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: denuncias.length,
    nuevos: denuncias.filter((d) => d.estatus === "nuevo").length,
    enProceso: denuncias.filter((d) => ["en_revision", "en_investigacion"].includes(d.estatus)).length,
    urgentes: denuncias.filter((d) => d.prioridad === "urgente" && !["cerrado", "descartado", "resuelto"].includes(d.estatus)).length,
    sinLeer: denuncias.reduce((acc, d) => acc + d.unreadMessageCount, 0),
  };

  // Get portal URL
  const getPortalUrl = () => {
    if (!cliente?.slug || !empresas?.length) return null;
    const empresa = empresas[0];
    if (!empresa?.slug) return null;
    return `${window.location.origin}/denuncia/${cliente.slug}/${empresa.slug}`;
  };

  const portalUrl = getPortalUrl();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Canal de Denuncias
          </h1>
          <p className="text-muted-foreground">
            Gestión de reportes anónimos - NOM-035-STPS-2018
          </p>
        </div>
        <div className="flex gap-2">
          {portalUrl && (
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(portalUrl);
                toast({ title: "Copiado", description: "URL del portal copiada" });
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar URL Portal
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowConfig(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total reportes</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.nuevos}</div>
            <p className="text-sm text-blue-600/80">Nuevos</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.enProceso}</div>
            <p className="text-sm text-yellow-600/80">En proceso</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.urgentes}</div>
            <p className="text-sm text-red-600/80">Urgentes</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.sinLeer}</div>
            <p className="text-sm text-purple-600/80">Mensajes sin leer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de caso o título..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterEstatus} onValueChange={setFilterEstatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(estatusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(categoriaLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Denuncias List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDenuncias.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold mb-2">No hay denuncias</h3>
            <p className="text-sm text-muted-foreground">
              {denuncias.length === 0
                ? "Aún no se han recibido reportes anónimos"
                : "No hay resultados que coincidan con los filtros"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDenuncias.map((denuncia) => (
            <Card
              key={denuncia.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedDenuncia(denuncia.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">
                        {denuncia.caseNumber}
                      </span>
                      <Badge className={estatusColors[denuncia.estatus]}>
                        {estatusLabels[denuncia.estatus]}
                      </Badge>
                      {denuncia.prioridad !== "normal" && (
                        <Badge className={prioridadColors[denuncia.prioridad]}>
                          {prioridadLabels[denuncia.prioridad]}
                        </Badge>
                      )}
                      {denuncia.unreadMessageCount > 0 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {denuncia.unreadMessageCount}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{denuncia.titulo}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {denuncia.descripcion}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground shrink-0">
                    <p>{categoriaLabels[denuncia.categoria]}</p>
                    <p>{format(new Date(denuncia.createdAt), "d MMM yyyy", { locale: es })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedDenuncia} onOpenChange={(open) => !open && setSelectedDenuncia(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {loadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : denunciaDetail ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono">{denunciaDetail.caseNumber}</span>
                </SheetTitle>
                <SheetDescription>
                  {categoriaLabels[denunciaDetail.categoria]} •{" "}
                  {format(new Date(denunciaDetail.createdAt), "d MMMM yyyy, HH:mm", { locale: es })}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Estado</label>
                    <Select
                      value={denunciaDetail.estatus}
                      onValueChange={(value) =>
                        updateMutation.mutate({ id: denunciaDetail.id, updates: { estatus: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(estatusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Prioridad</label>
                    <Select
                      value={denunciaDetail.prioridad}
                      onValueChange={(value) =>
                        updateMutation.mutate({ id: denunciaDetail.id, updates: { prioridad: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prioridadLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Report Content */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{denunciaDetail.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{denunciaDetail.descripcion}</p>
                  </CardContent>
                </Card>

                {/* Internal Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Notas internas (no visibles para el reportante)
                  </label>
                  <Textarea
                    value={denunciaDetail.notasInternas || ""}
                    onChange={(e) =>
                      updateMutation.mutate({
                        id: denunciaDetail.id,
                        updates: { notasInternas: e.target.value },
                      })
                    }
                    placeholder="Agregar notas internas..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* Resolution */}
                {["resuelto", "cerrado"].includes(denunciaDetail.estatus) && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Descripción de resolución (visible para el reportante)
                    </label>
                    <Textarea
                      value={denunciaDetail.resolucionDescripcion || ""}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: denunciaDetail.id,
                          updates: { resolucionDescripcion: e.target.value },
                        })
                      }
                      placeholder="Describir cómo se resolvió el caso..."
                      className="min-h-[80px]"
                    />
                  </div>
                )}

                {/* Messages */}
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comunicación con el reportante
                  </h3>
                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                    {denunciaDetail.mensajes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Sin mensajes
                      </p>
                    ) : (
                      denunciaDetail.mensajes.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-lg ${
                            m.esDeReportante ? "bg-blue-50 mr-8" : "bg-muted ml-8"
                          }`}
                        >
                          <p className="text-sm">{m.contenido}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {m.esDeReportante ? "Reportante" : m.usuarioNombre || "Admin"} •{" "}
                            {format(new Date(m.createdAt), "d MMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {!["cerrado", "descartado"].includes(denunciaDetail.estatus) && (
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribir mensaje al reportante..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && newMessage.trim()) {
                            e.preventDefault();
                            messageMutation.mutate({ id: denunciaDetail.id, contenido: newMessage });
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (newMessage.trim()) {
                            messageMutation.mutate({ id: denunciaDetail.id, contenido: newMessage });
                          }
                        }}
                        disabled={messageMutation.isPending || !newMessage.trim()}
                      >
                        {messageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Audit Log */}
                {denunciaDetail.auditLog.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Historial de acciones
                    </h3>
                    <div className="space-y-2 text-sm">
                      {denunciaDetail.auditLog.slice(0, 10).map((log: any) => (
                        <div key={log.id} className="flex justify-between text-muted-foreground">
                          <span>{log.accion}</span>
                          <span>{format(new Date(log.createdAt), "d MMM HH:mm", { locale: es })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Config Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración del Canal de Denuncias</DialogTitle>
            <DialogDescription>
              Personaliza el comportamiento del sistema de reportes anónimos
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              La configuración avanzada estará disponible próximamente.
            </p>
            {portalUrl && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <label className="text-sm font-medium block mb-2">URL del portal público</label>
                <div className="flex gap-2">
                  <Input value={portalUrl} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(portalUrl);
                      toast({ title: "Copiado" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Comparte esta URL con tus empleados para que puedan hacer denuncias anónimas
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
