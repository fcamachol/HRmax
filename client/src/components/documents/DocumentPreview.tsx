import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, X, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DocumentoEmpleado } from "./EmployeeDocumentManager";

interface DocumentPreviewProps {
  document: DocumentoEmpleado;
  empleadoId: string;
  onClose: () => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Desconocido";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentPreview({ document, empleadoId, onClose }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const downloadUrl = `/api/employees/${empleadoId}/documentos/${document.id}/download`;
  const isPdf = document.archivoTipo === "application/pdf";
  const isImage = document.archivoTipo?.startsWith("image/");

  const handleDownload = () => {
    window.open(downloadUrl, "_blank");
  };

  const handleOpenInNewTab = () => {
    window.open(downloadUrl, "_blank");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{document.nombre}</DialogTitle>
              {document.descripcion && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {document.descripcion}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>

          {/* Document info badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="outline">{document.categoria}</Badge>
            {document.archivoTipo && (
              <Badge variant="secondary">{document.archivoTipo.split("/")[1]?.toUpperCase()}</Badge>
            )}
            <Badge variant="secondary">{formatFileSize(document.archivoTamano)}</Badge>
            <span className="text-xs text-muted-foreground">
              Subido el {format(new Date(document.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
            {document.visibleParaEmpleado ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Visible en portal
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Solo HR
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden bg-muted/30 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No se puede previsualizar este documento
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Descargalo para verlo en tu dispositivo
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar documento
              </Button>
            </div>
          ) : isPdf ? (
            <iframe
              src={downloadUrl}
              className="w-full h-full border-0"
              title={document.nombre}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={downloadUrl}
                alt={document.nombre}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Vista previa no disponible
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Este tipo de archivo no se puede previsualizar. Descargalo para verlo.
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar {document.archivoNombre}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
