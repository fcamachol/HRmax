import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, ChevronRight, Calendar, FileDown, FileCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { cn } from "@/lib/utils";
import { format, addDays, nextFriday } from "date-fns";
import { es } from "date-fns/locale";

interface Recibo {
  id: string;
  periodo: string;
  fechaPago: string;
  totalPercepciones: number;
  totalDeducciones: number;
  neto: number;
  pdfUrl?: string;
  xmlUrl?: string;
  status?: "pagado" | "pendiente";
}

interface ProximoPago {
  fecha: string;
  monto: number;
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
  const handleDownloadPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (recibo.pdfUrl) {
      window.open(recibo.pdfUrl, "_blank");
    }
  };

  const handleDownloadXML = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (recibo.xmlUrl) {
      window.open(recibo.xmlUrl, "_blank");
    }
  };

  return (
    <Card
      className="overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all active:scale-[0.98] touch-manipulation"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-sm text-gray-900 truncate">{recibo.periodo}</p>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 py-0">
                Pagado
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              {new Date(recibo.fechaPago).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="font-bold text-base font-mono text-gray-900 mt-1">
              ${recibo.neto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={handleDownloadPDF}
          >
            <FileDown className="h-3.5 w-3.5 mr-1" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={handleDownloadXML}
          >
            <FileCode className="h-3.5 w-3.5 mr-1" />
            XML
          </Button>
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
      const res = await fetch(`/api/portal/recibos?year=${selectedYear}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Get next payment info (estimated)
  const getNextPaymentDate = () => {
    const today = new Date();
    // Assuming bi-weekly pay on Fridays - get next Friday after 15 days
    const nextPay = nextFriday(addDays(today, 1));
    return nextPay;
  };

  const nextPaymentDate = getNextPaymentDate();
  const formattedNextPayment = format(nextPaymentDate, "EEE, d 'de' MMMM", { locale: es });

  // Get last neto for estimation
  const lastNeto = recibos?.[0]?.neto || 0;

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PortalMobileLayout title="Mi Nómina">
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="bg-[#f6f6f8] min-h-screen">
          {/* Upcoming Payment Card */}
          <div className="px-4 pt-4 pb-2">
            <Card className="bg-gradient-to-br from-[#135bec] to-blue-600 text-white border-0 overflow-hidden shadow-lg">
              <CardContent className="p-5">
                <p className="text-sm text-white/80">Próximo pago</p>
                <p className="text-3xl font-bold mt-1">
                  ${lastNeto > 0 ? lastNeto.toLocaleString("es-MX", { minimumFractionDigits: 2 }) : "---"} MXN
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4 text-white/70" />
                  <p className="text-sm text-white/80 capitalize">{formattedNextPayment}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
                >
                  Ver detalles
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Year Tabs */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Historial de Recibos</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year.toString())}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    selectedYear === year.toString()
                      ? "bg-[#135bec] text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Receipt List */}
          {isLoading ? (
            <div className="space-y-3 px-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-11 h-11 rounded-xl" />
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
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900">Sin recibos</p>
              <p className="text-sm text-gray-500 mt-1">
                No hay recibos de nómina disponibles para {selectedYear}
              </p>
            </div>
          ) : (
            <div className="space-y-3 px-4 pb-24">
              {recibos.map((recibo: Recibo) => (
                <ReciboCard
                  key={recibo.id}
                  recibo={recibo}
                  onClick={() => setSelectedRecibo(recibo)}
                />
              ))}
            </div>
          )}
        </div>
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
