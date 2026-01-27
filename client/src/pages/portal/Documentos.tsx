import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  File,
  FileCheck,
  Loader2,
  Folder,
  FolderOpen,
  Shield,
  Receipt,
  ScrollText,
  MoreVertical,
  PlusCircle,
  BadgeCheck,
  Users,
  ArrowLeft,
  Upload,
  Image,
  CreditCard,
  FileImage,
  Trash2,
  Eye,
  Camera,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Document {
  id: number;
  tipo: string;
  tipoLabel: string;
  nombre: string;
  fechaGeneracion: string;
  estado: "generado" | "pendiente" | "error";
  urlDescarga?: string;
  tamanio?: string;
  categoria?: string;
}

interface DocumentType {
  id: string;
  nombre: string;
  descripcion: string;
  tiempoEstimado: string;
}

interface FolderCategory {
  id: string;
  nombre: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
  count: number;
  editable?: boolean;
}

interface PersonalDocType {
  id: string;
  nombre: string;
  descripcion: string;
  requerido: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

// Personal document types that employees can upload
const personalDocTypes: PersonalDocType[] = [
  {
    id: "ine",
    nombre: "INE / IFE",
    descripcion: "Identificación oficial vigente",
    requerido: true,
    icon: CreditCard,
  },
  {
    id: "curp",
    nombre: "CURP",
    descripcion: "Clave Única de Registro de Población",
    requerido: true,
    icon: FileText,
  },
  {
    id: "comprobante_domicilio",
    nombre: "Comprobante de Domicilio",
    descripcion: "Recibo de luz, agua o teléfono (max 3 meses)",
    requerido: true,
    icon: FileImage,
  },
  {
    id: "acta_nacimiento",
    nombre: "Acta de Nacimiento",
    descripcion: "Acta de nacimiento certificada",
    requerido: false,
    icon: ScrollText,
  },
  {
    id: "rfc",
    nombre: "Constancia RFC",
    descripcion: "Constancia de situación fiscal",
    requerido: true,
    icon: FileText,
  },
  {
    id: "nss",
    nombre: "NSS / IMSS",
    descripcion: "Número de Seguro Social",
    requerido: true,
    icon: Shield,
  },
];

export default function PortalDocumentos() {
  const { clienteId } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRequestSheet, setShowRequestSheet] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [showPersonalesFolder, setShowPersonalesFolder] = useState(false);
  const [showFolderView, setShowFolderView] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [selectedPersonalDocType, setSelectedPersonalDocType] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents
  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ["/api/portal/documentos"],
    queryFn: async () => {
      const res = await fetch("/api/portal/documentos", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json() as Promise<Document[]>;
    },
  });

  // Fetch available document types
  const { data: documentTypes } = useQuery({
    queryKey: ["/api/portal/documentos/tipos"],
    queryFn: async () => {
      const res = await fetch("/api/portal/documentos/tipos", {
        credentials: "include",
      });
      if (!res.ok) {
        return [
          {
            id: "constancia_laboral",
            nombre: "Constancia Laboral",
            descripcion: "Documento que acredita tu relación laboral",
            tiempoEstimado: "1-2 días hábiles",
          },
          {
            id: "constancia_ingresos",
            nombre: "Constancia de Ingresos",
            descripcion: "Documento con tu información salarial",
            tiempoEstimado: "1-2 días hábiles",
          },
          {
            id: "carta_recomendacion",
            nombre: "Carta de Recomendación",
            descripcion: "Carta oficial de recomendación laboral",
            tiempoEstimado: "3-5 días hábiles",
          },
          {
            id: "recibo_nomina",
            nombre: "Recibo de Nómina",
            descripcion: "Copia de tu recibo de nómina",
            tiempoEstimado: "Inmediato",
          },
        ] as DocumentType[];
      }
      return res.json() as Promise<DocumentType[]>;
    },
  });

  // Fetch personal documents
  const { data: personalDocs, refetch: refetchPersonalDocs } = useQuery({
    queryKey: ["/api/portal/documentos/personales"],
    queryFn: async () => {
      const res = await fetch("/api/portal/documentos/personales", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json() as Promise<Document[]>;
    },
  });

  // Upload personal document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ tipoDocumento, file }: { tipoDocumento: string; file: File }) => {
      const formData = new FormData();
      formData.append("tipoDocumento", tipoDocumento);
      formData.append("archivo", file);

      const res = await fetch("/api/portal/documentos/personales/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al subir documento");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Documento subido",
        description: "Tu documento ha sido guardado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/documentos/personales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/documentos"] });
      setShowUploadSheet(false);
      setSelectedPersonalDocType("");
      setUploadingFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Request document mutation
  const requestMutation = useMutation({
    mutationFn: async (tipoDocumento: string) => {
      const res = await fetch("/api/portal/documentos/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tipoDocumento }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al solicitar documento");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu documento será generado pronto",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/documentos"] });
      setShowRequestSheet(false);
      setSelectedDocType("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchPersonalDocs()]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo debe ser menor a 5MB",
          variant: "destructive",
        });
        return;
      }
      setUploadingFile(file);
    }
  };

  const handleUploadSubmit = () => {
    if (selectedPersonalDocType && uploadingFile) {
      uploadMutation.mutate({
        tipoDocumento: selectedPersonalDocType,
        file: uploadingFile,
      });
    }
  };

  const getPersonalDocStatus = (docTypeId: string) => {
    return personalDocs?.find((d) => d.tipo === docTypeId);
  };

  const handleFolderClick = (folderId: string) => {
    if (folderId === "personales") {
      setShowPersonalesFolder(true);
    } else {
      setSelectedFolder(folderId);
      setShowFolderView(true);
    }
  };

  const getFolderDocuments = (folderId: string) => {
    if (folderId === "otros") {
      return documents?.filter((d) => !d.categoria || d.categoria === "otros") || [];
    }
    return documents?.filter((d) => d.categoria === folderId) || [];
  };

  const getFolderInfo = (folderId: string) => {
    return folderCategories.find((f) => f.id === folderId);
  };

  const handleDownload = async (doc: Document) => {
    if (doc.urlDescarga) {
      window.open(doc.urlDescarga, "_blank");
    } else {
      window.open(`/api/portal/documentos/${doc.id}/download`, "_blank");
    }
  };

  // Calculate folder counts
  const folderCategories: FolderCategory[] = [
    {
      id: "contratos",
      nombre: "Contratos",
      icon: Folder,
      bgColor: "bg-blue-50",
      iconColor: "text-[#135bec]",
      count: documents?.filter((d) => d.categoria === "contratos").length || 0,
    },
    {
      id: "personales",
      nombre: "Personales",
      icon: Users,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      count: personalDocs?.length || 0,
      editable: true,
    },
    {
      id: "politicas",
      nombre: "Políticas",
      icon: Shield,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      count: documents?.filter((d) => d.categoria === "politicas").length || 0,
    },
    {
      id: "otros",
      nombre: "Otros",
      icon: FolderOpen,
      bgColor: "bg-gray-50",
      iconColor: "text-gray-500",
      count: documents?.filter((d) => !d.categoria || d.categoria === "otros").length || 0,
    },
  ];

  // Get recent documents (last 5)
  const recentDocuments = documents
    ?.filter((d) => d.estado === "generado")
    .slice(0, 5) || [];

  const getDocTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "constancia_laboral":
        return <FileText className="h-6 w-6 text-blue-600" />;
      case "constancia_ingresos":
        return <Receipt className="h-6 w-6 text-green-600" />;
      case "carta_recomendacion":
        return <ScrollText className="h-6 w-6 text-purple-600" />;
      case "recibo_nomina":
        return <FileText className="h-6 w-6 text-orange-600" />;
      default:
        return <File className="h-6 w-6 text-gray-600" />;
    }
  };

  const getDocTypeColor = (tipo: string) => {
    switch (tipo) {
      case "constancia_laboral":
        return "bg-blue-50";
      case "constancia_ingresos":
        return "bg-green-50";
      case "carta_recomendacion":
        return "bg-purple-50";
      case "recibo_nomina":
        return "bg-orange-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <PortalMobileLayout title="Centro de Documentos">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-[#f6f6f8] min-h-screen">
          {/* Action Panel */}
          <div className="p-4 w-full">
            <div className="flex flex-col items-start gap-4 rounded-xl border border-blue-100 bg-white p-5 shadow-sm relative overflow-hidden">
              {/* Decorative background blob */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#135bec]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col gap-1 z-10">
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck className="h-5 w-5 text-[#135bec]" />
                  <p className="text-sm font-bold uppercase tracking-wider text-[#135bec]">Solicitudes</p>
                </div>
                <p className="text-gray-900 text-lg font-bold leading-tight">¿Necesitas una carta?</p>
                <p className="text-gray-500 text-sm font-normal leading-relaxed">
                  Solicita cartas patronales, constancias laborales y otros documentos oficiales al instante.
                </p>
              </div>

              <Button
                onClick={() => setShowRequestSheet(true)}
                className="w-full h-10 bg-[#135bec] hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/20 z-10"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Solicitar Documento
              </Button>
            </div>
          </div>

          {/* Folders Section */}
          <div className="px-4 pt-2 pb-2 flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Mis Carpetas</h3>
            <button className="text-[#135bec] text-sm font-medium">Ver todo</button>
          </div>

          {/* Folder Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 pt-0">
            {folderCategories.map((folder) => (
              <div
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                className="flex flex-col gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-lg",
                      folder.bgColor
                    )}
                  >
                    <folder.icon className={cn("h-7 w-7", folder.iconColor)} />
                  </div>
                  {folder.editable && (
                    <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                      Editable
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-gray-900 text-base font-semibold leading-normal">
                    {folder.nombre}
                  </p>
                  <p className="text-gray-500 text-xs font-medium leading-normal">
                    {folder.count} archivo{folder.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Section */}
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Recientes</h3>
          </div>

          {/* Recent Files List */}
          <div className="flex flex-col px-4 gap-3 pb-24">
            {isLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </>
            ) : recentDocuments.length > 0 ? (
              recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => handleDownload(doc)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {doc.nombre || doc.tipoLabel}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(doc.fechaGeneracion), "d MMM", { locale: es })}
                      {doc.tamanio && <> • {doc.tamanio}</>}
                    </p>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc);
                    }}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No hay documentos</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Tus documentos recientes aparecerán aquí.
                </p>
              </div>
            )}

            {/* Pending Documents Alert */}
            {documents?.some((d) => d.estado === "pendiente") && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 shadow-sm mt-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">
                    Documentos en proceso
                  </p>
                  <p className="text-xs text-gray-500">
                    {documents.filter((d) => d.estado === "pendiente").length} documento(s) siendo generado(s)
                  </p>
                </div>
                <Badge className="bg-amber-200 text-amber-700 hover:bg-amber-200 border-0">
                  {documents.filter((d) => d.estado === "pendiente").length}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* Request Document Bottom Sheet */}
      <BottomSheet
        isOpen={showRequestSheet}
        onClose={() => {
          setShowRequestSheet(false);
          setSelectedDocType("");
        }}
        title="Solicitar Documento"
        height="auto"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Selecciona el tipo de documento que necesitas:
          </p>

          <div className="space-y-2">
            {documentTypes?.map((type) => (
              <button
                type="button"
                key={type.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98] w-full text-left",
                  selectedDocType === type.id
                    ? "border-[#135bec] bg-blue-50"
                    : "border-gray-100 bg-white hover:bg-gray-50"
                )}
                onClick={() => setSelectedDocType(type.id)}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    getDocTypeColor(type.id)
                  )}
                >
                  {getDocTypeIcon(type.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {type.nombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {type.descripcion}
                  </p>
                  <p className="text-xs text-[#135bec] mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {type.tiempoEstimado}
                  </p>
                </div>
                {selectedDocType === type.id && (
                  <CheckCircle className="h-5 w-5 text-[#135bec] shrink-0" />
                )}
              </button>
            ))}
          </div>

          <Button
            type="button"
            className="w-full h-12 bg-[#135bec] hover:bg-[#0f4ed8] text-white"
            disabled={!selectedDocType || requestMutation.isPending}
            onClick={() => requestMutation.mutate(selectedDocType)}
          >
            {requestMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Solicitando...
              </>
            ) : (
              "Solicitar documento"
            )}
          </Button>
        </div>
      </BottomSheet>

      {/* Personales Folder Bottom Sheet */}
      <BottomSheet
        isOpen={showPersonalesFolder}
        onClose={() => setShowPersonalesFolder(false)}
        title="Documentos Personales"
        height="full"
      >
        <div className="flex flex-col h-full">
          {/* Header info */}
          <div className="bg-purple-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-purple-800">
              Sube tus documentos personales para mantener tu expediente actualizado.
              Los documentos marcados con <span className="text-red-500">*</span> son requeridos.
            </p>
          </div>

          {/* Document list */}
          <div className="flex-1 space-y-3 overflow-y-auto pb-20">
            {personalDocTypes.map((docType) => {
              const existingDoc = getPersonalDocStatus(docType.id);
              const DocIcon = docType.icon;

              return (
                <div
                  key={docType.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border transition-all",
                    existingDoc
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-100"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                      existingDoc ? "bg-green-100" : "bg-gray-100"
                    )}
                  >
                    {existingDoc ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <DocIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {docType.nombre}
                      </p>
                      {docType.requerido && !existingDoc && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {existingDoc
                        ? `Subido: ${format(new Date(existingDoc.fechaGeneracion), "d MMM yyyy", { locale: es })}`
                        : docType.descripcion}
                    </p>
                  </div>

                  {existingDoc ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(existingDoc)}
                        className="p-2 text-[#135bec] hover:text-[#135bec]/80 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver documento"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(existingDoc)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-purple-200 text-purple-600 hover:bg-purple-50"
                      onClick={() => {
                        setSelectedPersonalDocType(docType.id);
                        setShowUploadSheet(true);
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Subir
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress indicator */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso</span>
              <span className="text-sm font-bold text-purple-600">
                {personalDocs?.length || 0} / {personalDocTypes.length}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{
                  width: `${((personalDocs?.length || 0) / personalDocTypes.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Upload Document Bottom Sheet */}
      <BottomSheet
        isOpen={showUploadSheet}
        onClose={() => {
          setShowUploadSheet(false);
          setSelectedPersonalDocType("");
          setUploadingFile(null);
        }}
        title={`Subir ${personalDocTypes.find((d) => d.id === selectedPersonalDocType)?.nombre || "Documento"}`}
        height="auto"
      >
        <div className="space-y-4">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload options */}
          {!uploadingFile ? (
            <div className="space-y-3">
              {/* Two action buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Take Photo button */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-100/50 transition-all active:scale-[0.98]"
                >
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                    <Camera className="h-7 w-7 text-purple-600" />
                  </div>
                  <span className="font-semibold text-sm text-purple-700">
                    Tomar Foto
                  </span>
                </button>

                {/* Select File button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-100/50 transition-all active:scale-[0.98]"
                >
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                    <FolderOpen className="h-7 w-7 text-gray-600" />
                  </div>
                  <span className="font-semibold text-sm text-gray-700">
                    Seleccionar Archivo
                  </span>
                </button>
              </div>

              <p className="text-xs text-center text-gray-500">
                PDF o imagen, máximo 5MB
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  {uploadingFile.type.startsWith("image/") ? (
                    <Image className="h-6 w-6 text-purple-600" />
                  ) : (
                    <FileText className="h-6 w-6 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {uploadingFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadingFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setUploadingFile(null)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!uploadingFile || uploadMutation.isPending}
            onClick={handleUploadSubmit}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir documento
              </>
            )}
          </Button>
        </div>
      </BottomSheet>

      {/* Generic Folder View Bottom Sheet */}
      <BottomSheet
        isOpen={showFolderView}
        onClose={() => {
          setShowFolderView(false);
          setSelectedFolder("");
        }}
        title={getFolderInfo(selectedFolder)?.nombre || "Carpeta"}
        height="full"
      >
        <div className="flex flex-col h-full pb-6">
          {(() => {
            const folderDocs = getFolderDocuments(selectedFolder);
            const folderInfo = getFolderInfo(selectedFolder);

            if (folderDocs.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center flex-1 py-12 px-4 text-center">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center mb-4",
                      folderInfo?.bgColor || "bg-gray-100"
                    )}
                  >
                    {folderInfo?.icon && (
                      <folderInfo.icon
                        className={cn("h-10 w-10", folderInfo?.iconColor || "text-gray-400")}
                      />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Carpeta vacía</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    No hay documentos en esta carpeta.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {folderDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        folderInfo?.bgColor || "bg-gray-100"
                      )}
                    >
                      <FileText
                        className={cn("h-6 w-6", folderInfo?.iconColor || "text-gray-600")}
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {doc.nombre || doc.tipoLabel}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(doc.fechaGeneracion), "d MMM yyyy", { locale: es })}
                        {doc.tamanio && <> • {doc.tamanio}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-[#135bec] hover:text-[#135bec]/80 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver documento"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </BottomSheet>
    </PortalMobileLayout>
  );
}
