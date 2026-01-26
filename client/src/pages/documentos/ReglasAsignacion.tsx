import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCliente } from '@/contexts/ClienteContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Settings2,
  Building2,
  Briefcase,
  FileSignature,
  Loader2,
} from 'lucide-react';
import { tiposEventoPlantilla } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PlantillaDocumento {
  id: string;
  nombre: string;
  tipoDocumento: string;
}

interface ReglaAsignacion {
  id: string;
  plantillaId: string;
  nombre: string;
  descripcion?: string;
  tipoEvento?: string;
  empresaIds?: string[];
  departamentos?: string[];
  puestoIds?: string[];
  tiposContrato?: string[];
  prioridad: number;
  esObligatoria: boolean;
  autoGenerar: boolean;
  activo: boolean;
}

interface Empresa {
  id: string;
  nombreComercial: string;
}

const tipoEventoLabels: Record<string, string> = {
  alta: 'Alta de empleado',
  baja: 'Baja de empleado',
  promocion: 'Promoción',
  renovacion: 'Renovación de contrato',
  cambio_puesto: 'Cambio de puesto',
  cambio_salario: 'Cambio de salario',
  otro: 'Otro',
};

const tipoContratoLabels: Record<string, string> = {
  indeterminado: 'Por tiempo indeterminado',
  temporal: 'Por tiempo determinado',
  por_obra: 'Por obra determinada',
  honorarios: 'Por honorarios',
};

