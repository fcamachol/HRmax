import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowLeft,
  MessageSquare,
  FileSearch,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const verifySchema = z.object({
  caseNumber: z.string().min(1, "Ingresa el número de caso"),
  pin: z.string().min(6, "El PIN debe tener 6 dígitos").max(6),
});

const messageSchema = z.object({
  contenido: z.string().min(5, "El mensaje debe tener al menos 5 caracteres"),
});

type VerifyForm = z.infer<typeof verifySchema>;
type MessageForm = z.infer<typeof messageSchema>;

interface Mensaje {
  id: string;
  contenido: string;
  esDeReportante: boolean;
  createdAt: string;
}

interface CaseData {
  caseNumber: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  estatus: string;
  prioridad: string;
  resolucionDescripcion: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

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

const categoriaLabels: Record<string, string> = {
  harassment_abuse: "Acoso y Abuso",
  ethics_compliance: "Ética y Cumplimiento",
  suggestions: "Sugerencias",
  safety_concerns: "Seguridad Laboral",
};

export default function DenunciaTrack() {
  const params = useParams<{ clienteId: string; empresaId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [credentials, setCredentials] = useState<{ caseNumber: string; pin: string } | null>(null);

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      caseNumber: "",
      pin: "",
    },
  });

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      contenido: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerifyForm) => {
      const res = await fetch("/api/denuncia/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al verificar");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCaseData(data.denuncia);
      setMensajes(data.mensajes);
      setCredentials({
        caseNumber: verifyForm.getValues("caseNumber"),
        pin: verifyForm.getValues("pin"),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const messageMutation = useMutation({
    mutationFn: async (data: MessageForm) => {
      if (!credentials) throw new Error("No hay credenciales");
      const res = await fetch("/api/denuncia/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseNumber: credentials.caseNumber,
          pin: credentials.pin,
          contenido: data.contenido,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al enviar mensaje");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setMensajes([...mensajes, data.mensaje]);
      messageForm.reset();
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido registrado",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const refreshCase = () => {
    if (credentials) {
      verifyMutation.mutate(credentials);
    }
  };

  const isClosed = caseData?.estatus === "cerrado" || caseData?.estatus === "descartado";

  // If not verified yet, show verification form
  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-6 px-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileSearch className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Seguimiento de Caso</h1>
                <p className="text-sm text-primary-foreground/80">
                  Consulta el estado de tu denuncia
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Acceder a mi caso
              </CardTitle>
              <CardDescription>
                Ingresa tu número de caso y PIN para consultar el estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...verifyForm}>
                <form
                  onSubmit={verifyForm.handleSubmit((data) => verifyMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={verifyForm.control}
                    name="caseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Caso</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="DEN-2024-000000"
                            className="font-mono"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={verifyForm.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN de Acceso</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            maxLength={6}
                            className="font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Acceder"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Link back to submit new */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              ¿Necesitas reportar algo nuevo?
            </p>
            <Button
              variant="link"
              onClick={() => navigate(`/denuncia/${params.clienteId}/${params.empresaId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Crear nueva denuncia
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Case details view
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/10"
              onClick={() => {
                setCaseData(null);
                setCredentials(null);
                verifyForm.reset();
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Salir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/10"
              onClick={refreshCase}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-primary-foreground/80">Caso</p>
              <h1 className="text-lg font-bold font-mono">{caseData.caseNumber}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge className={estatusColors[caseData.estatus]}>
                  {estatusLabels[caseData.estatus]}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {categoriaLabels[caseData.categoria]}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Creado</p>
                <p>{format(new Date(caseData.createdAt), "d MMM yyyy", { locale: es })}</p>
              </div>
            </div>
            <h3 className="font-semibold mb-2">{caseData.titulo}</h3>
            <p className="text-sm text-muted-foreground">{caseData.descripcion}</p>

            {caseData.resolucionDescripcion && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Resolución</span>
                </div>
                <p className="text-sm text-green-700">{caseData.resolucionDescripcion}</p>
                {caseData.resolvedAt && (
                  <p className="text-xs text-green-600 mt-2">
                    Resuelto el {format(new Date(caseData.resolvedAt), "d MMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estado del proceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["nuevo", "en_revision", "en_investigacion", "resuelto"].map((status, index) => {
                const isActive = caseData.estatus === status;
                const isPast = ["nuevo", "en_revision", "en_investigacion", "resuelto"].indexOf(caseData.estatus) > index ||
                  (caseData.estatus === "cerrado" && index < 4);

                return (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? "bg-primary text-white"
                          : isPast
                          ? "bg-green-100 text-green-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPast && !isActive ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${isActive ? "font-medium" : isPast ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                      {estatusLabels[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comunicación
            </CardTitle>
            <CardDescription>
              Mensajes entre tú y el equipo de investigación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mensajes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay mensajes aún
              </p>
            ) : (
              <div className="space-y-4 mb-4">
                {mensajes.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg ${
                      m.esDeReportante
                        ? "bg-primary/10 ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    <p className="text-sm">{m.contenido}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.esDeReportante ? "Tú" : "Equipo de investigación"} •{" "}
                      {format(new Date(m.createdAt), "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {isClosed ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm p-3 bg-muted rounded-lg">
                <XCircle className="h-4 w-4" />
                Este caso está cerrado y no acepta más mensajes
              </div>
            ) : (
              <Form {...messageForm}>
                <form
                  onSubmit={messageForm.handleSubmit((data) => messageMutation.mutate(data))}
                  className="space-y-3"
                >
                  <FormField
                    control={messageForm.control}
                    name="contenido"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Escribe información adicional o responde al equipo..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={messageMutation.isPending}
                  >
                    {messageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Enviar
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
