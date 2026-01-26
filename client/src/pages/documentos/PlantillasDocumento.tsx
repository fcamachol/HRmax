import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useCliente } from '@/contexts/ClienteContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Search,
  MoreVertical,
  FileText,
  Edit,
  Trash2,
  Copy,
  FileSignature,
  FilePlus2,
} from 'lucide-react';
import { tiposPlantillaDocumentoLabels, type TipoPlantillaDocumento } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PlantillaDocumento {
  id: string;
  nombre: string;
  descripcion?: string;
  tipoDocumento: TipoPlantillaDocumento;
  estatus: string;
  version: number;
  esDefault: boolean;
  updatedAt: string;
}

export default function PlantillasDocumento() {
  const [, setLocation] = useLocation();
  const { clienteId } = useCliente();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('todas');

  const { data: plantillas = [], isLoading } = useQuery<PlantillaDocumento[]>({
    queryKey: [`/api/plantillas-documento?clienteId=${clienteId}`],
    enabled: !!clienteId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/plantillas-documento/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plantillas-documento?clienteId=${clienteId}`] });
      toast({ title: 'Plantilla archivada correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al archivar la plantilla', variant: 'destructive' });
    },
  });

  const filteredPlantillas = plantillas.filter((p: PlantillaDocumento) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = selectedTipo === 'todas' || p.tipoDocumento === selectedTipo;
    return matchesSearch && matchesTipo && p.estatus !== 'archivada';
  });

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'publicada':
        return 'bg-green-100 text-green-800';
      case 'borrador':
        return 'bg-yellow-100 text-yellow-800';
      case 'archivada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tipoTabs = [
    { value: 'todas', label: 'Todas' },
    { value: 'contrato_laboral', label: 'Contratos' },
    { value: 'carta_oferta', label: 'Ofertas' },
    { value: 'carta_finiquito', label: 'Finiquitos' },
    { value: 'constancia_laboral', label: 'Constancias' },
    { value: 'otro', label: 'Otros' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Plantillas de Documentos</h1>
          <p className="text-muted-foreground">
            Crea y administra plantillas para contratos, cartas patronales y otros documentos
          </p>
        </div>
        <Button onClick={() => setLocation(`/${clienteId}/documentos/plantillas/nueva`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plantilla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTipo} onValueChange={setSelectedTipo}>
        <TabsList>
          {tipoTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTipo} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando plantillas...</div>
          ) : filteredPlantillas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay plantillas</h3>
              <p className="text-muted-foreground">
                {search
                  ? 'No se encontraron plantillas que coincidan con la búsqueda'
                  : 'Crea tu primera plantilla de documento'}
              </p>
              <Button
                className="mt-4"
                onClick={() => setLocation(`/${clienteId}/documentos/plantillas/nueva`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Plantilla
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlantillas.map((plantilla: PlantillaDocumento) => (
                <Card key={plantilla.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-base font-medium line-clamp-1">
                            {plantilla.nombre}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {tiposPlantillaDocumentoLabels[plantilla.tipoDocumento]}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setLocation(`/${clienteId}/documentos/plantillas/${plantilla.id}`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setLocation(`/${clienteId}/documentos/generar/${plantilla.id}`)
                            }
                          >
                            <FilePlus2 className="mr-2 h-4 w-4" />
                            Generar documento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteMutation.mutate(plantilla.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Archivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plantilla.descripcion || 'Sin descripción'}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getEstatusColor(plantilla.estatus)}>
                        {plantilla.estatus}
                      </Badge>
                      {plantilla.esDefault && (
                        <Badge variant="outline">Por defecto</Badge>
                      )}
                    </div>
                    <span>v{plantilla.version}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
