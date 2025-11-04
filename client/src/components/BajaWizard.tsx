import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LegalCase } from "@shared/schema";
import { 
  bajaCategories, 
  bajaTypes, 
  bajaTypeLabels, 
  bajaCategoryLabels,
  type BajaCategory
} from "@shared/schema";

type BajaType = typeof bajaTypes[BajaCategory][number];
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Calculator,
  ClipboardCheck,
  FileSignature,
  Plus,
  Trash2
} from "lucide-react";

interface BajaWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCase?: LegalCase | null;
}

interface BajaFormData {
  employeeId: string;
  employeeName: string;
  bajaCategory: BajaCategory;
  bajaType: BajaType;
  reason: string;
  startDate: string;
  endDate: string;
  notes: string;
  // Cálculo
  salarioDiario?: string;
  diasAguinaldo?: string;
  diasVacaciones?: string;
  primaVacacional?: string;
  conceptosAdicionales: Array<{ description: string; amount: string }>;
  conceptosDescuentos: Array<{ description: string; amount: string }>;
  // Documentación
  documentosEntregados: string[];
  // Firma
  autorizadoPor?: string;
  comentariosFinales?: string;
}

const WIZARD_STEPS = [
  { id: 1, title: "Información Básica", icon: FileText, description: "Datos del empleado y tipo de baja" },
  { id: 2, title: "Cálculo", icon: Calculator, description: "Finiquito o liquidación" },
  { id: 3, title: "Documentación", icon: ClipboardCheck, description: "Documentos y checklist" },
  { id: 4, title: "Firma y Autorización", icon: FileSignature, description: "Autorización final" },
];

const DOCUMENTOS_CHECKLIST = [
  "Carta de renuncia / Aviso de terminación",
  "Finiquito firmado",
  "Baja ante IMSS",
  "Constancia de trabajo",
  "Entrega de uniformes y equipo",
  "Liquidación de adeudos",
  "Formato de baja interna",
];

