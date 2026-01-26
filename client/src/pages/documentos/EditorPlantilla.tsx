import { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCliente } from '@/contexts/ClienteContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ArrowLeft,
  Save,
  Settings,
  Variable,
  History,
  Loader2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { TemplateEditor, VariablePicker, type TemplateEditorRef } from '@/components/templates';
import { tiposPlantillaDocumento, tiposPlantillaDocumentoLabels } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PlantillaDocumento {
  id: string;
  clienteId: string;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  tipoDocumento: string;
  contenido: unknown;
  tamanioPapel: string;
  orientacion: string;
  margenes: { top: number; right: number; bottom: number; left: number };
  encabezado?: unknown;
  piePagina?: unknown;
  mostrarNumeroPagina: boolean;
  variablesUsadas?: string[];
  variablesCustomDefinidas?: Array<{
    key: string;
    label: string;
    descripcion?: string;
    tipo: string;
    requerida: boolean;
    valorDefault?: string;
  }>;
  version: number;
  estatus: string;
  esDefault: boolean;
}

interface Version {
  version: number;
  createdAt: string;
  creadoPor?: string;
}

const defaultContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

export default function EditorPlantilla() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { clienteId } = useCliente();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editorRef = useRef<TemplateEditorRef>(null);
  const isNew = id === 'nueva';

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('otro');
  const [contenido, setContenido] = useState<unknown>(defaultContent);
  const [tamanioPapel, setTamanioPapel] = useState('letter');
  const [orientacion, setOrientacion] = useState('portrait');
  const [estatus, setEstatus] = useState('borrador');
  const [activeTab, setActiveTab] = useState('variables');

  // Fetch existing template
  const { data: plantilla, isLoading } = useQuery<PlantillaDocumento>({
    queryKey: [`/api/plantillas-documento/${id}`],
    enabled: !isNew && !!id,
  });

  // Fetch versions
  const { data: versiones = [] } = useQuery<Version[]>({
    queryKey: [`/api/plantillas-documento/${id}/versiones`],
    enabled: !isNew && !!id,
  });

  // Load template data
  useEffect(() => {
    if (plantilla) {
      setNombre(plantilla.nombre);
      setDescripcion(plantilla.descripcion || '');
      setCodigo(plantilla.codigo || '');
      setTipoDocumento(plantilla.tipoDocumento);
      setContenido(plantilla.contenido || defaultContent);
      setTamanioPapel(plantilla.tamanioPapel || 'letter');
      setOrientacion(plantilla.orientacion || 'portrait');
      setEstatus(plantilla.estatus || 'borrador');
    }
  }, [plantilla]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<PlantillaDocumento>) => {
      if (isNew) {
        const response = await apiRequest('POST', '/api/plantillas-documento', { ...data, clienteId });
        return response.json();
      } else {
        const response = await apiRequest('PUT', `/api/plantillas-documento/${id}`, data);
        return response.json();
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/plantillas-documento?clienteId=${clienteId}`] });
      toast({ title: isNew ? 'Plantilla creada' : 'Plantilla guardada' });
      if (isNew && result?.id) {
        setLocation(`/${clienteId}/documentos/plantillas/${result.id}`);
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    if (!nombre.trim()) {
      toast({ title: 'El nombre es requerido', variant: 'destructive' });
      return;
    }

    saveMutation.mutate({
      nombre,
      descripcion,
      codigo: codigo || undefined,
      tipoDocumento,
      contenido,
      tamanioPapel,
      orientacion,
      estatus,
    });
  };

  const handleInsertVariable = (variableKey: string, label: string) => {
    editorRef.current?.insertVariable(variableKey, label);
  };

  const handleRestoreVersion = async (version: number) => {
    try {
      await apiRequest('POST', `/api/plantillas-documento/${id}/restaurar/${version}`);
      queryClient.invalidateQueries({ queryKey: [`/api/plantillas-documento/${id}`] });
      toast({ title: `Versión ${version} restaurada` });
    } catch {
      toast({ title: 'Error al restaurar versión', variant: 'destructive' });
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/${clienteId}/documentos/plantillas`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-lg font-semibold">
              {isNew ? 'Nueva Plantilla' : nombre || 'Editar Plantilla'}
            </h1>
            {!isNew && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{estatus}</Badge>
                <span>v{plantilla?.version || 1}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={estatus} onValueChange={setEstatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="publicada">Publicada</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Template info bar */}
          <div className="flex items-center gap-4 p-3 bg-muted/30 border-b">
            <div className="flex-1">
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la plantilla"
                className="font-medium"
              />
            </div>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {tiposPlantillaDocumento.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tiposPlantillaDocumentoLabels[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Select value={tamanioPapel} onValueChange={setTamanioPapel}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="letter">Carta</SelectItem>
                  <SelectItem value="legal">Oficio</SelectItem>
                  <SelectItem value="a4">A4</SelectItem>
                </SelectContent>
              </Select>
              <Select value={orientacion} onValueChange={setOrientacion}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Vertical</SelectItem>
                  <SelectItem value="landscape">Horizontal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Configuración de Plantilla</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Código interno</Label>
                    <Input
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      placeholder="Ej: CONT-001"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Descripción de la plantilla"
                      rows={3}
                    />
                  </div>
                  <Separator />
                  <div>
                    <Label>Tamaño de papel</Label>
                    <Select value={tamanioPapel} onValueChange={setTamanioPapel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="letter">Carta (Letter)</SelectItem>
                        <SelectItem value="legal">Oficio (Legal)</SelectItem>
                        <SelectItem value="a4">A4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Orientación</Label>
                    <Select value={orientacion} onValueChange={setOrientacion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Vertical</SelectItem>
                        <SelectItem value="landscape">Horizontal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <TemplateEditor
              ref={editorRef}
              content={contenido}
              onChange={setContenido}
              placeholder="Escribe el contenido de tu plantilla aquí..."
              paperSize={tamanioPapel as 'letter' | 'legal' | 'a4'}
              orientation={orientacion as 'portrait' | 'landscape'}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l bg-background flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="variables" className="flex-1">
                <Variable className="h-4 w-4 mr-1" />
                Variables
              </TabsTrigger>
              <TabsTrigger value="versiones" className="flex-1">
                <History className="h-4 w-4 mr-1" />
                Versiones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="variables" className="flex-1 mt-0 overflow-hidden">
              <VariablePicker onInsert={handleInsertVariable} />
            </TabsContent>

            <TabsContent value="versiones" className="flex-1 mt-0 overflow-auto p-3">
              {versiones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay versiones anteriores
                </p>
              ) : (
                <div className="space-y-2">
                  {versiones.map((version: Version) => (
                    <Card key={version.version} className="cursor-pointer hover:bg-accent/50">
                      <CardHeader className="p-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            Versión {version.version}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreVersion(version.version)}
                          >
                            Restaurar
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
