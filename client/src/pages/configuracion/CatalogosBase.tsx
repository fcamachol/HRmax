import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calculator, TrendingUp, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatBanco, CatValorUmaSmg } from "@shared/schema";

export default function CatalogosBase() {
  const { data: bancos = [], isLoading: bancosLoading } = useQuery<CatBanco[]>({
    queryKey: ["/api/catalogos/bancos"],
  });

  const { data: valoresUmaSmg = [], isLoading: umaSmgLoading } = useQuery<CatValorUmaSmg[]>({
    queryKey: ["/api/catalogos/uma-smg"],
  });

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return `$${parseFloat(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const uniqueValoresUmaSmg = valoresUmaSmg.reduce((acc, current) => {
    const key = `${current.tipo}-${current.vigenciaDesde}`;
    if (!acc.find(item => `${item.tipo}-${item.vigenciaDesde}` === key)) {
      acc.push(current);
    }
    return acc;
  }, [] as CatValorUmaSmg[]);

  const groupedByTipo = uniqueValoresUmaSmg.reduce((acc, valor) => {
    const tipo = valor.tipo;
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(valor);
    return acc;
  }, {} as Record<string, CatValorUmaSmg[]>);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-catalogos-title">Catálogos Base</h1>
        <p className="text-muted-foreground mt-2">
          Catálogos del SAT y valores fiscales oficiales para cálculos de nómina
        </p>
      </div>

      <Tabs defaultValue="bancos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bancos" data-testid="tab-bancos">
            <Building2 className="h-4 w-4 mr-2" />
            Bancos
          </TabsTrigger>
          <TabsTrigger value="uma-smg" data-testid="tab-uma-smg">
            <Calculator className="h-4 w-4 mr-2" />
            UMA / SMG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bancos" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Catálogo de Bancos SAT</h2>
            <p className="text-muted-foreground text-sm">
              Instituciones bancarias con códigos SAT para CFDI y layouts
            </p>
          </div>

          {bancosLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Código SAT</TableHead>
                    <TableHead>Nombre Corto</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead className="w-32 text-center">Long. Cuenta</TableHead>
                    <TableHead className="w-32 text-center">Long. CLABE</TableHead>
                    <TableHead className="w-24 text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bancos.map((banco) => (
                    <TableRow key={banco.id} data-testid={`row-banco-${banco.id}`}>
                      <TableCell className="font-mono text-sm">{banco.codigoSat}</TableCell>
                      <TableCell className="font-medium">{banco.nombreCorto}</TableCell>
                      <TableCell className="text-muted-foreground">{banco.nombreCompleto}</TableCell>
                      <TableCell className="text-center">{banco.longitudCuenta || 10}</TableCell>
                      <TableCell className="text-center">{banco.longitudClabe || 18}</TableCell>
                      <TableCell className="text-center">
                        {banco.activo ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Total: {bancos.length} bancos registrados
          </p>
        </TabsContent>

        <TabsContent value="uma-smg" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Valores UMA y Salario Mínimo</h2>
            <p className="text-muted-foreground text-sm">
              Valores oficiales para cálculos de ISR, IMSS, Infonavit y prestaciones
            </p>
          </div>

          {umaSmgLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {['UMA', 'SMG', 'SMG_FRONTERA'].map((tipo) => {
                const valores = groupedByTipo[tipo] || [];
                const vigente = valores[0];
                
                const tipoLabels: Record<string, { title: string; description: string }> = {
                  'UMA': { 
                    title: 'Unidad de Medida y Actualización', 
                    description: 'Base para multas, créditos Infonavit y límites de seguridad social' 
                  },
                  'SMG': { 
                    title: 'Salario Mínimo General', 
                    description: 'Salario mínimo para zona general del país' 
                  },
                  'SMG_FRONTERA': { 
                    title: 'Salario Mínimo Frontera Norte', 
                    description: 'Salario mínimo para zona libre de la frontera norte' 
                  },
                };
                
                const config = tipoLabels[tipo];
                
                return (
                  <Card key={tipo} data-testid={`card-valor-${tipo.toLowerCase()}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{config?.title || tipo}</CardTitle>
                      </div>
                      <CardDescription>{config?.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {vigente ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Diario</p>
                              <p className="font-semibold text-lg">{formatCurrency(vigente.valorDiario)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Mensual</p>
                              <p className="font-semibold">{formatCurrency(vigente.valorMensual)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Anual</p>
                              <p className="font-semibold">{formatCurrency(vigente.valorAnual)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              Vigente desde: {formatDate(vigente.vigenciaDesde)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {valores.length} registro{valores.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Sin datos disponibles</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="border rounded-lg mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor Diario</TableHead>
                  <TableHead className="text-right">Valor Mensual</TableHead>
                  <TableHead className="text-right">Valor Anual</TableHead>
                  <TableHead>Vigencia Desde</TableHead>
                  <TableHead>Vigencia Hasta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueValoresUmaSmg.map((valor) => (
                  <TableRow key={valor.id} data-testid={`row-valor-${valor.id}`}>
                    <TableCell>
                      <Badge variant={valor.tipo === 'UMA' ? 'default' : 'secondary'}>
                        {valor.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(valor.valorDiario)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(valor.valorMensual)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(valor.valorAnual)}</TableCell>
                    <TableCell>{formatDate(valor.vigenciaDesde)}</TableCell>
                    <TableCell>{valor.vigenciaHasta ? formatDate(valor.vigenciaHasta) : <span className="text-muted-foreground">Vigente</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
