import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Download, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import type { LayoutGenerado } from "@shared/schema";

interface LayoutsDownloadProps {
  nominaId: string;
  nominaStatus: string;
  onLayoutsGenerated?: (layouts: LayoutGenerado[]) => void;
}

export function LayoutsDownload({ nominaId, nominaStatus, onLayoutsGenerated }: LayoutsDownloadProps) {
  const { toast } = useToast();

  const { data: layouts = [], isLoading, refetch } = useQuery<LayoutGenerado[]>({
    queryKey: ["/api/nominas", nominaId, "layouts"],
    enabled: !!nominaId,
  });

  const generateLayoutsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        `/api/nominas/${nominaId}/generar-layouts`,
        "POST",
        {}
      );
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/nominas", nominaId, "layouts"] });
      toast({
        title: "Layouts generados",
        description: `Se generaron ${data.layouts?.length || 0} layout(s) correctamente`,
      });
      if (onLayoutsGenerated && data.layouts) {
        onLayoutsGenerated(data.layouts);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron generar los layouts",
      });
    },
  });

  const handleDownload = async (layoutId: string, nombreArchivo: string) => {
    try {
      const response = await fetch(`/api/layouts/${layoutId}/download`);
      if (!response.ok) {
        throw new Error("Error al descargar el archivo");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Descarga exitosa",
        description: `El archivo ${nombreArchivo} se descargó correctamente`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de descarga",
        description: error.message || "No se pudo descargar el archivo",
      });
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(num);
  };

  const canGenerateLayouts = nominaStatus === "approved";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Cargando layouts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Layouts de Dispersión
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-layouts"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canGenerateLayouts && (
            <Button
              size="sm"
              onClick={() => generateLayoutsMutation.mutate()}
              disabled={generateLayoutsMutation.isPending}
              data-testid="button-generate-layouts"
            >
              {generateLayoutsMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Regenerar Layouts
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!canGenerateLayouts && layouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Los layouts se generan automáticamente cuando la nómina es aprobada.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Estado actual: <Badge variant="secondary">{nominaStatus}</Badge>
            </p>
          </div>
        ) : layouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No hay layouts generados para esta nómina.
            </p>
            {canGenerateLayouts && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => generateLayoutsMutation.mutate()}
                disabled={generateLayoutsMutation.isPending}
                data-testid="button-generate-layouts-empty"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Generar Layouts
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {layouts.map((layout) => (
              <div
                key={layout.id}
                className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                data-testid={`layout-item-${layout.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{layout.nombreArchivo}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {layout.totalRegistros} registros
                      </span>
                      <span>•</span>
                      <span>{formatCurrency(layout.totalMonto)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(layout.id, layout.nombreArchivo)}
                  data-testid={`button-download-layout-${layout.id}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total layouts:</span>
                <span className="font-medium">{layouts.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Total registros:</span>
                <span className="font-medium">
                  {layouts.reduce((sum, l) => sum + l.totalRegistros, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Monto total:</span>
                <span className="font-medium">
                  {formatCurrency(
                    layouts.reduce((sum, l) => sum + parseFloat(String(l.totalMonto)), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
