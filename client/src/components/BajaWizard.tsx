import { useState, useEffect, useMemo } from "react";
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
import { calcularFiniquito, type FiniquitoResult } from "@shared/finiquitoCalculations";
import { CartaFiniquito } from "@/components/CartaFiniquito";

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
  // Datos para cálculo de finiquito
  salarioDiario: string;
  empleadoFechaInicio: string; // Fecha de inicio laboral del empleado
  diasAguinaldoPagados?: string; // Días de aguinaldo ya pagados este año
  diasVacacionesTomadas?: string; // Días de vacaciones ya tomados este año
  // Cálculo automático
  calculoAprobado?: boolean;
  calculoData?: any; // Desglose completo del cálculo aprobado
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
  const [showCartaModal, setShowCartaModal] = useState(false);
  const [formData, setFormData] = useState<BajaFormData>({
    employeeId: "",
    employeeName: "",
    bajaCategory: "voluntaria",
    bajaType: "renuncia_voluntaria",
    reason: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    notes: "",
    salarioDiario: "",
    empleadoFechaInicio: "",
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
        salarioDiario: existingCase.salarioDiario?.toString() || "",
        empleadoFechaInicio: existingCase.empleadoFechaInicio || "",
        calculoAprobado: existingCase.calculoAprobado === "true",
        calculoData: existingCase.calculoData || null,
        conceptosAdicionales: [],
        conceptosDescuentos: [],
        documentosEntregados: [],
      });
      setCurrentStep(getStepFromStatus(existingCase.status));
    } else if (open && !existingCase) {
      resetWizard();
    }
    // Resetear el estado del modal de carta cuando se cierra el wizard
    if (!open) {
      setShowCartaModal(false);
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
          salarioDiario: data.salarioDiario ? parseFloat(data.salarioDiario) : null,
          empleadoFechaInicio: data.empleadoFechaInicio || null,
          calculoAprobado: data.calculoAprobado ? "true" : "false",
          calculoData: data.calculoData || null,
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
          salarioDiario: data.salarioDiario ? parseFloat(data.salarioDiario) : null,
          empleadoFechaInicio: data.empleadoFechaInicio || null,
          calculoAprobado: data.calculoAprobado ? "true" : "false",
          calculoData: data.calculoData || null,
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
      salarioDiario: "",
      empleadoFechaInicio: "",
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

  // Calcular finiquito automáticamente cuando cambien los datos necesarios
  const finiquitoCalculado: FiniquitoResult | null = useMemo(() => {
    // Validar que tengamos todos los datos necesarios
    if (!formData.salarioDiario || !formData.empleadoFechaInicio || !formData.endDate) {
      return null;
    }

    const salario = parseFloat(formData.salarioDiario);
    if (isNaN(salario) || salario <= 0) {
      return null;
    }

    try {
      return calcularFiniquito({
        salarioDiario: salario,
        fechaInicio: formData.empleadoFechaInicio,
        fechaTerminacion: formData.endDate,
        bajaType: formData.bajaType,
        diasAguinaldoPagados: formData.diasAguinaldoPagados ? parseFloat(formData.diasAguinaldoPagados) : 0,
        diasVacacionesTomadas: formData.diasVacacionesTomadas ? parseFloat(formData.diasVacacionesTomadas) : 0,
      });
    } catch (error) {
      console.error("Error al calcular finiquito:", error);
      return null;
    }
  }, [formData.salarioDiario, formData.empleadoFechaInicio, formData.endDate, formData.bajaType, formData.diasAguinaldoPagados, formData.diasVacacionesTomadas]);

  const handleAprobarCalculo = () => {
    if (finiquitoCalculado) {
      updateFormData("calculoAprobado", true);
      updateFormData("calculoData", finiquitoCalculado);
      toast({
        title: "Cálculo aprobado",
        description: "El cálculo del finiquito ha sido aprobado y guardado.",
      });
    }
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
                      <Label htmlFor="empleadoFechaInicio">Fecha de Inicio Laboral *</Label>
                      <Input
                        id="empleadoFechaInicio"
                        type="date"
                        value={formData.empleadoFechaInicio}
                        onChange={(e) => updateFormData("empleadoFechaInicio", e.target.value)}
                        data-testid="input-empleado-fecha-inicio"
                      />
                      <p className="text-xs text-muted-foreground">Primer día de trabajo del empleado</p>
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
                      <p className="text-xs text-muted-foreground">Último día de trabajo</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="salarioDiario">Salario Diario Integrado *</Label>
                      <Input
                        id="salarioDiario"
                        type="number"
                        step="0.01"
                        value={formData.salarioDiario}
                        onChange={(e) => updateFormData("salarioDiario", e.target.value)}
                        placeholder="0.00"
                        data-testid="input-salario-diario"
                      />
                      <p className="text-xs text-muted-foreground">Incluye prestaciones y aguinaldo</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha de Inicio del Caso</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateFormData("startDate", e.target.value)}
                        data-testid="input-start-date"
                      />
                      <p className="text-xs text-muted-foreground">Fecha de inicio del proceso de baja</p>
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
              {/* Ajustes opcionales */}
              <Card>
                <CardHeader>
                  <CardTitle>Ajustes (Opcional)</CardTitle>
                  <CardDescription>Días ya pagados este año</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="diasAguinaldoPagados">Días de Aguinaldo Ya Pagados</Label>
                      <Input
                        id="diasAguinaldoPagados"
                        type="number"
                        step="0.01"
                        value={formData.diasAguinaldoPagados || ""}
                        onChange={(e) => updateFormData("diasAguinaldoPagados", e.target.value)}
                        placeholder="0"
                        data-testid="input-dias-aguinaldo-pagados"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diasVacacionesTomadas">Días de Vacaciones Ya Tomados</Label>
                      <Input
                        id="diasVacacionesTomadas"
                        type="number"
                        step="0.01"
                        value={formData.diasVacacionesTomadas || ""}
                        onChange={(e) => updateFormData("diasVacacionesTomadas", e.target.value)}
                        placeholder="0"
                        data-testid="input-dias-vacaciones-tomadas"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cálculo automático */}
              {finiquitoCalculado ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Cálculo de {finiquitoCalculado.informacionLaboral.añosTrabajados >= 1 && (formData.bajaType === 'despido_injustificado' || formData.bajaType === 'renuncia_con_causa') ? 'Liquidación' : 'Finiquito'}</CardTitle>
                          <CardDescription>Cálculo automático según Ley Federal del Trabajo</CardDescription>
                        </div>
                        {formData.calculoAprobado && (
                          <Badge variant="default">Aprobado</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Información laboral */}
                      <div className="bg-muted p-4 rounded-md space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Salario Diario</p>
                            <p className="font-medium">${finiquitoCalculado.informacionLaboral.salarioDiario.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Años Trabajados</p>
                            <p className="font-medium">{finiquitoCalculado.informacionLaboral.añosTrabajados.toFixed(2)} años</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Inicio</p>
                            <p className="font-medium">{new Date(finiquitoCalculado.informacionLaboral.fechaInicio).toLocaleDateString('es-MX')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Terminación</p>
                            <p className="font-medium">{new Date(finiquitoCalculado.informacionLaboral.fechaTerminacion).toLocaleDateString('es-MX')}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Desglose de conceptos */}
                      <div className="space-y-3">
                        <h4 className="font-semibold">Conceptos</h4>
                        {finiquitoCalculado.conceptos.map((concepto, index) => (
                          <div key={index} className="bg-background border rounded-md p-3 space-y-1">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">{concepto.concepto}</p>
                                <p className="text-sm text-muted-foreground">{concepto.descripcion}</p>
                                <p className="text-xs text-muted-foreground mt-1">{concepto.calculo}</p>
                              </div>
                              <p className="font-semibold text-right">${concepto.monto.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Totales */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal Percepciones</span>
                          <span className="font-medium">${finiquitoCalculado.desglose.subtotalPercepciones.toFixed(2)}</span>
                        </div>
                        {finiquitoCalculado.desglose.subtotalDeducciones > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal Deducciones</span>
                            <span className="font-medium text-destructive">-${finiquitoCalculado.desglose.subtotalDeducciones.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total a Pagar</span>
                          <span className="text-2xl font-bold text-primary">${finiquitoCalculado.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      {!formData.calculoAprobado ? (
                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={handleAprobarCalculo}
                            className="flex-1"
                            data-testid="button-aprobar-calculo"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aprobar Cálculo
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={() => setShowCartaModal(true)}
                            variant="default"
                            className="flex-1"
                            data-testid="button-ver-carta"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Carta de {finiquitoCalculado.informacionLaboral.añosTrabajados >= 1 && (formData.bajaType === 'despido_injustificado' || formData.bajaType === 'renuncia_con_causa') ? 'Liquidación' : 'Finiquito'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Complete los datos en el Paso 1 para calcular automáticamente el finiquito
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Se requiere: Salario Diario, Fecha Inicio Laboral y Fecha de Terminación
                    </p>
                  </CardContent>
                </Card>
              )}
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

      {/* Modal de Carta de Finiquito */}
      <Dialog open={showCartaModal} onOpenChange={setShowCartaModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carta de {finiquitoCalculado && finiquitoCalculado.informacionLaboral.añosTrabajados >= 1 && (formData.bajaType === 'despido_injustificado' || formData.bajaType === 'renuncia_con_causa') ? 'Liquidación' : 'Finiquito'}</DialogTitle>
          </DialogHeader>
          {finiquitoCalculado && (
            <CartaFiniquito
              employeeName={formData.employeeName}
              employeeId={formData.employeeId}
              fechaTerminacion={formData.endDate}
              calculo={finiquitoCalculado}
              esLiquidacion={finiquitoCalculado.informacionLaboral.añosTrabajados >= 1 && (formData.bajaType === 'despido_injustificado' || formData.bajaType === 'renuncia_con_causa')}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