export default function ReglasAsignacion() {
  const { clienteId } = useCliente();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState<ReglaAsignacion | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    plantillaId: '',
    nombre: '',
    descripcion: '',
    tipoEvento: '',
    empresaIds: [] as string[],
    departamentos: [] as string[],
    tiposContrato: [] as string[],
    prioridad: 0,
    esObligatoria: false,
    autoGenerar: false,
  });

  // Fetch reglas
  const { data: reglas = [], isLoading } = useQuery<ReglaAsignacion[]>({
    queryKey: [`/api/plantillas-documento/reglas-asignacion?clienteId=${clienteId}`],
    enabled: !!clienteId,
  });

  // Fetch plantillas
  const { data: plantillas = [] } = useQuery<PlantillaDocumento[]>({
    queryKey: [`/api/plantillas-documento?clienteId=${clienteId}`],
    enabled: !!clienteId,
  });

  // Fetch empresas
  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: [`/api/empresas?clienteId=${clienteId}`],
    enabled: !!clienteId,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingRegla) {
        const response = await apiRequest('PUT', `/api/plantillas-documento/reglas-asignacion/${editingRegla.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/plantillas-documento/reglas-asignacion', { ...data, clienteId });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plantillas-documento/reglas-asignacion?clienteId=${clienteId}`] });
      toast({ title: editingRegla ? 'Regla actualizada' : 'Regla creada' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Error al guardar regla', variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/plantillas-documento/reglas-asignacion/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plantillas-documento/reglas-asignacion?clienteId=${clienteId}`] });
      toast({ title: 'Regla eliminada' });
    },
    onError: () => {
      toast({ title: 'Error al eliminar regla', variant: 'destructive' });
    },
  });

  const handleOpenDialog = (regla?: ReglaAsignacion) => {
    if (regla) {
      setEditingRegla(regla);
      setFormData({
        plantillaId: regla.plantillaId,
        nombre: regla.nombre,
        descripcion: regla.descripcion || '',
        tipoEvento: regla.tipoEvento || '',
        empresaIds: regla.empresaIds || [],
        departamentos: regla.departamentos || [],
        tiposContrato: regla.tiposContrato || [],
        prioridad: regla.prioridad,
        esObligatoria: regla.esObligatoria,
        autoGenerar: regla.autoGenerar,
      });
    } else {
      setEditingRegla(null);
      setFormData({
        plantillaId: '',
        nombre: '',
        descripcion: '',
        tipoEvento: '',
        empresaIds: [],
        departamentos: [],
        tiposContrato: [],
        prioridad: 0,
        esObligatoria: false,
        autoGenerar: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRegla(null);
  };

  const handleSave = () => {
    if (!formData.plantillaId || !formData.nombre) {
      toast({ title: 'Nombre y plantilla son requeridos', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(formData);
  };

  const getPlantillaNombre = (plantillaId: string) => {
    return plantillas.find((p: PlantillaDocumento) => p.id === plantillaId)?.nombre || 'Desconocida';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reglas de Asignación</h1>
          <p className="text-muted-foreground">
            Define qué plantillas usar según el contexto (empresa, puesto, tipo de evento)
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Regla
        </Button>
      </div>

      {/* Rules Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          Cargando reglas...
        </div>
      ) : reglas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay reglas de asignación</h3>
            <p className="text-muted-foreground mb-4">
              Las reglas te permiten sugerir automáticamente plantillas según el contexto
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Regla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Plantilla</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Criterios</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Opciones</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reglas.map((regla: ReglaAsignacion) => (
                <TableRow key={regla.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{regla.nombre}</p>
                      {regla.descripcion && (
                        <p className="text-sm text-muted-foreground">{regla.descripcion}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getPlantillaNombre(regla.plantillaId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {regla.tipoEvento ? (
                      <Badge variant="outline">{tipoEventoLabels[regla.tipoEvento]}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Cualquiera</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {regla.empresaIds && regla.empresaIds.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {regla.empresaIds.length} empresa(s)
                        </Badge>
                      )}
                      {regla.departamentos && regla.departamentos.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {regla.departamentos.length} depto(s)
                        </Badge>
                      )}
                      {regla.tiposContrato && regla.tiposContrato.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {regla.tiposContrato.length} tipo(s)
                        </Badge>
                      )}
                      {!regla.empresaIds?.length &&
                        !regla.departamentos?.length &&
                        !regla.tiposContrato?.length && (
                          <span className="text-muted-foreground text-sm">Todos</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{regla.prioridad}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {regla.esObligatoria && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Obligatoria</Badge>
                      )}
                      {regla.autoGenerar && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Auto-generar</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(regla)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(regla.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRegla ? 'Editar Regla' : 'Nueva Regla de Asignación'}</DialogTitle>
            <DialogDescription>
              Define cuándo se debe sugerir o usar una plantilla específica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre de la regla *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Contrato para área de ventas"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe cuándo aplica esta regla"
                rows={2}
              />
            </div>

            <div>
              <Label>Plantilla a usar *</Label>
              <Select
                value={formData.plantillaId}
                onValueChange={(v) => setFormData({ ...formData, plantillaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {plantillas
                    .filter((p: PlantillaDocumento) => p.tipoDocumento !== 'archivada')
                    .map((p: PlantillaDocumento) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de evento</Label>
              <Select
                value={formData.tipoEvento}
                onValueChange={(v) => setFormData({ ...formData, tipoEvento: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cualquier evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquier evento</SelectItem>
                  {tiposEventoPlantilla.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipoEventoLabels[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Empresas (dejar vacío para todas)</Label>
              <Select
                value={formData.empresaIds[0] || ''}
                onValueChange={(v) =>
                  setFormData({ ...formData, empresaIds: v ? [v] : [] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las empresas</SelectItem>
                  {empresas.map((e: Empresa) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombreComercial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipos de contrato (dejar vacío para todos)</Label>
              <Select
                value={formData.tiposContrato[0] || ''}
                onValueChange={(v) =>
                  setFormData({ ...formData, tiposContrato: v ? [v] : [] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  {Object.entries(tipoContratoLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridad (mayor = más importante)</Label>
              <Input
                type="number"
                value={formData.prioridad}
                onChange={(e) =>
                  setFormData({ ...formData, prioridad: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Obligatoria</Label>
                <p className="text-sm text-muted-foreground">
                  El documento debe generarse para este evento
                </p>
              </div>
              <Switch
                checked={formData.esObligatoria}
                onCheckedChange={(v) => setFormData({ ...formData, esObligatoria: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-generar</Label>
                <p className="text-sm text-muted-foreground">
                  Generar automáticamente cuando ocurra el evento
                </p>
              </div>
              <Switch
                checked={formData.autoGenerar}
                onCheckedChange={(v) => setFormData({ ...formData, autoGenerar: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRegla ? 'Guardar Cambios' : 'Crear Regla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
