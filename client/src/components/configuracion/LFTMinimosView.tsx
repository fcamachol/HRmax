import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Scale, CalendarDays, Gift, Percent, Info, Sun } from "lucide-react";

interface EsquemaPresta {
  id: string;
  nombre: string;
  descripcion: string | null;
  esLey: boolean;
  activo: boolean;
}

interface EsquemaVacaciones {
  id: string;
  esquemaId: string;
  aniosAntiguedad: number;
  diasVacaciones: number;
  activo?: boolean;
}

interface TipoBeneficio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  unidad: string;
  valorMinimoLegal: string | null;
  orden: number;
  activo: boolean;
}

interface EsquemaBeneficio {
  id: string;
  esquemaId: string;
  tipoBeneficioId: string;
  valor: string;
  activo: boolean;
}

export function LFTMinimosView() {
  const { data: esquemas, isLoading: loadingEsquemas } = useQuery<EsquemaPresta[]>({
    queryKey: ["/api/esquemas-prestaciones"],
  });

  const { data: tiposBeneficio } = useQuery<TipoBeneficio[]>({
    queryKey: ["/api/tipos-beneficio"],
  });

  const esquemaLFT = esquemas?.find(e => e.esLey);

  const { data: vacaciones, isLoading: loadingVacaciones } = useQuery<EsquemaVacaciones[]>({
    queryKey: ["/api/esquemas-prestaciones", esquemaLFT?.id, "vacaciones"],
    enabled: !!esquemaLFT?.id,
  });

  const { data: beneficios, isLoading: loadingBeneficios } = useQuery<EsquemaBeneficio[]>({
    queryKey: ["/api/esquemas-prestaciones", esquemaLFT?.id, "beneficios"],
    enabled: !!esquemaLFT?.id,
  });

  const isLoading = loadingEsquemas || loadingVacaciones || loadingBeneficios;

  if (isLoading) {
    return <LFTSkeleton />;
  }

  if (!esquemaLFT) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Info className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            No se encontró el esquema base de la Ley Federal del Trabajo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getBeneficioValor = (codigo: string): string => {
    const tipo = tiposBeneficio?.find(t => t.codigo === codigo);
    if (!tipo) return "N/A";
    const beneficio = beneficios?.find(b => b.tipoBeneficioId === tipo.id && b.activo);
    if (!beneficio) {
      return tipo.valorMinimoLegal ? `${parseFloat(tipo.valorMinimoLegal)}` : "N/A";
    }
    return `${parseFloat(beneficio.valor)}`;
  };

  const aguinaldoDias = getBeneficioValor("AGUINALDO");
  const primaVacacionalPct = getBeneficioValor("PRIMA_VACACIONAL");
  const primaDominicalPct = getBeneficioValor("PRIMA_DOMINICAL");

  const sortedVacaciones = vacaciones
    ?.filter(v => v.activo !== false)
    .sort((a, b) => a.aniosAntiguedad - b.aniosAntiguedad) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <CardTitle>Ley Federal del Trabajo (LFT 2024)</CardTitle>
          </div>
          <CardDescription>
            Prestaciones mínimas obligatorias establecidas por la Ley Federal del Trabajo.
            Estos valores son la base para todos los esquemas de prestaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <PrimaCard
              icon={Gift}
              title="Aguinaldo"
              value={aguinaldoDias !== "N/A" ? `${aguinaldoDias} días` : "15 días"}
              description="Mínimo de ley (Art. 87 LFT)"
            />
            <PrimaCard
              icon={Percent}
              title="Prima Vacacional"
              value={primaVacacionalPct !== "N/A" ? `${primaVacacionalPct}%` : "25%"}
              description="Sobre salario vacacional (Art. 80 LFT)"
            />
            <PrimaCard
              icon={Sun}
              title="Prima Dominical"
              value={primaDominicalPct !== "N/A" ? `${primaDominicalPct}%` : "25%"}
              description="Adicional por trabajo en domingo (Art. 71 LFT)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle>Tabla de Vacaciones LFT</CardTitle>
          </div>
          <CardDescription>
            Días de vacaciones por antigüedad según Artículo 76 LFT (Reforma 2023).
            Los días se incrementan progresivamente con los años de servicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedVacaciones.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Años de Antigüedad</TableHead>
                    <TableHead className="text-center">Días de Vacaciones</TableHead>
                    <TableHead className="text-right">Prima Vacacional (25%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVacaciones.map((vac) => (
                    <TableRow key={vac.id} data-testid={`row-vacaciones-${vac.aniosAntiguedad}`}>
                      <TableCell className="font-medium">
                        {vac.aniosAntiguedad === 1 ? "1 año" : `${vac.aniosAntiguedad} años`}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="min-w-[60px]">
                          {vac.diasVacaciones} días
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(vac.diasVacaciones * 0.25).toFixed(2)} días equivalentes
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Los días de vacaciones se incrementan: 12→14→16→18→20 (años 1-5), 
                  luego +2 días cada 5 años de servicio.
                </p>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <CalendarDays className="mx-auto h-12 w-12 mb-4" />
              <p>No se ha configurado la tabla de vacaciones para el esquema LFT.</p>
              <p className="text-sm mt-2">
                La tabla de vacaciones según la LFT 2024 (Reforma 2023) establece:
              </p>
              <div className="mt-4 flex justify-center">
                <Table className="max-w-md">
                  <TableBody>
                    <TableRow><TableCell>1 año</TableCell><TableCell className="text-center">12 días</TableCell></TableRow>
                    <TableRow><TableCell>2 años</TableCell><TableCell className="text-center">14 días</TableCell></TableRow>
                    <TableRow><TableCell>3 años</TableCell><TableCell className="text-center">16 días</TableCell></TableRow>
                    <TableRow><TableCell>4 años</TableCell><TableCell className="text-center">18 días</TableCell></TableRow>
                    <TableRow><TableCell>5 años</TableCell><TableCell className="text-center">20 días</TableCell></TableRow>
                    <TableRow><TableCell>6-10 años</TableCell><TableCell className="text-center">22 días</TableCell></TableRow>
                    <TableRow><TableCell>11-15 años</TableCell><TableCell className="text-center">24 días</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PrimaCard({ 
  icon: Icon, 
  title, 
  value, 
  description 
}: { 
  icon: typeof Gift; 
  title: string; 
  value: string; 
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function LFTSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-20 mt-2" />
                <Skeleton className="h-8 w-16 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
