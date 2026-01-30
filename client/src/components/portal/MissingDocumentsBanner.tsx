import { FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentoFaltante {
  tipo: string;
  nombre: string;
  descripcion: string;
  requerido: boolean;
}

interface MissingDocumentsBannerProps {
  documentosFaltantes: DocumentoFaltante[];
  onNavigate: () => void;
}

export function MissingDocumentsBanner({
  documentosFaltantes,
  onNavigate
}: MissingDocumentsBannerProps) {
  if (!documentosFaltantes || documentosFaltantes.length === 0) return null;

  return (
    <div
      className={cn(
        "mx-4 mt-4 p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md",
        "bg-rose-50 border-rose-200 hover:bg-rose-100"
      )}
      onClick={onNavigate}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-rose-100">
          <FileText className="h-5 w-5 text-rose-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            {documentosFaltantes.length} documento{documentosFaltantes.length > 1 ? "s" : ""} faltante{documentosFaltantes.length > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-gray-600 truncate">
            {documentosFaltantes.length === 1
              ? documentosFaltantes[0].nombre
              : "Sube tus documentos personales requeridos"
            }
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 text-rose-700 hover:text-rose-800 hover:bg-rose-100"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
        >
          Subir
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
