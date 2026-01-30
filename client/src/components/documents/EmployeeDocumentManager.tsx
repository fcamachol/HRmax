import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentGrid } from "./DocumentGrid";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentPreview } from "./DocumentPreview";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Loader2,
  Folder,
  ChevronDown,
  FolderOpen,
} from "lucide-react";

export interface CarpetaEmpleado {
  id: string;
  clienteId: string;
  empleadoId: string;
  nombre: string;
  parentId: string | null;
  tipo: "system" | "custom";
  icono: string | null;
  color: string | null;
  visibleParaEmpleado: boolean;
  orden: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentoEmpleado {
  id: string;
  clienteId: string;
  empresaId: string | null;
  empleadoId: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  tipoDocumento: string | null;
  archivoUrl: string;
  archivoNombre: string;
  archivoTipo: string | null;
  archivoTamano: number | null;
  visibleParaEmpleado: boolean;
  subidoPorEmpleado: boolean;
  carpetaId: string | null;
  subidoPor: string | null;
  fechaVencimiento: string | null;
  estatus: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeDocumentManagerProps {
  empleadoId: string;
  empleadoNombre?: string;
  readOnly?: boolean;
}

export function EmployeeDocumentManager({
  empleadoId,
  readOnly = false,
}: EmployeeDocumentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [previewDocument, setPreviewDocument] = useState<DocumentoEmpleado | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  // Fetch folders
  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ["/api/employees", empleadoId, "carpetas"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empleadoId}/carpetas`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load folders");
      return res.json() as Promise<CarpetaEmpleado[]>;
    },
  });

  // Fetch documents
  const { data: documents = [], isLoading: loadingDocuments, refetch: refetchDocuments } = useQuery({
    queryKey: ["/api/employees", empleadoId, "documentos", { carpetaId: currentFolderId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFolderId) {
        params.set("carpetaId", currentFolderId);
      } else {
        params.set("carpetaId", "root");
      }
      const res = await fetch(`/api/employees/${empleadoId}/documentos?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load documents");
      return res.json() as Promise<DocumentoEmpleado[]>;
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetch(`/api/employees/${empleadoId}/documentos/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete document");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", empleadoId, "documentos"] });
      setSelectedDocuments(new Set());
      toast({ title: "Documento eliminado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFolderSelect = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedDocuments(new Set());
  }, []);

  const handleDocumentSelect = useCallback((documentId: string, selected: boolean) => {
    setSelectedDocuments((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(documentId);
      } else {
        next.delete(documentId);
      }
      return next;
    });
  }, []);

  const handleUploadComplete = useCallback(() => {
    refetchDocuments();
    setShowUploader(false);
    toast({ title: "Documento subido correctamente" });
  }, [refetchDocuments, toast]);

  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  const isLoading = loadingFolders || loadingDocuments;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        {/* Folder selector dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 font-medium">
              {currentFolder ? (
                <Folder className="h-4 w-4 text-blue-500" />
              ) : (
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              )}
              {currentFolder?.nombre || "Todos los documentos"}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => handleFolderSelect(null)}
              className={!currentFolderId ? "bg-accent" : ""}
            >
              <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              Todos los documentos
            </DropdownMenuItem>
            {folders.map((folder) => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => handleFolderSelect(folder.id)}
                className={currentFolderId === folder.id ? "bg-accent" : ""}
              >
                <Folder className="h-4 w-4 mr-2 text-blue-500" />
                {folder.nombre}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Upload button */}
        {!readOnly && (
          <Button size="sm" onClick={() => setShowUploader(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Subir
          </Button>
        )}
      </div>

      {/* Document list - scrollable */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DocumentGrid
            documents={documents}
            selectedDocuments={selectedDocuments}
            onDocumentSelect={handleDocumentSelect}
            onDocumentPreview={(doc) => setPreviewDocument(doc)}
            onDocumentDelete={readOnly ? undefined : (id) => deleteDocumentMutation.mutate(id)}
            empleadoId={empleadoId}
          />
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          empleadoId={empleadoId}
          onClose={() => setPreviewDocument(null)}
        />
      )}

      {/* Upload Dialog */}
      <DocumentUploader
        open={showUploader}
        onOpenChange={setShowUploader}
        empleadoId={empleadoId}
        carpetaId={currentFolderId}
        carpetaNombre={currentFolder?.nombre}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
