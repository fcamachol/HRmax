import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  FileImage,
  File,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DocumentoEmpleado } from "./EmployeeDocumentManager";

interface DocumentGridProps {
  documents: DocumentoEmpleado[];
  viewMode: "grid" | "list";
  selectedDocuments: Set<string>;
  onDocumentSelect: (documentId: string, selected: boolean) => void;
  onDocumentPreview: (document: DocumentoEmpleado) => void;
  onDocumentDelete?: (documentId: string) => void;
  empleadoId: string;
}

function getFileIcon(archivoTipo: string | null, className?: string) {
  if (!archivoTipo) {
    return <File className={className} />;
  }
  if (archivoTipo.startsWith("image/")) {
    return <FileImage className={cn(className, "text-green-500")} />;
  }
  if (archivoTipo === "application/pdf") {
    return <FileText className={cn(className, "text-red-500")} />;
  }
  return <File className={className} />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentCard({
  document,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
  empleadoId,
}: {
  document: DocumentoEmpleado;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onPreview: () => void;
  onDelete?: () => void;
  empleadoId: string;
}) {
  const handleDownload = () => {
    window.open(`/api/employees/${empleadoId}/documentos/${document.id}/download`, "_blank");
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center p-4 rounded-lg border transition-all cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
      onClick={onPreview}
    >
      {/* Selection checkbox */}
      <div
        className={cn(
          "absolute top-2 left-2 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </div>

      {/* Actions menu */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Ver documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* File icon */}
      <div className="w-16 h-16 flex items-center justify-center mb-3">
        {getFileIcon(document.archivoTipo, "h-12 w-12")}
      </div>

      {/* File name */}
      <p className="text-sm font-medium text-center line-clamp-2 w-full">{document.nombre}</p>

      {/* File info */}
      <p className="text-xs text-muted-foreground mt-1">
        {format(new Date(document.createdAt), "d MMM yyyy", { locale: es })}
        {document.archivoTamano && ` • ${formatFileSize(document.archivoTamano)}`}
      </p>
    </div>
  );
}

function DocumentRow({
  document,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
  empleadoId,
}: {
  document: DocumentoEmpleado;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onPreview: () => void;
  onDelete?: () => void;
  empleadoId: string;
}) {
  const handleDownload = () => {
    window.open(`/api/employees/${empleadoId}/documentos/${document.id}/download`, "_blank");
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer",
        isSelected
          ? "bg-primary/5 ring-1 ring-primary"
          : "hover:bg-muted/50"
      )}
      onClick={onPreview}
    >
      {/* Selection checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </div>

      {/* File icon */}
      {getFileIcon(document.archivoTipo, "h-5 w-5 flex-shrink-0")}

      {/* File name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{document.nombre}</p>
        {document.descripcion && (
          <p className="text-xs text-muted-foreground truncate">{document.descripcion}</p>
        )}
      </div>

      {/* File size */}
      <span className="text-xs text-muted-foreground w-20 text-right">
        {formatFileSize(document.archivoTamano)}
      </span>

      {/* Date */}
      <span className="text-xs text-muted-foreground w-24">
        {format(new Date(document.createdAt), "d MMM yyyy", { locale: es })}
      </span>

      {/* Actions */}
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function DocumentGrid({
  documents,
  viewMode,
  selectedDocuments,
  onDocumentSelect,
  onDocumentPreview,
  onDocumentDelete,
  empleadoId,
}: DocumentGridProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">Carpeta vacia</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No hay documentos en esta carpeta. Sube un documento para comenzar.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-1">
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            isSelected={selectedDocuments.has(doc.id)}
            onSelect={(selected) => onDocumentSelect(doc.id, selected)}
            onPreview={() => onDocumentPreview(doc)}
            onDelete={onDocumentDelete ? () => onDocumentDelete(doc.id) : undefined}
            empleadoId={empleadoId}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          isSelected={selectedDocuments.has(doc.id)}
          onSelect={(selected) => onDocumentSelect(doc.id, selected)}
          onPreview={() => onDocumentPreview(doc)}
          onDelete={onDocumentDelete ? () => onDocumentDelete(doc.id) : undefined}
          empleadoId={empleadoId}
        />
      ))}
    </div>
  );
}
