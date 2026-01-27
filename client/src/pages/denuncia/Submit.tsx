import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  Copy,
  Loader2,
  ArrowLeft,
  MessageSquareWarning,
  Lightbulb,
  Scale,
  AlertCircle,
  Paperclip,
  X,
  FileText,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const categoriaIcons = {
  harassment_abuse: MessageSquareWarning,
  ethics_compliance: Scale,
  suggestions: Lightbulb,
  safety_concerns: AlertCircle,
};

const categoriaLabels: Record<string, string> = {
  harassment_abuse: "Acoso y Abuso",
  ethics_compliance: "Ética y Cumplimiento",
  suggestions: "Sugerencias",
  safety_concerns: "Seguridad Laboral",
};

const categoriaDescriptions: Record<string, string> = {
  harassment_abuse: "Reportar conductas de acoso, discriminación o abuso en el lugar de trabajo",
  ethics_compliance: "Reportar violaciones de políticas, fraude o conducta no ética",
  suggestions: "Compartir ideas para mejorar el ambiente laboral",
  safety_concerns: "Reportar riesgos de seguridad o condiciones inseguras",
};

const submitSchema = z.object({
  categoria: z.string().min(1, "Selecciona una categoría"),
  titulo: z.string().min(5, "El título debe tener al menos 5 caracteres").max(200),
  descripcion: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  emailAnonimo: z.string().email("Email inválido").optional().or(z.literal("")),
  notificarPorEmail: z.boolean().default(false),
});

type SubmitForm = z.infer<typeof submitSchema>;

interface SuccessData {
  caseNumber: string;
  pin: string;
}

interface UploadedFile {
  nombreArchivo: string;
  tipoMime: string;
  tamanioBytes: number;
  storagePath: string;
  previewUrl?: string;
}

