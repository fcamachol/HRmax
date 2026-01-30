import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderTree } from "./FolderTree";
import { DocumentGrid } from "./DocumentGrid";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentPreview } from "./DocumentPreview";
import { FolderBreadcrumb } from "./FolderBreadcrumb";
import { BulkActionBar } from "./BulkActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Upload,
  Grid3X3,
  List,
  Loader2,
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
  empleadoNombre,
  readOnly = false,
}: EmployeeDocumentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
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

  // Search documents
  const { data: searchResults = [], isFetching: isSearchFetching } = useQuery({
    queryKey: ["/api/employees", empleadoId, "documentos", "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(
        `/api/employees/${empleadoId}/documentos/search?q=${encodeURIComponent(searchQuery)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<DocumentoEmpleado[]>;
    },
    enabled: searchQuery.length > 2 && isSearching,
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const res = await fetch(`/api/employees/${empleadoId}/carpetas/${folderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete folder");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", empleadoId, "carpetas"] });
      if (currentFolderId) setCurrentFolderId(null);
      toast({ title: "Carpeta eliminada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  // Move documents mutation
  const moveDocumentsMutation = useMutation({
    mutationFn: async ({ documentoIds, carpetaId }: { documentoIds: string[]; carpetaId: string | null }) => {
      const res = await fetch(`/api/employees/${empleadoId}/documentos/bulk-move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          documentoIds,
          carpetaId: carpetaId || "root",
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to move documents");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", empleadoId, "documentos"] });
      setSelectedDocuments(new Set());
      toast({ title: "Documentos movidos" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFolderSelect = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedDocuments(new Set());
    setIsSearching(false);
    setSearchQuery("");
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

  const handleSelectAll = useCallback(() => {
    const displayedDocs = isSearching && searchQuery ? searchResults : documents;
    if (selectedDocuments.size === displayedDocs.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(displayedDocs.map((d) => d.id)));
    }
  }, [isSearching, searchQuery, searchResults, documents, selectedDocuments]);

  const handleUploadComplete = useCallback(() => {
    refetchDocuments();
    setShowUploader(false);
    toast({ title: "Documento subido correctamente" });
  }, [refetchDocuments, toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 2) {
      setIsSearching(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  const displayedDocuments = isSearching && searchQuery ? searchResults : documents;
  const isLoading = loadingFolders || loadingDocuments || isSearchFetching;

  // Build breadcrumb path
  const getBreadcrumbPath = (): CarpetaEmpleado[] => {
    const path: CarpetaEmpleado[] = [];
    let current = currentFolder;
    while (current) {
      path.unshift(current);
      current = current.parentId ? folders.find((f) => f.id === current?.parentId) : null;
    }
    return path;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {isSearching && (
              <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                Limpiar
              </Button>
            )}
          </form>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {!readOnly && (
            <Button size="sm" onClick={() => setShowUploader(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir documento
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folder Tree */}
        <div className="w-64 border-r bg-muted/20 overflow-y-auto">
          <FolderTree
            folders={folders}
            currentFolderId={currentFolderId}
            onFolderSelect={handleFolderSelect}
            onFolderDelete={readOnly ? undefined : (id) => deleteFolderMutation.mutate(id)}
            onMoveDocuments={
              readOnly || selectedDocuments.size === 0
                ? undefined
                : (targetFolderId) => {
                    moveDocumentsMutation.mutate({
                      documentoIds: Array.from(selectedDocuments),
                      carpetaId: targetFolderId,
                    });
                  }
            }
            hasSelectedDocuments={selectedDocuments.size > 0}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          <div className="px-4 py-2 border-b bg-background">
            <FolderBreadcrumb
              path={getBreadcrumbPath()}
              onNavigate={handleFolderSelect}
              isSearching={isSearching}
              searchQuery={searchQuery}
            />
          </div>

          {/* Bulk action bar */}
          {selectedDocuments.size > 0 && !readOnly && (
            <BulkActionBar
              selectedCount={selectedDocuments.size}
              totalCount={displayedDocuments.length}
              onSelectAll={handleSelectAll}
              onClearSelection={() => setSelectedDocuments(new Set())}
              onDelete={() => {
                selectedDocuments.forEach((id) => deleteDocumentMutation.mutate(id));
              }}
              folders={folders.filter((f) => f.id !== currentFolderId)}
              onMoveToFolder={(folderId) =>
                moveDocumentsMutation.mutate({
                  documentoIds: Array.from(selectedDocuments),
                  carpetaId: folderId,
                })
              }
            />
          )}

          {/* Document grid/list */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DocumentGrid
                documents={displayedDocuments}
                viewMode={viewMode}
                selectedDocuments={selectedDocuments}
                onDocumentSelect={handleDocumentSelect}
                onDocumentPreview={(doc) => setPreviewDocument(doc)}
                onDocumentDelete={readOnly ? undefined : (id) => deleteDocumentMutation.mutate(id)}
                empleadoId={empleadoId}
              />
            )}
          </div>
        </div>
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
