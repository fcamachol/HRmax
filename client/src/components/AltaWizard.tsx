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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HiringProcess } from "@shared/schema";
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Briefcase,
  ClipboardCheck,
  UserCheck
} from "lucide-react";

interface AltaWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProcess?: HiringProcess | null;
}

interface AltaFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  position: string;
  department: string;
  proposedSalary: string;
  startDate: string;
  contractType: string;
  email: string;
  phone: string;
  rfc: string;
  curp: string;
  nss: string;
  notes: string;
  // Documentos
  documentsChecklist: string[];
}

const WIZARD_STEPS = [
  { id: 1, title: "Información del Candidato", icon: FileText, description: "Datos personales" },
  { id: 2, title: "Datos de la Oferta", icon: Briefcase, description: "Puesto, salario y contrato" },
  { id: 3, title: "Documentación", icon: ClipboardCheck, description: "Documentos requeridos" },
  { id: 4, title: "Revisión", icon: UserCheck, description: "Confirmación final" },
];

const DOCUMENTOS_REQUERIDOS = [
  "Acta de nacimiento",
  "CURP",
  "RFC",
  "Comprobante de domicilio",
  "Identificación oficial",
  "Número de seguro social",
  "Certificado de estudios",
  "Carta de recomendación",
  "Comprobante bancario (CLABE)",
  "Fotografías",
];

const TIPOS_CONTRATO = [
  { value: "planta", label: "Planta" },
  { value: "temporal", label: "Temporal" },
  { value: "por_obra", label: "Por Obra" },
  { value: "honorarios", label: "Honorarios" },
  { value: "practicante", label: "Practicante" },
];

