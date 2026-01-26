import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCliente } from '@/contexts/ClienteContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  FileText,
  User,
  Building2,
  Settings,
  Eye,
  Download,
  Loader2,
  Printer,
} from 'lucide-react';
import { TemplateEditor } from '@/components/templates';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  puesto?: string;
  numeroEmpleado?: string;
}

interface Empresa {
  id: string;
  nombreComercial: string;
  razonSocial?: string;
}

interface PlantillaDocumento {
  id: string;
  nombre: string;
  contenido: unknown;
  variablesCustomDefinidas?: Array<{
    key: string;
    label: string;
    descripcion?: string;
    tipo: string;
    requerida: boolean;
    valorDefault?: string;
  }>;
}

interface PreviewResponse {
  template: { contenido: unknown };
  variables: Record<string, string>;
}

export default function GenerarDocumento() {
  const params = useParams<{ id: string }>();
  const plantillaId = params.id;
  const [, setLocation] = useLocation();
  const { clienteId } = useCliente();
  const { toast } = useToast();

  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState<unknown>(null);

  // Fetch template
  const { data: plantilla, isLoading: loadingPlantilla } = useQuery<PlantillaDocumento>({
    queryKey: [`/api/plantillas-documento/${plantillaId}`],
    enabled: !!plantillaId,
  });

  // Fetch employees
  const { data: empleados = [] } = useQuery<Employee[]>({
    queryKey: [`/api/employees?clienteId=${clienteId}`],
    enabled: !!clienteId,
  });

  // Fetch empresas
  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: [`/api/empresas?clienteId=${clienteId}`],
    enabled: !!clienteId,
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/plantillas-documento/${plantillaId}/preview`, {
        empleadoId: selectedEmpleadoId || undefined,
        empresaId: selectedEmpresaId || undefined,
        customVariables,
      });
      return response.json() as Promise<PreviewResponse>;
    },
    onSuccess: (data) => {
      setPreviewContent(data.template.contenido);
    },
    onError: () => {
      toast({ title: 'Error al generar vista previa', variant: 'destructive' });
    },
  });

  // Generate PDF mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/plantillas-documento/${plantillaId}/generar-pdf`, {
        empleadoId: selectedEmpleadoId || undefined,
        empresaId: selectedEmpresaId || undefined,
        customVariables,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Documento generado exitosamente' });
      handlePrint();
    },
    onError: () => {
      toast({ title: 'Error al generar documento', variant: 'destructive' });
    },
  });

  // Update preview when selection changes
  useEffect(() => {
    if (plantillaId) {
      previewMutation.mutate();
    }
  }, [plantillaId, selectedEmpleadoId, selectedEmpresaId]);

  const handlePrint = () => {
    window.print();
  };

  if (loadingPlantilla) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plantilla) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Plantilla no encontrada</p>
        <Button
          variant="outline"
          onClick={() => setLocation(`/${clienteId}/documentos/plantillas`)}
        >
          Volver a plantillas
        </Button>
      </div>
    );
  }

  const customVarDefinitions = plantilla.variablesCustomDefinidas || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background print:hidden">
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
            <h1 className="text-lg font-semibold">Generar Documento</h1>
            <p className="text-sm text-muted-foreground">{plantilla.nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Generar PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Options */}
        <div className="w-80 border-r bg-muted/30 flex flex-col print:hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Employee Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">Empleado</Label>
                </div>
                <Select value={selectedEmpleadoId} onValueChange={setSelectedEmpleadoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin empleado (datos de ejemplo)</SelectItem>
                    {empleados.map((emp: Employee) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nombre} {emp.apellidoPaterno} - {emp.numeroEmpleado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Empresa Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">Empresa</Label>
                </div>
                <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin empresa (datos de ejemplo)</SelectItem>
                    {empresas.map((emp: Empresa) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nombreComercial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Variables */}
              {customVarDefinitions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-medium">Variables Personalizadas</Label>
                    </div>
                    {customVarDefinitions.map((varDef) => (
                      <div key={varDef.key}>
                        <Label className="text-sm">
                          {varDef.label}
                          {varDef.requerida && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          value={customVariables[varDef.key] || varDef.valorDefault || ''}
                          onChange={(e) =>
                            setCustomVariables((prev) => ({
                              ...prev,
                              [varDef.key]: e.target.value,
                            }))
                          }
                          placeholder={varDef.descripcion}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              {/* Preview button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Actualizar Vista Previa
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 print:p-0 print:bg-white">
          <div className="max-w-4xl mx-auto print:max-w-none">
            <Card className="print:shadow-none print:border-0">
              <CardContent className="p-8 print:p-0">
                {previewMutation.isPending ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : previewContent ? (
                  <TemplateEditor
                    content={previewContent}
                    onChange={() => {}}
                    readOnly
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecciona los datos para ver la vista previa</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
}
