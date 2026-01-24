import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, ChevronRight, Calendar, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { cn } from "@/lib/utils";

interface Recibo {
  id: string;
  periodo: string;
  fechaPago: string;
  totalPercepciones: number;
  totalDeducciones: number;
  neto: number;
  pdfUrl?: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

function ReciboCard({
  recibo,
  onClick,
}: {
  recibo: Recibo;
  onClick: () => void;
}) {
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98] touch-manipulation"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{recibo.periodo}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(recibo.fechaPago).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-sm font-mono">
              ${recibo.neto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Neto</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function ReciboDetail({
  recibo,
  onClose,
}: {
  recibo: Recibo | null;
  onClose: () => void;
}) {
  if (!recibo) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <p className="text-sm text-muted-foreground">Periodo</p>
        <p className="text-xl font-semibold mt-1">{recibo.periodo}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Pagado el{" "}
          {new Date(recibo.fechaPago).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">
              Percepciones
            </p>
            <p className="font-semibold text-sm font-mono text-green-700 dark:text-green-400">
              ${recibo.totalPercepciones.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">
              Deducciones
            </p>
            <p className="font-semibold text-sm font-mono text-red-700 dark:text-red-400">
              ${recibo.totalDeducciones.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Neto</p>
            <p className="font-bold text-sm font-mono text-primary">
              ${recibo.neto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Download Button */}
      <Button className="w-full h-12" size="lg">
        <Download className="h-5 w-5 mr-2" />
        Descargar PDF
      </Button>

      {/* Note */}
      <p className="text-xs text-center text-muted-foreground">
        El detalle completo de percepciones y deducciones está disponible en el
        PDF
      </p>
    </div>
  );
}

export default function PortalRecibos() {
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedRecibo, setSelectedRecibo] = useState<Recibo | null>(null);

  const { data: recibos, isLoading, refetch } = useQuery({
    queryKey: ["/api/portal/recibos", selectedYear],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const mockData: Recibo[] = [];
      return mockData;
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PortalMobileLayout title="Recibos de Nómina">
      {/* Year Filter */}
      <div className="px-4 pt-3 pb-2 border-b bg-background sticky top-14 z-30">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !recibos?.length ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Sin recibos</p>
            <p className="text-sm text-muted-foreground mt-1">
              No hay recibos de nómina disponibles para {selectedYear}
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {recibos.map((recibo) => (
              <ReciboCard
                key={recibo.id}
                recibo={recibo}
                onClick={() => setSelectedRecibo(recibo)}
              />
            ))}
          </div>
        )}
      </PullToRefresh>

      {/* Recibo Detail Sheet */}
      <BottomSheet
        isOpen={!!selectedRecibo}
        onClose={() => setSelectedRecibo(null)}
        title="Detalle del recibo"
        height="auto"
      >
        <ReciboDetail recibo={selectedRecibo} onClose={() => setSelectedRecibo(null)} />
      </BottomSheet>
    </PortalMobileLayout>
  );
}
