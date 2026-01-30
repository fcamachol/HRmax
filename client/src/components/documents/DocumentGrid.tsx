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
  FileSpreadsheet,
  File,
  MoreHorizontal,
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
  selectedDocuments: Set<string>;
  onDocumentSelect: (documentId: string, selected: boolean) => void;
  onDocumentPreview: (document: DocumentoEmpleado) => void;
  onDocumentDelete?: (documentId: string) => void;
  empleadoId: string;
}

function getFileIcon(archivoTipo: string | null, className?: string) {
  if (!archivoTipo) {
    return <File className={cn(className, "text-muted-foreground")} />;
  }
  if (archivoTipo.startsWith("image/")) {
    return <FileImage className={cn(className, "text-green-600")} />;
  }
  if (archivoTipo === "application/pdf") {
    return <FileText className={cn(className, "text-red-600")} />;
  }
  if (
    archivoTipo.includes("spreadsheet") ||
    archivoTipo.includes("excel") ||
    archivoTipo === "application/vnd.ms-excel"
  ) {
    return <FileSpreadsheet className={cn(className, "text-emerald-600")} />;
  }
  if (archivoTipo.includes("word") || archivoTipo.includes("document")) {
    return <FileText className={cn(className, "text-blue-600")} />;
  }
  return <File className={cn(className, "text-muted-foreground")} />;
}

function DocumentListRow({
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
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/employees/${empleadoId}/documentos/${document.id}/download`, "_blank");
  };

  return (
    <div
      className={cn(
        "group flex items-center h-10 px-3 text-sm cursor-pointer transition-colors",
        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
      )}
      onClick={onPreview}
    >
      {/* Checkbox */}
      <div
        className="w-7 flex-shrink-0 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className={cn(
            "transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        />
      </div>

      {/* Icon + Name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {getFileIcon(document.archivoTipo, "h-4 w-4 flex-shrink-0")}
        <span className="truncate">{document.nombre}</span>
      </div>

      {/* Date */}
      <div className="w-24 flex-shrink-0 text-muted-foreground text-xs text-right pr-2 hidden sm:block">
        {format(new Date(document.createdAt), "d MMM yyyy", { locale: es })}
      </div>

      {/* Actions - visible on hover */}
      <div
        className="w-16 flex-shrink-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleDownload}
          title="Descargar"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
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
    </div>
  );
}

export function DocumentGrid({
  documents,
  selectedDocuments,
  onDocumentSelect,
  onDocumentPreview,
  onDocumentDelete,
  empleadoId,
}: DocumentGridProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Carpeta vacia
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          No hay documentos aqui
        </p>
      </div>
    );
  }

  return (
    <div>
      {documents.map((doc) => (
        <DocumentListRow
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