export function BajaWizard({ open, onOpenChange, existingCase }: BajaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BajaFormData>({
    employeeId: "",
    employeeName: "",
    bajaCategory: "voluntaria",
    bajaType: "renuncia_voluntaria",
    reason: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    notes: "",
    conceptosAdicionales: [],
    conceptosDescuentos: [],
    documentosEntregados: [],
  });

  const { toast } = useToast();

  const isEditMode = !!existingCase;

  // Mapear estado de la baja a paso del wizard
  const getStepFromStatus = (status: string): number => {
    const statusToStep: Record<string, number> = {
      "calculo": 2,
      "documentacion": 3,
      "firma": 4,
      "tramites": 4,
      "entrega": 4,
      "completado": 4,
      "demanda": 4,
    };
    return statusToStep[status] || 1;
  };

  // Cargar datos del caso existente cuando se abre en modo edición
  useEffect(() => {
    if (open && existingCase) {
      setFormData({
        employeeId: existingCase.employeeId || "",
        employeeName: existingCase.employeeName,
        bajaCategory: existingCase.bajaCategory as BajaCategory,
        bajaType: existingCase.bajaType as BajaType,
        reason: existingCase.reason || "",
        startDate: existingCase.startDate || new Date().toISOString().split('T')[0],
        endDate: existingCase.endDate || "",
        notes: existingCase.notes || "",
        conceptosAdicionales: [],
        conceptosDescuentos: [],
        documentosEntregados: [],
      });
      setCurrentStep(getStepFromStatus(existingCase.status));
    } else if (open && !existingCase) {
      resetWizard();
    }
  }, [open, existingCase]);

  const saveCaseMutation = useMutation({
    mutationFn: async (data: BajaFormData) => {
      if (isEditMode && existingCase) {
        // Modo edición: PATCH
        const response = await apiRequest("PATCH", `/api/legal/cases/${existingCase.id}`, {
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          bajaCategory: data.bajaCategory,
          bajaType: data.bajaType,
          caseType: getLegacyCaseType(data.bajaType),
          reason: data.reason,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes,
        });
        return response;
      } else {
        // Modo creación: POST
        const response = await apiRequest("POST", "/api/legal/cases", {
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          bajaCategory: data.bajaCategory,
          bajaType: data.bajaType,
          caseType: getLegacyCaseType(data.bajaType),
          reason: data.reason,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes,
          status: "calculo",
          mode: "real",
        });
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal/cases"] });
      toast({
        title: isEditMode ? "Baja actualizada" : "Proceso de baja iniciado",
        description: isEditMode 
          ? "Los datos del proceso se han actualizado exitosamente" 
          : "El proceso se ha registrado exitosamente en etapa de Cálculo",
      });
      onOpenChange(false);
      if (!isEditMode) {
        resetWizard();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getLegacyCaseType = (bajaType: string): string => {
    if (bajaType === 'renuncia_voluntaria') return 'renuncia';
    if (bajaType === 'despido_justificado') return 'despido_justificado';
    if (bajaType === 'despido_injustificado') return 'despido_injustificado';
    if (bajaType === 'rescision_patron_art47') return 'despido_justificado';
    if (bajaType === 'rescision_trabajador_art51') return 'despido_injustificado';
    if (bajaType === 'mutuo_acuerdo') return 'renuncia';
    if (bajaType === 'abandono_trabajo') return 'despido_justificado';
    if (bajaType === 'fin_contrato_temporal') return 'renuncia';
    if (bajaType === 'fallecimiento') return 'renuncia';
    if (bajaType === 'incapacidad_permanente') return 'despido_justificado';
    if (bajaType === 'jubilacion') return 'renuncia';
    if (bajaType === 'baja_administrativa') return 'renuncia';
    return 'renuncia';
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFormData({
      employeeId: "",
      employeeName: "",
      bajaCategory: "voluntaria",
      bajaType: "renuncia_voluntaria",
      reason: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      notes: "",
      conceptosAdicionales: [],
      conceptosDescuentos: [],
      documentosEntregados: [],
    });
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    saveCaseMutation.mutate(formData);
  };

  const updateFormData = (field: keyof BajaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addConceptoAdicional = () => {
    setFormData(prev => ({
      ...prev,
      conceptosAdicionales: [...prev.conceptosAdicionales, { description: "", amount: "" }]
    }));
  };

  const removeConceptoAdicional = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conceptosAdicionales: prev.conceptosAdicionales.filter((_, i) => i !== index)
    }));
  };

  const addConceptoDescuento = () => {
    setFormData(prev => ({
      ...prev,
      conceptosDescuentos: [...prev.conceptosDescuentos, { description: "", amount: "" }]
    }));
  };

  const removeConceptoDescuento = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conceptosDescuentos: prev.conceptosDescuentos.filter((_, i) => i !== index)
    }));
  };

  const toggleDocumento = (doc: string) => {
    setFormData(prev => ({
      ...prev,
      documentosEntregados: prev.documentosEntregados.includes(doc)
        ? prev.documentosEntregados.filter(d => d !== doc)
        : [...prev.documentosEntregados, doc]
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.employeeName && formData.bajaCategory && formData.bajaType && formData.endDate;
      case 2:
        return true; // Cálculo es opcional
      case 3:
        return true; // Documentación es opcional
      case 4:
        return true; // Firma es opcional
      default:
        return false;
    }
  };

  const availableTypes = bajaTypes[formData.bajaCategory];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Asistente de Proceso de Baja</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          {WIZARD_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : currentStep === step.id 
                    ? 'border-primary text-primary' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="text-center hidden md:block">
                  <p className={`text-xs font-medium ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden lg:block">{step.description}</p>
                </div>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <ChevronRight className={`h-4 w-4 mx-2 ${
                  currentStep > step.id ? 'text-primary' : 'text-muted-foreground'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Empleado</CardTitle>
                  <CardDescription>Datos básicos del empleado que causará baja</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="employeeName">Nombre del Empleado *</Label>
                      <Input
                        id="employeeName"
                        value={formData.employeeName}
                        onChange={(e) => updateFormData("employeeName", e.target.value)}
                        placeholder="Nombre completo"
                        data-testid="input-employee-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">ID de Empleado (Opcional)</Label>
                      <Input
                        id="employeeId"
                        value={formData.employeeId}
                        onChange={(e) => updateFormData("employeeId", e.target.value)}
                        placeholder="EMP-001"
                        data-testid="input-employee-id"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Baja</CardTitle>
                  <CardDescription>Clasificación legal de la terminación laboral</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bajaCategory">Categoría *</Label>
                      <Select
                        value={formData.bajaCategory}
                        onValueChange={(value) => {
                          const cat = value as BajaCategory;
                          updateFormData("bajaCategory", cat);
                          const firstType = bajaTypes[cat][0];
                          if (firstType) {
                            updateFormData("bajaType", firstType);
                          }
                        }}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bajaCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {bajaCategoryLabels[cat]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bajaType">Tipo Específico *</Label>
                      <Select
                        value={formData.bajaType}
                        onValueChange={(value) => updateFormData("bajaType", value as BajaType)}
                      >
                        <SelectTrigger data-testid="select-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {bajaTypeLabels[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha de Inicio (Relación Laboral)</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateFormData("startDate", e.target.value)}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Fecha de Terminación *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => updateFormData("endDate", e.target.value)}
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo de la Baja</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => updateFormData("reason", e.target.value)}
                      placeholder="Describa el motivo de la terminación..."
                      rows={3}
                      data-testid="textarea-reason"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Datos para Cálculo</CardTitle>
                  <CardDescription>Información necesaria para calcular finiquito o liquidación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="salarioDiario">Salario Diario</Label>
                      <Input
                        id="salarioDiario"
                        type="number"
                        step="0.01"
                        value={formData.salarioDiario || ""}
                        onChange={(e) => updateFormData("salarioDiario", e.target.value)}
                        placeholder="0.00"
                        data-testid="input-salario-diario"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diasAguinaldo">Días de Aguinaldo</Label>
                      <Input
                        id="diasAguinaldo"
                        type="number"
                        value={formData.diasAguinaldo || ""}
                        onChange={(e) => updateFormData("diasAguinaldo", e.target.value)}
                        placeholder="15"
                        data-testid="input-dias-aguinaldo"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="diasVacaciones">Días de Vacaciones</Label>
                      <Input
                        id="diasVacaciones"
                        type="number"
                        value={formData.diasVacaciones || ""}
                        onChange={(e) => updateFormData("diasVacaciones", e.target.value)}
                        placeholder="6"
                        data-testid="input-dias-vacaciones"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaVacacional">Prima Vacacional (%)</Label>
                      <Input
                        id="primaVacacional"
                        type="number"
                        step="0.01"
                        value={formData.primaVacacional || ""}
                        onChange={(e) => updateFormData("primaVacacional", e.target.value)}
                        placeholder="25"
                        data-testid="input-prima-vacacional"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conceptos Adicionales</CardTitle>
                  <CardDescription>Bonos, incentivos u otros conceptos a favor del empleado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.conceptosAdicionales.map((concepto, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Descripción"
                        value={concepto.description}
                        onChange={(e) => {
                          const newConceptos = [...formData.conceptosAdicionales];
                          newConceptos[index].description = e.target.value;
                          updateFormData("conceptosAdicionales", newConceptos);
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={concepto.amount}
                        onChange={(e) => {
                          const newConceptos = [...formData.conceptosAdicionales];
                          newConceptos[index].amount = e.target.value;
                          updateFormData("conceptosAdicionales", newConceptos);
                        }}
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConceptoAdicional(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addConceptoAdicional}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Concepto Adicional
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Descuentos</CardTitle>
                  <CardDescription>Adeudos, préstamos u otros descuentos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.conceptosDescuentos.map((concepto, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Descripción"
                        value={concepto.description}
                        onChange={(e) => {
                          const newConceptos = [...formData.conceptosDescuentos];
                          newConceptos[index].description = e.target.value;
                          updateFormData("conceptosDescuentos", newConceptos);
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={concepto.amount}
                        onChange={(e) => {
                          const newConceptos = [...formData.conceptosDescuentos];
                          newConceptos[index].amount = e.target.value;
                          updateFormData("conceptosDescuentos", newConceptos);
                        }}
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConceptoDescuento(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addConceptoDescuento}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Descuento
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Checklist de Documentación</CardTitle>
                  <CardDescription>Marque los documentos que ya han sido procesados o entregados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {DOCUMENTOS_CHECKLIST.map((doc) => (
                    <div
                      key={doc}
                      className="flex items-center gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                      onClick={() => toggleDocumento(doc)}
                      data-testid={`checkbox-doc-${doc}`}
                    >
                      {formData.documentosEntregados.includes(doc) ? (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={formData.documentosEntregados.includes(doc) ? "text-foreground" : "text-muted-foreground"}>
                        {doc}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notas Adicionales</CardTitle>
                  <CardDescription>Información adicional sobre la documentación</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                    placeholder="Agregue notas sobre la documentación, pendientes, etc..."
                    rows={4}
                    data-testid="textarea-notes"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Autorización</CardTitle>
                  <CardDescription>Persona responsable de autorizar el proceso de baja</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="autorizadoPor">Autorizado Por</Label>
                    <Input
                      id="autorizadoPor"
                      value={formData.autorizadoPor || ""}
                      onChange={(e) => updateFormData("autorizadoPor", e.target.value)}
                      placeholder="Nombre del responsable"
                      data-testid="input-autorizado-por"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comentariosFinales">Comentarios Finales</Label>
                    <Textarea
                      id="comentariosFinales"
                      value={formData.comentariosFinales || ""}
                      onChange={(e) => updateFormData("comentariosFinales", e.target.value)}
                      placeholder="Comentarios u observaciones finales..."
                      rows={4}
                      data-testid="textarea-comentarios-finales"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen del Proceso</CardTitle>
                  <CardDescription>Verifique la información antes de iniciar el proceso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Empleado</p>
                      <p className="font-medium">{formData.employeeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Baja</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            formData.bajaCategory === 'involuntaria' ? 'destructive' : 
                            formData.bajaCategory === 'especial' ? 'secondary' : 
                            'default'
                          }
                        >
                          {bajaCategoryLabels[formData.bajaCategory]}
                        </Badge>
                        <span className="text-sm">{bajaTypeLabels[formData.bajaType]}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Terminación</p>
                      <p className="font-medium">{formData.endDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Documentos Procesados</p>
                      <p className="font-medium">{formData.documentosEntregados.length} de {DOCUMENTOS_CHECKLIST.length}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">El proceso se iniciará en la etapa de:</p>
                    <Badge className="text-sm">1. Cálculo</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Podrá continuar con el proceso moviendo la tarjeta entre las diferentes etapas del Kanban
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            data-testid="button-previous"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Paso {currentStep} de {WIZARD_STEPS.length}
          </div>

          {currentStep < WIZARD_STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              data-testid="button-next"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!isStepValid() || saveCaseMutation.isPending}
              data-testid="button-finish"
            >
              {saveCaseMutation.isPending 
                ? (isEditMode ? "Guardando..." : "Iniciando...") 
                : (isEditMode ? "Guardar Cambios" : "Iniciar Proceso de Baja")
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