export default function DenunciaSubmit() {
  const params = useParams<{ clienteId: string; empresaId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState<"case" | "pin" | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: orgInfo, isLoading: loadingOrg, error: orgError } = useQuery({
    queryKey: ["denuncia-org", params.clienteId, params.empresaId],
    queryFn: async () => {
      const res = await fetch(`/api/denuncia/${params.clienteId}/${params.empresaId}/info`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al cargar información");
      }
      return res.json();
    },
  });

  const form = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      categoria: "",
      titulo: "",
      descripcion: "",
      emailAnonimo: "",
      notificarPorEmail: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitForm) => {
      const res = await fetch(`/api/denuncia/${params.clienteId}/${params.empresaId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          adjuntos: uploadedFiles.map(f => ({
            nombreArchivo: f.nombreArchivo,
            tipoMime: f.tipoMime,
            tamanioBytes: f.tamanioBytes,
            storagePath: f.storagePath,
          })),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al enviar denuncia");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Clean up preview URLs
      uploadedFiles.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      setUploadedFiles([]);
      setSuccessData({
        caseNumber: data.caseNumber,
        pin: data.pin,
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

  const handleCopy = async (type: "case" | "pin", value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copiado",
      description: `${type === "case" ? "Número de caso" : "PIN"} copiado al portapapeles`,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (uploadedFiles.length + files.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Límite excedido",
        description: `Máximo ${maxFiles} archivos permitidos`,
      });
      return;
    }

    setIsUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "Archivo muy grande",
          description: `${file.name} excede el límite de 10MB`,
        });
        continue;
      }

      try {
        // Get upload URL
        const urlRes = await fetch("/api/objects/upload", { method: "POST" });
        if (!urlRes.ok) throw new Error("No se pudo obtener URL de subida");
        const { uploadURL } = await urlRes.json();

        // Upload file
        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (!uploadRes.ok) throw new Error("Error al subir archivo");

        // Create preview for images
        let previewUrl: string | undefined;
        if (file.type.startsWith("image/")) {
          previewUrl = URL.createObjectURL(file);
        }

        // Add to uploaded files
        setUploadedFiles(prev => [...prev, {
          nombreArchivo: file.name,
          tipoMime: file.type,
          tamanioBytes: file.size,
          storagePath: uploadURL.split("?")[0],
          previewUrl,
        }]);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo subir ${file.name}`,
        });
      }
    }

    setIsUploading(false);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const file = prev[index];
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Show error state
  if (orgError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-destructive/5 to-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Portal no disponible</h1>
          <p className="text-muted-foreground">
            {orgError instanceof Error ? orgError.message : "No se pudo cargar el portal"}
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loadingOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show success state
  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-500/5 to-background p-6">
        <div className="max-w-lg mx-auto pt-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Denuncia Registrada
            </h1>
            <p className="text-muted-foreground">
              Tu reporte ha sido recibido de forma anónima
            </p>
          </div>

          <Card className="mb-6 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">
                Guarda esta información
              </CardTitle>
              <CardDescription className="text-green-700">
                Necesitarás estos datos para dar seguimiento a tu caso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-800">Número de Caso</label>
                <div className="flex gap-2">
                  <Input
                    value={successData.caseNumber}
                    readOnly
                    className="font-mono text-lg bg-white"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy("case", successData.caseNumber)}
                  >
                    {copied === "case" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-green-800">PIN de Acceso</label>
                <div className="flex gap-2">
                  <Input
                    value={successData.pin}
                    readOnly
                    className="font-mono text-lg bg-white"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy("pin", successData.pin)}
                  >
                    {copied === "pin" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Importante</p>
                <p>
                  Este es el único momento en que verás tu PIN. Guárdalo en un lugar seguro.
                  Sin el número de caso y PIN no podrás consultar el estado de tu denuncia.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate(`/denuncia/${params.clienteId}/${params.empresaId}/seguimiento`)}
              className="w-full"
            >
              Ir a Seguimiento
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSuccessData(null);
                form.reset();
              }}
              className="w-full"
            >
              Enviar otra denuncia
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedCategoria = form.watch("categoria");
  const categoriasDisponibles = orgInfo?.config?.categoriasHabilitadas || [
    "harassment_abuse",
    "ethics_compliance",
    "suggestions",
    "safety_concerns",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Canal de Denuncias</h1>
              <p className="text-sm text-primary-foreground/80">
                {orgInfo?.empresa?.nombreComercial}
              </p>
            </div>
          </div>
          {orgInfo?.config?.mensajeBienvenida && (
            <p className="text-sm text-primary-foreground/90">
              {orgInfo.config.mensajeBienvenida}
            </p>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="max-w-lg mx-auto px-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Tu anonimato está protegido</p>
              <p>
                Este formulario no registra tu IP, cookies ni ningún dato que pueda identificarte.
                Solo tú conocerás el PIN para dar seguimiento.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de reporte</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {categoriasDisponibles.map((cat: string) => {
                      const Icon = categoriaIcons[cat as keyof typeof categoriaIcons] || AlertCircle;
                      const isSelected = field.value === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => field.onChange(cat)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <p className={`font-medium text-sm ${isSelected ? "text-primary" : ""}`}>
                            {categoriaLabels[cat]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {selectedCategoria && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {categoriaDescriptions[selectedCategoria]}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del reporte</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Describe brevemente el asunto"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción detallada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Proporciona todos los detalles relevantes: qué sucedió, cuándo, dónde, personas involucradas, etc."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Entre más detalles proporciones, mejor podremos investigar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Attachments */}
            {orgInfo?.config?.permitirAdjuntos && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Adjuntar evidencia (opcional)
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {uploadedFiles.length}/5 archivos
                  </span>
                </div>

                {/* Uploaded files preview */}
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative group border rounded-lg p-2 bg-muted/30"
                      >
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {file.previewUrl ? (
                          <img
                            src={file.previewUrl}
                            alt={file.nombreArchivo}
                            className="w-full h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-20 flex items-center justify-center bg-muted rounded">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs truncate mt-1">{file.nombreArchivo}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {uploadedFiles.length < 5 && (
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isUploading}
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Paperclip className="mr-2 h-4 w-4" />
                            Agregar archivos
                          </>
                        )}
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Imágenes o PDF, máximo 10MB cada uno
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Optional Email */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <FormField
                control={form.control}
                name="notificarPorEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recibir actualizaciones por email (opcional)</FormLabel>
                      <FormDescription>
                        Puedes proporcionar un email anónimo para recibir notificaciones
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("notificarPorEmail") && (
                <FormField
                  control={form.control}
                  name="emailAnonimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@ejemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Considera usar un email que no revele tu identidad
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Reporte Anónimo"
              )}
            </Button>
          </form>
        </Form>

        {/* Link to track existing case */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            ¿Ya tienes un caso abierto?
          </p>
          <Button
            variant="link"
            onClick={() => navigate(`/denuncia/${params.clienteId}/${params.empresaId}/seguimiento`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Consultar estado de mi denuncia
          </Button>
        </div>
      </div>
    </div>
  );
}
