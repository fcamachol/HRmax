import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HiringProcess } from "@shared/schema";
import { extraerDatosCURP, validarFormatoCURP, obtenerNombreEstado } from "@shared/curpUtils";
import { ESTADOS_MEXICO, BANCOS_MEXICO, FORMAS_PAGO, TIPOS_CONTRATO, PARENTESCOS } from "@shared/catalogos";
import { ObjectUploader } from "@/components/ObjectUploader";
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronLeft,
  User,
  Briefcase,
  MapPin,
  Phone,
  Wallet,
  FileText,
  UserCheck,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AltaWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProcess?: HiringProcess | null;
}

interface DocumentInfo {
  name: string;
  uploaded: boolean;
  url?: string;
  uploadedAt?: string;
}

interface AltaFormData {
  // Paso 1: Información del Candidato
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  phone: string;
  curp: string;
  rfc: string;
  genero: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  
  // Paso 2: Datos de la Oferta
  puestoId: string; // ID del puesto (FK)
  departamentoId: string; // ID del departamento (FK)
  centroTrabajoId: string; // ID del centro de trabajo (FK)
  proposedSalary: string;
  contractType: string;
  contractDuration: string;
  startDate: string;
  
  // Paso 3: Datos de Domicilio
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  
  // Paso 4: Contacto de Emergencia
  contactoEmergencia: string;
  parentescoEmergencia: string;
  telefonoEmergencia: string;
  
  // Paso 5: Datos Bancarios y Fiscales
  nss: string;
  banco: string;
  clabe: string;
  sucursal: string;
  formaPago: string;
  
  // Paso 6: Documentación
  documentsChecklist: DocumentInfo[];
  notes: string;
}