export function AltaWizard({ open, onOpenChange, existingProcess }: AltaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AltaFormData>({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    position: "",
    department: "",
    proposedSalary: "",
    startDate: new Date().toISOString().split('T')[0],
    contractType: "planta",
    email: "",
    phone: "",
    rfc: "",
    curp: "",
    nss: "",
    notes: "",
    documentsChecklist: [],
  });

  const { toast } = useToast();
  const isEditMode = !!existingProcess;

  useEffect(() => {
    if (open && existingProcess) {
      const docs = existingProcess.documentsChecklist as string[] | null;
      setFormData({
        nombre: existingProcess.nombre || "",
        apellidoPaterno: existingProcess.apellidoPaterno || "",
        apellidoMaterno: existingProcess.apellidoMaterno || "",
        position: existingProcess.position || "",
        department: existingProcess.department || "",
        proposedSalary: existingProcess.proposedSalary || "",
        startDate: existingProcess.startDate || new Date().toISOString().split('T')[0],
        contractType: existingProcess.contractType || "planta",
        email: existingProcess.email || "",
        phone: existingProcess.phone || "",
        rfc: existingProcess.rfc || "",
        curp: existingProcess.curp || "",
        nss: existingProcess.nss || "",
        notes: existingProcess.notes || "",
        documentsChecklist: docs || [],
      });
    } else if (open && !existingProcess) {
      resetWizard();
    }
  }, [open, existingProcess]);

  const resetWizard = () => {
    setCurrentStep(1);
    setFormData({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      position: "",
      department: "",
      proposedSalary: "",
      startDate: new Date().toISOString().split('T')[0],
      contractType: "planta",
      email: "",
      phone: "",
      rfc: "",
      curp: "",
      nss: "",
      notes: "",
      documentsChecklist: [],
    });
  };

  const saveProcessMutation = useMutation({
    mutationFn: async (data: AltaFormData) => {
      if (isEditMode && existingProcess) {
        const response = await apiRequest("PATCH", `/api/hiring/processes/${existingProcess.id}`, {
          nombre: data.nombre,
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          position: data.position,
          department: data.department,
          proposedSalary: data.proposedSalary,
          startDate: data.startDate,
          contractType: data.contractType,
          email: data.email,
          phone: data.phone,
          rfc: data.rfc,
          curp: data.curp,
          nss: data.nss,
          notes: data.notes,
          documentsChecklist: data.documentsChecklist,
        });
        return response;
      } else {
        const response = await apiRequest("POST", "/api/hiring/processes", {
          nombre: data.nombre,
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          position: data.position,
          department: data.department,
          proposedSalary: data.proposedSalary,
          startDate: data.startDate,
          contractType: data.contractType,
          email: data.email,
          phone: data.phone,
          rfc: data.rfc,
          curp: data.curp,
          nss: data.nss,
          notes: data.notes,
          stage: "oferta",
          status: "activo",
          documentsChecklist: data.documentsChecklist,
          offerLetterSent: "false",
        });
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hiring/processes"] });
      toast({
        title: isEditMode ? "Proceso actualizado" : "Proceso de contratación iniciado",
        description: isEditMode 
          ? "Los datos se han actualizado exitosamente" 
          : "El proceso se ha registrado en etapa de Carta Oferta",
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

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Validaciones básicas
    if (!formData.nombre.trim() || !formData.apellidoPaterno.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre y apellido paterno del candidato son requeridos",
        variant: "destructive",
      });
      return;
    }
    if (!formData.position.trim()) {
      toast({
        title: "Error de validación",
        description: "El puesto es requerido",
        variant: "destructive",
      });
      return;
    }
    if (!formData.proposedSalary) {
      toast({
        title: "Error de validación",
        description: "El salario es requerido",
        variant: "destructive",
      });
      return;
    }

    saveProcessMutation.mutate(formData);
  };

  const toggleDocument = (doc: string) => {
    setFormData(prev => {
      const checked = prev.documentsChecklist.includes(doc);
      return {
        ...prev,
        documentsChecklist: checked
          ? prev.documentsChecklist.filter(d => d !== doc)
          : [...prev.documentsChecklist, doc]
      };
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nombre" data-testid="label-nombre">Nombre(s) *</Label>
                <Input
                  id="nombre"
                  data-testid="input-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="apellidoPaterno" data-testid="label-apellido-paterno">Apellido Paterno *</Label>
                <Input
                  id="apellidoPaterno"
                  data-testid="input-apellido-paterno"
                  value={formData.apellidoPaterno}
                  onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                  placeholder="Pérez"
                />
              </div>
              <div>
                <Label htmlFor="apellidoMaterno" data-testid="label-apellido-materno">Apellido Materno</Label>
                <Input
                  id="apellidoMaterno"
                  data-testid="input-apellido-materno"
                  value={formData.apellidoMaterno}
                  onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                  placeholder="García (opcional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" data-testid="label-email">Correo Electrónico</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="phone" data-testid="label-phone">Teléfono</Label>
                <Input
                  id="phone"
                  data-testid="input-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="555-123-4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rfc" data-testid="label-rfc">RFC</Label>
                <Input
                  id="rfc"
                  data-testid="input-rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </div>
              <div>
                <Label htmlFor="curp" data-testid="label-curp">CURP</Label>
                <Input
                  id="curp"
                  data-testid="input-curp"
                  value={formData.curp}
                  onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                  placeholder="XAXX010101HDFXXX00"
                  maxLength={18}
                />
              </div>
              <div>
                <Label htmlFor="nss" data-testid="label-nss">Número de Seguro Social</Label>
                <Input
                  id="nss"
                  data-testid="input-nss"
                  value={formData.nss}
                  onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                  placeholder="12345678901"
                  maxLength={11}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position" data-testid="label-position">Puesto Ofrecido *</Label>
                <Input
                  id="position"
                  data-testid="input-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ej: Desarrollador Full Stack"
                />
              </div>
              <div>
                <Label htmlFor="department" data-testid="label-department">Departamento *</Label>
                <Input
                  id="department"
                  data-testid="input-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Ej: Tecnología"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposedSalary" data-testid="label-proposed-salary">Salario Mensual Bruto *</Label>
                <Input
                  id="proposedSalary"
                  data-testid="input-proposed-salary"
                  type="number"
                  step="0.01"
                  value={formData.proposedSalary}
                  onChange={(e) => setFormData({ ...formData, proposedSalary: e.target.value })}
                  placeholder="Ej: 25000.00"
                />
              </div>
              <div>
                <Label htmlFor="startDate" data-testid="label-start-date">Fecha de Inicio Propuesta</Label>
                <Input
                  id="startDate"
                  data-testid="input-start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="contractType" data-testid="label-contract-type">Tipo de Contrato</Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) => setFormData({ ...formData, contractType: value })}
              >
                <SelectTrigger id="contractType" data-testid="select-contract-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONTRATO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value} data-testid={`select-item-${tipo.value}`}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes" data-testid="label-notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                data-testid="textarea-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Cualquier información adicional relevante..."
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Documentos Requeridos</h4>
              <div className="space-y-2">
                {DOCUMENTOS_REQUERIDOS.map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <Checkbox
                      id={doc}
                      data-testid={`checkbox-${doc.toLowerCase().replace(/ /g, '-')}`}
                      checked={formData.documentsChecklist.includes(doc)}
                      onCheckedChange={() => toggleDocument(doc)}
                    />
                    <Label
                      htmlFor={doc}
                      className="text-sm font-normal cursor-pointer"
                      data-testid={`label-doc-${doc.toLowerCase().replace(/ /g, '-')}`}
                    >
                      {doc}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Proceso de Contratación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Candidato</h4>
                  <p className="text-base" data-testid="text-summary-candidate">
                    {formData.nombre} {formData.apellidoPaterno}{formData.apellidoMaterno ? ' ' + formData.apellidoMaterno : ''}
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Puesto</h4>
                    <p className="text-base" data-testid="text-summary-position">{formData.position}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Departamento</h4>
                    <p className="text-base" data-testid="text-summary-department">{formData.department}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Salario Mensual</h4>
                    <p className="text-base" data-testid="text-summary-salary">
                      ${parseFloat(formData.proposedSalary || "0").toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Tipo de Contrato</h4>
                    <p className="text-base" data-testid="text-summary-contract">
                      {TIPOS_CONTRATO.find(t => t.value === formData.contractType)?.label}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Fecha de Inicio</h4>
                  <p className="text-base" data-testid="text-summary-start-date">{formData.startDate}</p>
                </div>
                {formData.documentsChecklist.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Documentos Marcados ({formData.documentsChecklist.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.documentsChecklist.map((doc) => (
                          <Badge key={doc} variant="secondary" data-testid={`badge-doc-${doc.toLowerCase().replace(/ /g, '-')}`}>
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-wizard-title">
            {isEditMode ? "Editar Proceso de Contratación" : "Nuevo Proceso de Contratación"}
          </DialogTitle>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-between mb-6">
          {WIZARD_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${currentStep >= step.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-background border-muted-foreground text-muted-foreground'}
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <div className={`h-0.5 w-full mx-2 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Contenido del paso actual */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            
            {currentStep < WIZARD_STEPS.length ? (
              <Button
                onClick={handleNext}
                data-testid="button-next"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saveProcessMutation.isPending}
                data-testid="button-submit"
              >
                {saveProcessMutation.isPending ? "Guardando..." : isEditMode ? "Actualizar" : "Iniciar Proceso"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
