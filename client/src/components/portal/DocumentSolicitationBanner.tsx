import { FileWarning, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SolicitudDocumentoRH {
  id: string;
  tipoDocumento: string;
  nombreDocumento: string;
  descripcion?: string | null;
  prioridad: string | null;
  fechaLimite?: string | null;
}

interface DocumentSolicitationBannerProps {
  solicitudes: SolicitudDocumentoRH[];
  onNavigate: () => void;
}

export function DocumentSolicitationBanner({
  solicitudes,
  onNavigate
}: DocumentSolicitationBannerProps) {
  if (!solicitudes || solicitudes.length === 0) return null;

  const hasUrgent = solicitudes.some(s => s.prioridad === "urgente");
  const hasHigh = solicitudes.some(s => s.prioridad === "alta");
  const isHighPriority = hasUrgent || hasHigh;

  return (
    <div
      className={cn(
        "mx-4 mt-4 p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md",
        isHighPriority
          ? "bg-red-50 border-red-200 hover:bg-red-100"
          : "bg-amber-50 border-amber-200 hover:bg-amber-100"
      )}
      onClick={onNavigate}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          isHighPriority ? "bg-red-100" : "bg-amber-100"
        )}>
          <FileWarning className={cn(
            "h-5 w-5",
            isHighPriority ? "text-red-600" : "text-amber-600"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            {solicitudes.length} documento{solicitudes.length > 1 ? "s" : ""} solicitado{solicitudes.length > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-gray-600 truncate">
            {solicitudes.length === 1
              ? solicitudes[0].nombreDocumento
              : "RH requiere que subas documentos"
            }
          </p>
          {hasUrgent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
              Urgente
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex-shrink-0",
            isHighPriority
              ? "text-red-700 hover:text-red-800 hover:bg-red-100"
              : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
        >
          Ver
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