const WIZARD_STEPS = [
  { id: 1, title: "Información del Candidato", icon: User, description: "Datos personales y CURP" },
  { id: 2, title: "Datos de la Oferta", icon: Briefcase, description: "Puesto y condiciones" },
  { id: 3, title: "Domicilio", icon: MapPin, description: "Dirección completa" },
  { id: 4, title: "Contacto de Emergencia", icon: Phone, description: "Persona de contacto" },
  { id: 5, title: "Datos Bancarios", icon: Wallet, description: "Información fiscal" },
  { id: 6, title: "Documentación", icon: FileText, description: "Documentos requeridos" },
  { id: 7, title: "Revisión", icon: UserCheck, description: "Confirmación final" },
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

export function AltaWizard({ open, onOpenChange, existingProcess }: AltaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [curpValidation, setCurpValidation] = useState<{ valido: boolean; errores: string[] }>({ valido: true, errores: [] });
  const [formData, setFormData] = useState<AltaFormData>({
    // Paso 1
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "",
    phone: "",
    curp: "",
    rfc: "",
    genero: "",
    fechaNacimiento: "",
    lugarNacimiento: "",
    
    // Paso 2
    puestoId: "",
    departamentoId: "",
    centroTrabajoId: "",
    proposedSalary: "",
    contractType: "planta",
    contractDuration: "",
    startDate: new Date().toISOString().split('T')[0],
    
    // Paso 3
    calle: "",
    numeroExterior: "",
    numeroInterior: "",
    colonia: "",
    municipio: "",
    estado: "",
    codigoPostal: "",
    
    // Paso 4
    contactoEmergencia: "",
    parentescoEmergencia: "",
    telefonoEmergencia: "",
    
    // Paso 5
    nss: "",
    banco: "",
    clabe: "",
    sucursal: "",
    formaPago: "transferencia",
    
    // Paso 6
    documentsChecklist: DOCUMENTOS_REQUERIDOS.map(name => ({ name, uploaded: false })),
    notes: "",
  });

  const { toast } = useToast();
  const isEditMode = !!existingProcess;

  // Query para obtener puestos
  const { data: puestos } = useQuery({
    queryKey: ["/api/organizacion/puestos"],
  });

  // Query para obtener departamentos
  const { data: departamentos } = useQuery({
    queryKey: ["/api/organizacion/departamentos"],
  });

  // Query para obtener centros de trabajo
  const { data: centrosTrabajo } = useQuery({
    queryKey: ["/api/organizacion/centros-trabajo"],
  });

  useEffect(() => {
    if (open && existingProcess) {
      // Cargar datos del proceso existente
      setFormData({
        nombre: existingProcess.nombre || "",
        apellidoPaterno: existingProcess.apellidoPaterno || "",
        apellidoMaterno: existingProcess.apellidoMaterno || "",
        email: existingProcess.email || "",
        phone: existingProcess.phone || "",
        curp: existingProcess.curp || "",
        rfc: existingProcess.rfc || "",
        genero: existingProcess.genero || "",
        fechaNacimiento: existingProcess.fechaNacimiento || "",
        lugarNacimiento: existingProcess.lugarNacimiento || "",
        puestoId: (existingProcess as any).puestoId || "",
        departamentoId: (existingProcess as any).departamentoId || "",
        centroTrabajoId: (existingProcess as any).centroTrabajoId || "",
        proposedSalary: existingProcess.proposedSalary || "",
        contractType: existingProcess.contractType || "planta",
        contractDuration: existingProcess.contractDuration || "",
        startDate: existingProcess.startDate || new Date().toISOString().split('T')[0],
        calle: (existingProcess as any).calle || "",
        numeroExterior: (existingProcess as any).numeroExterior || "",
        numeroInterior: (existingProcess as any).numeroInterior || "",
        colonia: (existingProcess as any).colonia || "",
        municipio: (existingProcess as any).municipio || "",
        estado: (existingProcess as any).estado || "",
        codigoPostal: (existingProcess as any).codigoPostal || "",
        contactoEmergencia: (existingProcess as any).contactoEmergencia || "",
        parentescoEmergencia: (existingProcess as any).parentescoEmergencia || "",
        telefonoEmergencia: (existingProcess as any).telefonoEmergencia || "",
        nss: existingProcess.nss || "",
        banco: (existingProcess as any).banco || "",
        clabe: (existingProcess as any).clabe || "",
        sucursal: (existingProcess as any).sucursal || "",
        formaPago: (existingProcess as any).formaPago || "transferencia",
        documentsChecklist: (existingProcess.documentsChecklist as DocumentInfo[]) || DOCUMENTOS_REQUERIDOS.map(name => ({ name, uploaded: false })),
        notes: existingProcess.notes || "",
      });
    } else if (open && !existingProcess) {
      resetWizard();
    }
  }, [open, existingProcess]);

  const resetWizard = () => {
    setCurrentStep(1);
    setCurpValidation({ valido: true, errores: [] });
    setFormData({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      email: "",
      phone: "",
      curp: "",
      rfc: "",
      genero: "",
      fechaNacimiento: "",
      lugarNacimiento: "",
      puestoId: "",
      departamentoId: "",
      centroTrabajoId: "",
      proposedSalary: "",
      contractType: "planta",
      contractDuration: "",
      startDate: new Date().toISOString().split('T')[0],
      calle: "",
      numeroExterior: "",
      numeroInterior: "",
      colonia: "",
      municipio: "",
      estado: "",
      codigoPostal: "",
      contactoEmergencia: "",
      parentescoEmergencia: "",
      telefonoEmergencia: "",
      nss: "",
      banco: "",
      clabe: "",
      sucursal: "",
      formaPago: "transferencia",
      documentsChecklist: DOCUMENTOS_REQUERIDOS.map(name => ({ name, uploaded: false })),
      notes: "",
    });
  };

  // Manejar cambio de CURP y extraer datos automáticamente
  const handleCurpChange = (value: string) => {
    const curpUpper = value.toUpperCase().trim();
    setFormData(prev => ({ ...prev, curp: curpUpper }));

    if (curpUpper.length === 18) {
      const validation = validarFormatoCURP(curpUpper);
      setCurpValidation(validation);

      if (validation.valido) {
        const datos = extraerDatosCURP(curpUpper);
        const nombreEstado = obtenerNombreEstado(datos.estadoNacimiento);
        
        setFormData(prev => ({
          ...prev,
          curp: curpUpper,
          rfc: datos.rfcParcial,
          genero: datos.genero || "",
          fechaNacimiento: datos.fechaNacimiento,
          lugarNacimiento: nombreEstado,
        }));

        toast({
          title: "CURP válido",
          description: "Se han extraído automáticamente los datos del CURP",
        });
      }
    } else if (curpUpper.length > 0) {
      setCurpValidation({ valido: false, errores: ["El CURP debe tener 18 caracteres"] });
    } else {
      setCurpValidation({ valido: true, errores: [] });
    }
  };

  const saveProcessMutation = useMutation({
    mutationFn: async (data: AltaFormData) => {
      const payload = {
        nombre: data.nombre,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        puestoId: data.puestoId,
        departamentoId: data.departamentoId,
        proposedSalary: data.proposedSalary,
        startDate: data.startDate,
        contractType: data.contractType,
        contractDuration: data.contractDuration,
        email: data.email,
        phone: data.phone,
        rfc: data.rfc,
        curp: data.curp,
        nss: data.nss,
        // Datos extraídos del CURP
        genero: data.genero,
        fechaNacimiento: data.fechaNacimiento || null,
        lugarNacimiento: data.lugarNacimiento,
        // Domicilio
        calle: data.calle,
        numeroExterior: data.numeroExterior,
        numeroInterior: data.numeroInterior,
        colonia: data.colonia,
        municipio: data.municipio,
        estado: data.estado,
        codigoPostal: data.codigoPostal,
        // Contacto emergencia
        contactoEmergencia: data.contactoEmergencia,
        parentescoEmergencia: data.parentescoEmergencia,
        telefonoEmergencia: data.telefonoEmergencia,
        // Datos bancarios
        banco: data.banco,
        clabe: data.clabe,
        sucursal: data.sucursal,
        formaPago: data.formaPago,
        // Centro trabajo
        centroTrabajoId: data.centroTrabajoId,
        notes: data.notes,
        documentsChecklist: data.documentsChecklist,
      };

      if (isEditMode && existingProcess) {
        return await apiRequest("PATCH", `/api/hiring/processes/${existingProcess.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/hiring/processes", {
          ...payload,
          stage: "oferta",
          status: "activo",
          offerLetterSent: "false",
        });
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
    // Validaciones por paso
    if (currentStep === 1) {
      if (!formData.curp || !formData.nombre.trim() || !formData.apellidoPaterno.trim() || !formData.email || !formData.phone || !formData.rfc) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos obligatorios",
          variant: "destructive",
        });
        return;
      }
      if (!curpValidation.valido) {
        toast({
          title: "CURP inválido",
          description: curpValidation.errores.join(", "),
          variant: "destructive",
        });
        return;
      }
      if (formData.rfc.length < 13) {
        toast({
          title: "RFC incompleto",
          description: "El RFC debe tener 13 caracteres (10 base + 3 homoclave)",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.puestoId || !formData.proposedSalary) {
        toast({
          title: "Campos requeridos",
          description: "El puesto y salario son obligatorios",
          variant: "destructive",
        });
        return;
      }
    }

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
    saveProcessMutation.mutate(formData);
  };

  const toggleDocument = (docName: string) => {
    setFormData(prev => {
      const docs = [...prev.documentsChecklist];
      const docIndex = docs.findIndex(d => d.name === docName);
      if (docIndex >= 0) {
        const currentlyUploaded = docs[docIndex].uploaded;
        docs[docIndex] = {
          name: docs[docIndex].name,
          uploaded: !currentlyUploaded,
          url: currentlyUploaded ? undefined : docs[docIndex].url,
          uploadedAt: currentlyUploaded ? undefined : docs[docIndex].uploadedAt
        };
      }
      return {
        ...prev,
        documentsChecklist: docs
      };
    });
  };

  const createUploadHandler = (docName: string) => {
    const getUploadParams = async () => {
      try {
        const response = await apiRequest("POST", "/api/objects/upload");
        const data = await response.json();
        return { method: "PUT" as const, url: data.uploadURL };
      } catch (error) {
        throw new Error("Error al obtener URL de subida");
      }
    };

    const handleUploadComplete = (result: { uploadURL: string }) => {
      setFormData(prev => {
        const docs = [...prev.documentsChecklist];
        const docIndex = docs.findIndex(d => d.name === docName);
        if (docIndex >= 0) {
          docs[docIndex] = {
            ...docs[docIndex],
            uploaded: true,
            url: result.uploadURL,
            uploadedAt: new Date().toISOString()
          };
        }
        return {
          ...prev,
          documentsChecklist: docs
        };
      });
    };

    return { getUploadParams, handleUploadComplete };
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Paso 1: Información del Candidato
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre" data-testid="label-nombre">
                  Nombre(s) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  data-testid="input-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre(s) del candidato"
                />
              </div>
              
              <div>
                <Label htmlFor="apellidoPaterno" data-testid="label-apellido-paterno">
                  Apellido Paterno <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apellidoPaterno"
                  data-testid="input-apellido-paterno"
                  value={formData.apellidoPaterno}
                  onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                  placeholder="Apellido paterno"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="apellidoMaterno" data-testid="label-apellido-materno">
                Apellido Materno
              </Label>
              <Input
                id="apellidoMaterno"
                data-testid="input-apellido-materno"
                value={formData.apellidoMaterno}
                onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                placeholder="Apellido materno"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" data-testid="label-email">
                  Correo Electrónico Personal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" data-testid="label-phone">
                  Teléfono Personal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  data-testid="input-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10 dígitos"
                  maxLength={10}
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="curp" data-testid="label-curp">
                CURP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="curp"
                data-testid="input-curp"
                value={formData.curp}
                onChange={(e) => handleCurpChange(e.target.value)}
                placeholder="18 caracteres"
                maxLength={18}
                className={!curpValidation.valido && formData.curp.length > 0 ? "border-destructive" : ""}
              />
              {!curpValidation.valido && formData.curp.length > 0 && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {curpValidation.errores.join(", ")}
                  </AlertDescription>
                </Alert>
              )}
              {curpValidation.valido && formData.curp.length === 18 && (
                <Alert className="mt-2">
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    CURP válido - Datos extraídos automáticamente
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rfc" data-testid="label-rfc">
                  RFC <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="rfc"
                    data-testid="input-rfc"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    placeholder="10 posiciones + 3 homoclave"
                    maxLength={13}
                    className={formData.rfc.length < 13 && formData.rfc.length >= 10 ? "pr-12" : ""}
                  />
                  {formData.rfc.length >= 10 && formData.rfc.length < 13 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive font-mono text-sm font-semibold">
                      {Array(13 - formData.rfc.length).fill('_').join('')}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.rfc.length >= 10 && formData.rfc.length < 13 ? (
                    <>
                      Completar homoclave <span className="text-destructive font-semibold">
                        ({13 - formData.rfc.length} {13 - formData.rfc.length === 1 ? 'carácter faltante' : 'caracteres faltantes'})
                      </span>
                    </>
                  ) : (
                    "Se auto-completan las primeras 10 posiciones del CURP"
                  )}
                </p>
              </div>
              
              <div>
                <Label htmlFor="genero" data-testid="label-genero">
                  Género (Auto-extraído)
                </Label>
                <Select 
                  value={formData.genero} 
                  onValueChange={(value) => setFormData({ ...formData, genero: value })}
                >
                  <SelectTrigger data-testid="select-genero">
                    <SelectValue placeholder="Selecciona género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="H">Hombre</SelectItem>
                    <SelectItem value="M">Mujer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaNacimiento" data-testid="label-fecha-nacimiento">
                  Fecha de Nacimiento (Auto-extraída)
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  data-testid="input-fecha-nacimiento"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="lugarNacimiento" data-testid="label-lugar-nacimiento">
                  Lugar de Nacimiento (Auto-extraído)
                </Label>
                <Input
                  id="lugarNacimiento"
                  data-testid="input-lugar-nacimiento"
                  value={formData.lugarNacimiento}
                  onChange={(e) => setFormData({ ...formData, lugarNacimiento: e.target.value })}
                  placeholder="Estado de nacimiento"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        // Paso 2: Datos de la Oferta
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position" data-testid="label-position">
                  Puesto <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.puestoId} 
                  onValueChange={(value) => setFormData({ ...formData, puestoId: value })}
                >
                  <SelectTrigger data-testid="select-position">
                    <SelectValue placeholder="Selecciona un puesto" />
                  </SelectTrigger>
                  <SelectContent>
                    {puestos && Array.isArray(puestos) && (puestos as Array<{id: string, nombrePuesto: string, clavePuesto: string}>).map((puesto) => {
                      return (
                        <SelectItem key={puesto.id} value={puesto.id}>
                          {puesto.clavePuesto} - {puesto.nombrePuesto}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="department" data-testid="label-department">
                  Departamento
                </Label>
                <Select 
                  value={formData.departamentoId} 
                  onValueChange={(value) => setFormData({ ...formData, departamentoId: value })}
                >
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos && Array.isArray(departamentos) && (departamentos as Array<{id: string, nombre: string}>).map((dept) => {
                      return (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.nombre}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="centroTrabajo" data-testid="label-centro-trabajo">
                Centro de Trabajo
              </Label>
              <Select 
                value={formData.centroTrabajoId} 
                onValueChange={(value) => setFormData({ ...formData, centroTrabajoId: value })}
              >
                <SelectTrigger data-testid="select-centro-trabajo">
                  <SelectValue placeholder="Selecciona un centro de trabajo" />
                </SelectTrigger>
                <SelectContent>
                  {centrosTrabajo && Array.isArray(centrosTrabajo) && (centrosTrabajo as Array<{id: string, nombre: string}>).map((centro) => {
                    return (
                      <SelectItem key={centro.id} value={centro.id}>
                        {centro.nombre}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposedSalary" data-testid="label-salary">
                  Salario Mensual Neto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="proposedSalary"
                  type="number"
                  data-testid="input-salary"
                  value={formData.proposedSalary}
                  onChange={(e) => setFormData({ ...formData, proposedSalary: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              
              <div>
                <Label htmlFor="startDate" data-testid="label-start-date">
                  Fecha de Inicio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  data-testid="input-start-date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractType" data-testid="label-contract-type">
                  Tipo de Contrato <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.contractType} 
                  onValueChange={(value) => setFormData({ ...formData, contractType: value })}
                >
                  <SelectTrigger data-testid="select-contract-type">
                    <SelectValue placeholder="Selecciona tipo de contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTRATO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(formData.contractType === "temporal" || formData.contractType === "por_obra") && (
                <div>
                  <Label htmlFor="contractDuration" data-testid="label-contract-duration">
                    Duración del Contrato
                  </Label>
                  <Input
                    id="contractDuration"
                    data-testid="input-contract-duration"
                    value={formData.contractDuration}
                    onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
                    placeholder="Ej: 6 meses, 1 año"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        // Paso 3: Datos de Domicilio
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="calle" data-testid="label-calle">
                  Calle
                </Label>
                <Input
                  id="calle"
                  data-testid="input-calle"
                  value={formData.calle}
                  onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                  placeholder="Nombre de la calle"
                />
              </div>
              
              <div>
                <Label htmlFor="numeroExterior" data-testid="label-numero-exterior">
                  Número Exterior
                </Label>
                <Input
                  id="numeroExterior"
                  data-testid="input-numero-exterior"
                  value={formData.numeroExterior}
                  onChange={(e) => setFormData({ ...formData, numeroExterior: e.target.value })}
                  placeholder="Núm. Ext."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroInterior" data-testid="label-numero-interior">
                  Número Interior
                </Label>
                <Input
                  id="numeroInterior"
                  data-testid="input-numero-interior"
                  value={formData.numeroInterior}
                  onChange={(e) => setFormData({ ...formData, numeroInterior: e.target.value })}
                  placeholder="Núm. Int. (opcional)"
                />
              </div>
              
              <div>
                <Label htmlFor="colonia" data-testid="label-colonia">
                  Colonia
                </Label>
                <Input
                  id="colonia"
                  data-testid="input-colonia"
                  value={formData.colonia}
                  onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                  placeholder="Colonia"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="municipio" data-testid="label-municipio">
                  Municipio / Alcaldía
                </Label>
                <Input
                  id="municipio"
                  data-testid="input-municipio"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  placeholder="Municipio"
                />
              </div>
              
              <div>
                <Label htmlFor="estado" data-testid="label-estado">
                  Estado
                </Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger data-testid="select-estado">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_MEXICO.map((estado) => (
                      <SelectItem key={estado.codigo} value={estado.nombre}>
                        {estado.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="codigoPostal" data-testid="label-codigo-postal">
                Código Postal
              </Label>
              <Input
                id="codigoPostal"
                data-testid="input-codigo-postal"
                value={formData.codigoPostal}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                placeholder="5 dígitos"
                maxLength={5}
              />
            </div>
          </div>
        );

      case 4:
        // Paso 4: Contacto de Emergencia
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactoEmergencia" data-testid="label-contacto-emergencia">
                Nombre Completo del Contacto
              </Label>
              <Input
                id="contactoEmergencia"
                data-testid="input-contacto-emergencia"
                value={formData.contactoEmergencia}
                onChange={(e) => setFormData({ ...formData, contactoEmergencia: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentescoEmergencia" data-testid="label-parentesco-emergencia">
                  Parentesco
                </Label>
                <Select 
                  value={formData.parentescoEmergencia} 
                  onValueChange={(value) => setFormData({ ...formData, parentescoEmergencia: value })}
                >
                  <SelectTrigger data-testid="select-parentesco-emergencia">
                    <SelectValue placeholder="Selecciona parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARENTESCOS.map((parentesco) => (
                      <SelectItem key={parentesco} value={parentesco}>
                        {parentesco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="telefonoEmergencia" data-testid="label-telefono-emergencia">
                  Teléfono de Contacto
                </Label>
                <Input
                  id="telefonoEmergencia"
                  data-testid="input-telefono-emergencia"
                  value={formData.telefonoEmergencia}
                  onChange={(e) => setFormData({ ...formData, telefonoEmergencia: e.target.value })}
                  placeholder="10 dígitos"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        // Paso 5: Datos Bancarios y Fiscales
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="nss" data-testid="label-nss">
                Número de Seguro Social (NSS)
              </Label>
              <Input
                id="nss"
                data-testid="input-nss"
                value={formData.nss}
                onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                placeholder="11 dígitos"
                maxLength={11}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banco" data-testid="label-banco">
                  Banco
                </Label>
                <Select 
                  value={formData.banco} 
                  onValueChange={(value) => setFormData({ ...formData, banco: value })}
                >
                  <SelectTrigger data-testid="select-banco">
                    <SelectValue placeholder="Selecciona un banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS_MEXICO.map((banco) => (
                      <SelectItem key={banco} value={banco}>
                        {banco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="clabe" data-testid="label-clabe">
                  CLABE Interbancaria
                </Label>
                <Input
                  id="clabe"
                  data-testid="input-clabe"
                  value={formData.clabe}
                  onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                  placeholder="18 dígitos"
                  maxLength={18}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sucursal" data-testid="label-sucursal">
                  Sucursal
                </Label>
                <Input
                  id="sucursal"
                  data-testid="input-sucursal"
                  value={formData.sucursal}
                  onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                  placeholder="Número de sucursal"
                />
              </div>
              
              <div>
                <Label htmlFor="formaPago" data-testid="label-forma-pago">
                  Forma de Pago
                </Label>
                <Select 
                  value={formData.formaPago} 
                  onValueChange={(value) => setFormData({ ...formData, formaPago: value })}
                >
                  <SelectTrigger data-testid="select-forma-pago">
                    <SelectValue placeholder="Selecciona forma de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGO.map((forma) => (
                      <SelectItem key={forma.value} value={forma.value}>
                        {forma.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 6:
        // Paso 6: Documentación
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Documentos Requeridos</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Marca los documentos recibidos o sube los archivos
              </p>
              <div className="space-y-3">
                {formData.documentsChecklist.map((doc) => (
                  <Card key={doc.name} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          id={doc.name}
                          data-testid={`checkbox-${doc.name.toLowerCase().replace(/ /g, '-')}`}
                          checked={doc.uploaded}
                          onCheckedChange={() => toggleDocument(doc.name)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={doc.name}
                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                            data-testid={`label-doc-${doc.name.toLowerCase().replace(/ /g, '-')}`}
                          >
                            {doc.name}
                            {doc.uploaded && (
                              <Badge variant="default" className="ml-2">
                                <Check className="w-3 h-3 mr-1" />
                                Recibido
                              </Badge>
                            )}
                          </Label>
                        </div>
                      </div>
                      
                      {!doc.uploaded && (() => {
                        const { getUploadParams, handleUploadComplete } = createUploadHandler(doc.name);
                        return (
                          <ObjectUploader
                            onGetUploadParameters={getUploadParams}
                            onComplete={handleUploadComplete}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              data-testid={`button-upload-${doc.name.toLowerCase().replace(/ /g, '-')}`}
                            >
                              Subir
                            </Button>
                          </ObjectUploader>
                        );
                      })()}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="notes" data-testid="label-notes">
                Notas Adicionales
              </Label>
              <Textarea
                id="notes"
                data-testid="textarea-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas, comentarios u observaciones..."
                rows={4}
              />
            </div>
          </div>
        );

      case 7:
        // Paso 7: Revisión Final
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Proceso de Contratación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Candidato</h4>
                  <p className="text-base" data-testid="text-summary-candidate">
                    {formData.nombre} {formData.apellidoPaterno} {formData.apellidoMaterno}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.email} • {formData.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CURP: {formData.curp} • RFC: {formData.rfc}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Puesto</h4>
                    <p className="text-base" data-testid="text-summary-position">
                      {(() => {
                        if (!formData.puestoId) return "No especificado";
                        const puesto = puestos && Array.isArray(puestos) 
                          ? (puestos as Array<{id: string, nombrePuesto: string, clavePuesto: string}>).find(p => p.id === formData.puestoId)
                          : null;
                        return puesto ? `${puesto.clavePuesto} - ${puesto.nombrePuesto}` : formData.puestoId;
                      })()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Departamento</h4>
                    <p className="text-base" data-testid="text-summary-department">
                      {(() => {
                        if (!formData.departamentoId) return "No especificado";
                        const dept = departamentos && Array.isArray(departamentos)
                          ? (departamentos as Array<{id: string, nombre: string}>).find(d => d.id === formData.departamentoId)
                          : null;
                        return dept ? dept.nombre : formData.departamentoId;
                      })()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Centro de Trabajo</h4>
                    <p className="text-base" data-testid="text-summary-centro-trabajo">
                      {(() => {
                        if (!formData.centroTrabajoId) return "No especificado";
                        const centro = centrosTrabajo && Array.isArray(centrosTrabajo)
                          ? (centrosTrabajo as Array<{id: string, nombre: string}>).find(c => c.id === formData.centroTrabajoId)
                          : null;
                        return centro ? centro.nombre : formData.centroTrabajoId;
                      })()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Salario Mensual Neto</h4>
                    <p className="text-base" data-testid="text-summary-salary">
                      ${parseFloat(formData.proposedSalary || "0").toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} MXN
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Fecha de Inicio</h4>
                    <p className="text-base" data-testid="text-summary-start-date">{formData.startDate}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Tipo de Contrato</h4>
                    <p className="text-base" data-testid="text-summary-contract">
                      {TIPOS_CONTRATO.find(t => t.value === formData.contractType)?.label || formData.contractType}
                    </p>
                  </div>
                  {formData.contactoEmergencia && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Contacto de Emergencia</h4>
                      <p className="text-base">{formData.contactoEmergencia}</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.parentescoEmergencia} • {formData.telefonoEmergencia}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Documentos</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.documentsChecklist.filter(d => d.uploaded).map((doc) => (
                      <Badge key={doc.name} variant="default">
                        <Check className="w-3 h-3 mr-1" />
                        {doc.name}
                      </Badge>
                    ))}
                    {formData.documentsChecklist.filter(d => !d.uploaded).map((doc) => (
                      <Badge key={doc.name} variant="outline">
                        <X className="w-3 h-3 mr-1" />
                        {doc.name}
                      </Badge>
                    ))}
                  </div>
                </div>
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
          <DialogTitle data-testid="dialog-title">
            {isEditMode ? "Editar Proceso de Alta" : "Nuevo Proceso de Alta"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      currentStep === step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : currentStep > step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground bg-muted text-muted-foreground"
                    }`}
                    data-testid={`step-${step.id}`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs mt-1 text-center max-w-[80px] hidden md:block">
                    {step.title}
                  </p>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`w-8 md:w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted-foreground"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-1" data-testid="step-title">
            {WIZARD_STEPS[currentStep - 1].title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4" data-testid="step-description">
            {WIZARD_STEPS[currentStep - 1].description}
          </p>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < WIZARD_STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              data-testid="button-next"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saveProcessMutation.isPending}
              data-testid="button-submit"
            >
              {saveProcessMutation.isPending ? "Guardando..." : isEditMode ? "Actualizar" : "Iniciar Proceso"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
