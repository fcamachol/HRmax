import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, ChevronLeft, Edit, Save, Smartphone } from "lucide-react";
import type { Employee } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmployeeDetailViewProps {
  employee: Employee;
  onBack: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onSaveSuccess?: () => void;
}

interface FieldDisplayProps {
  label: string;
  value: string | number | boolean | null | undefined;
  type?: "text" | "currency" | "date" | "boolean";
  isEditing?: boolean;
  fieldName?: string;
  onChange?: (value: string) => void;
  inputType?: "text" | "date" | "number" | "email" | "select";
  selectOptions?: { value: string; label: string }[];
}

function FieldDisplay({
  label,
  value,
  type = "text",
  isEditing,
  fieldName,
  onChange,
  inputType = "text",
  selectOptions
}: FieldDisplayProps) {
  const formatValue = () => {
    if (value === null || value === undefined || value === "") return "No registrado";

    switch (type) {
      case "currency":
        const num = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(num as number)) return "No registrado";
        return new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(num as number);

      case "date":
        if (typeof value === "boolean" || typeof value === "number") return "No registrado";
        try {
          const dateValue = value as string | Date;
          const d = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
          if (isNaN(d.getTime())) return "No registrado";
          return format(d, "dd 'de' MMMM 'de' yyyy", { locale: es });
        } catch {
          return "No registrado";
        }

      case "boolean":
        return value ? "Sí" : "No";

      default:
        return String(value);
    }
  };

  if (isEditing && onChange && fieldName) {
    if (inputType === "select" && selectOptions) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Select
            value={String(value || "")}
            onValueChange={onChange}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Input
          type={inputType}
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{formatValue()}</p>
    </div>
  );
}

export function EmployeeDetailView({ employee, onBack, onEdit, isEditing, onCancelEdit, onSaveSuccess }: EmployeeDetailViewProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData({ ...employee });
    }
  }, [isEditing, employee]);

  const mutation = useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      return await apiRequest("PATCH", `/api/employees/${employee.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Empleado actualizado",
        description: "Los cambios han sido guardados correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      onSaveSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar los cambios",
        variant: "destructive",
      });
    },
  });

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = () => {
    mutation.mutate(formData);
  };

  const getInitials = (nombre: string, apellidoPaterno: string) => {
    return `${nombre.charAt(0)}${apellidoPaterno.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "activo":
        return <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>;
      case "inactivo":
        return <Badge variant="secondary">Inactivo</Badge>;
      case "licencia":
        return <Badge variant="outline">En Licencia</Badge>;
      default:
        return <Badge variant="secondary">{status || "N/A"}</Badge>;
    }
  };

  // Helper to get field value (from formData when editing, from employee otherwise)
  const getValue = (field: keyof Employee) => {
    return isEditing ? formData[field] : employee[field];
  };

  const departamentoOptions = [
    { value: "Ventas", label: "Ventas" },
    { value: "IT", label: "IT" },
    { value: "RRHH", label: "RRHH" },
    { value: "Finanzas", label: "Finanzas" },
    { value: "Operaciones", label: "Operaciones" },
  ];

  const tipoContratoOptions = [
    { value: "indeterminado", label: "Indeterminado" },
    { value: "temporal", label: "Temporal" },
    { value: "por_obra", label: "Por Obra" },
    { value: "honorarios", label: "Honorarios" },
  ];

  const estatusOptions = [
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
    { value: "licencia", label: "En Licencia" },
  ];

  const generoOptions = [
    { value: "masculino", label: "Masculino" },
    { value: "femenino", label: "Femenino" },
    { value: "otro", label: "Otro" },
  ];

  const estadoCivilOptions = [
    { value: "soltero", label: "Soltero(a)" },
    { value: "casado", label: "Casado(a)" },
    { value: "divorciado", label: "Divorciado(a)" },
    { value: "viudo", label: "Viudo(a)" },
    { value: "union_libre", label: "Unión Libre" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4 border-b flex-shrink-0">
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {getInitials(employee.nombre, employee.apellidoPaterno)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {employee.nombre} {employee.apellidoPaterno} {employee.apellidoMaterno || ""}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {employee.puesto} • {employee.departamento}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(employee.estatus)}
                <Badge variant="outline">#{employee.numeroEmpleado}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                data-testid="button-edit-employee"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  data-testid="button-save-employee"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {mutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelEdit}
                  disabled={mutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={isEditing ? onCancelEdit : onBack}
              data-testid="button-close-detail-view"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="personal" data-testid="tab-personal">
                Información Personal
              </TabsTrigger>
              <TabsTrigger value="domicilio" data-testid="tab-domicilio">
                Domicilio y Contacto
              </TabsTrigger>
              <TabsTrigger value="laboral" data-testid="tab-laboral">
                Datos Laborales
              </TabsTrigger>
              <TabsTrigger value="salarial" data-testid="tab-salarial">
                Información Salarial
              </TabsTrigger>
              <TabsTrigger value="prestaciones" data-testid="tab-prestaciones">
                Prestaciones
              </TabsTrigger>
              <TabsTrigger value="documentacion" data-testid="tab-documentacion">
                Documentación
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Información Personal */}
            <TabsContent value="personal" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FieldDisplay
                  label="Nombre"
                  value={getValue("nombre")}
                  isEditing={isEditing}
                  fieldName="nombre"
                  onChange={(v) => handleFieldChange("nombre", v)}
                />
                <FieldDisplay
                  label="Apellido Paterno"
                  value={getValue("apellidoPaterno")}
                  isEditing={isEditing}
                  fieldName="apellidoPaterno"
                  onChange={(v) => handleFieldChange("apellidoPaterno", v)}
                />
                <FieldDisplay
                  label="Apellido Materno"
                  value={getValue("apellidoMaterno")}
                  isEditing={isEditing}
                  fieldName="apellidoMaterno"
                  onChange={(v) => handleFieldChange("apellidoMaterno", v)}
                />
                <FieldDisplay
                  label="Género"
                  value={getValue("genero")}
                  isEditing={isEditing}
                  fieldName="genero"
                  onChange={(v) => handleFieldChange("genero", v)}
                  inputType="select"
                  selectOptions={generoOptions}
                />
                <FieldDisplay
                  label="Estado Civil"
                  value={getValue("estadoCivil")}
                  isEditing={isEditing}
                  fieldName="estadoCivil"
                  onChange={(v) => handleFieldChange("estadoCivil", v)}
                  inputType="select"
                  selectOptions={estadoCivilOptions}
                />
                <FieldDisplay
                  label="Lugar de Nacimiento"
                  value={getValue("lugarNacimiento")}
                  isEditing={isEditing}
                  fieldName="lugarNacimiento"
                  onChange={(v) => handleFieldChange("lugarNacimiento", v)}
                />
                <FieldDisplay
                  label="Entidad de Nacimiento"
                  value={getValue("entidadNacimiento")}
                  isEditing={isEditing}
                  fieldName="entidadNacimiento"
                  onChange={(v) => handleFieldChange("entidadNacimiento", v)}
                />
                <FieldDisplay
                  label="Nacionalidad"
                  value={getValue("nacionalidad")}
                  isEditing={isEditing}
                  fieldName="nacionalidad"
                  onChange={(v) => handleFieldChange("nacionalidad", v)}
                />
                <FieldDisplay
                  label="Escolaridad"
                  value={getValue("escolaridad")}
                  isEditing={isEditing}
                  fieldName="escolaridad"
                  onChange={(v) => handleFieldChange("escolaridad", v)}
                />
                <FieldDisplay
                  label="CURP"
                  value={getValue("curp")}
                  isEditing={isEditing}
                  fieldName="curp"
                  onChange={(v) => handleFieldChange("curp", v)}
                />
                <FieldDisplay
                  label="RFC"
                  value={getValue("rfc")}
                  isEditing={isEditing}
                  fieldName="rfc"
                  onChange={(v) => handleFieldChange("rfc", v)}
                />
                <FieldDisplay
                  label="NSS"
                  value={getValue("nss")}
                  isEditing={isEditing}
                  fieldName="nss"
                  onChange={(v) => handleFieldChange("nss", v)}
                />
              </div>
            </TabsContent>

            {/* Tab 2: Domicilio y Contacto */}
            <TabsContent value="domicilio" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Domicilio</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay
                    label="Calle"
                    value={getValue("calle")}
                    isEditing={isEditing}
                    fieldName="calle"
                    onChange={(v) => handleFieldChange("calle", v)}
                  />
                  <FieldDisplay
                    label="Número Exterior"
                    value={getValue("numeroExterior")}
                    isEditing={isEditing}
                    fieldName="numeroExterior"
                    onChange={(v) => handleFieldChange("numeroExterior", v)}
                  />
                  <FieldDisplay
                    label="Número Interior"
                    value={getValue("numeroInterior")}
                    isEditing={isEditing}
                    fieldName="numeroInterior"
                    onChange={(v) => handleFieldChange("numeroInterior", v)}
                  />
                  <FieldDisplay
                    label="Colonia"
                    value={getValue("colonia")}
                    isEditing={isEditing}
                    fieldName="colonia"
                    onChange={(v) => handleFieldChange("colonia", v)}
                  />
                  <FieldDisplay
                    label="Municipio"
                    value={getValue("municipio")}
                    isEditing={isEditing}
                    fieldName="municipio"
                    onChange={(v) => handleFieldChange("municipio", v)}
                  />
                  <FieldDisplay
                    label="Estado"
                    value={getValue("estado")}
                    isEditing={isEditing}
                    fieldName="estado"
                    onChange={(v) => handleFieldChange("estado", v)}
                  />
                  <FieldDisplay
                    label="Código Postal"
                    value={getValue("codigoPostal")}
                    isEditing={isEditing}
                    fieldName="codigoPostal"
                    onChange={(v) => handleFieldChange("codigoPostal", v)}
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay
                    label="Teléfono"
                    value={getValue("telefono")}
                    isEditing={isEditing}
                    fieldName="telefono"
                    onChange={(v) => handleFieldChange("telefono", v)}
                  />
                  <FieldDisplay
                    label="Correo Electrónico"
                    value={getValue("email")}
                    isEditing={isEditing}
                    fieldName="email"
                    onChange={(v) => handleFieldChange("email", v)}
                    inputType="email"
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Contacto de Emergencia</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay
                    label="Contacto de Emergencia"
                    value={getValue("contactoEmergencia")}
                    isEditing={isEditing}
                    fieldName="contactoEmergencia"
                    onChange={(v) => handleFieldChange("contactoEmergencia", v)}
                  />
                  <FieldDisplay
                    label="Parentesco"
                    value={getValue("parentescoEmergencia")}
                    isEditing={isEditing}
                    fieldName="parentescoEmergencia"
                    onChange={(v) => handleFieldChange("parentescoEmergencia", v)}
                  />
                  <FieldDisplay
                    label="Teléfono de Emergencia"
                    value={getValue("telefonoEmergencia")}
                    isEditing={isEditing}
                    fieldName="telefonoEmergencia"
                    onChange={(v) => handleFieldChange("telefonoEmergencia", v)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Datos Laborales */}
            <TabsContent value="laboral" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FieldDisplay
                  label="Número de Empleado"
                  value={getValue("numeroEmpleado")}
                  isEditing={isEditing}
                  fieldName="numeroEmpleado"
                  onChange={(v) => handleFieldChange("numeroEmpleado", v)}
                />
                <FieldDisplay
                  label="Puesto"
                  value={getValue("puesto")}
                  isEditing={isEditing}
                  fieldName="puesto"
                  onChange={(v) => handleFieldChange("puesto", v)}
                />
                <FieldDisplay
                  label="Departamento"
                  value={getValue("departamento")}
                  isEditing={isEditing}
                  fieldName="departamento"
                  onChange={(v) => handleFieldChange("departamento", v)}
                  inputType="select"
                  selectOptions={departamentoOptions}
                />
                <FieldDisplay
                  label="Cliente o Proyecto"
                  value={getValue("clienteProyecto")}
                  isEditing={isEditing}
                  fieldName="clienteProyecto"
                  onChange={(v) => handleFieldChange("clienteProyecto", v)}
                />
                <FieldDisplay label="Jefe Directo" value={employee.jefeDirectoId} />
                <FieldDisplay label="Empresa ID" value={employee.empresaId} />
                <FieldDisplay label="Registro Patronal ID" value={employee.registroPatronalId} />
                <FieldDisplay
                  label="Esquema de Contratación"
                  value={getValue("esquemaContratacion")}
                  isEditing={isEditing}
                  fieldName="esquemaContratacion"
                  onChange={(v) => handleFieldChange("esquemaContratacion", v)}
                />
                <FieldDisplay
                  label="Tipo de Contrato"
                  value={getValue("tipoContrato")}
                  isEditing={isEditing}
                  fieldName="tipoContrato"
                  onChange={(v) => handleFieldChange("tipoContrato", v)}
                  inputType="select"
                  selectOptions={tipoContratoOptions}
                />
                <FieldDisplay
                  label="Modalidad de Trabajo"
                  value={getValue("modalidadTrabajo")}
                  isEditing={isEditing}
                  fieldName="modalidadTrabajo"
                  onChange={(v) => handleFieldChange("modalidadTrabajo", v)}
                />
                <FieldDisplay
                  label="Lugar de Trabajo"
                  value={getValue("lugarTrabajo")}
                  isEditing={isEditing}
                  fieldName="lugarTrabajo"
                  onChange={(v) => handleFieldChange("lugarTrabajo", v)}
                />
                <div className="md:col-span-3">
                  <FieldDisplay
                    label="Funciones"
                    value={getValue("funciones")}
                    isEditing={isEditing}
                    fieldName="funciones"
                    onChange={(v) => handleFieldChange("funciones", v)}
                  />
                </div>
                <FieldDisplay
                  label="Días Laborales"
                  value={getValue("diasLaborales")}
                  isEditing={isEditing}
                  fieldName="diasLaborales"
                  onChange={(v) => handleFieldChange("diasLaborales", v)}
                />
                <FieldDisplay
                  label="Horario"
                  value={getValue("horario")}
                  isEditing={isEditing}
                  fieldName="horario"
                  onChange={(v) => handleFieldChange("horario", v)}
                />
                <FieldDisplay
                  label="Tipo de Jornada"
                  value={getValue("tipoJornada")}
                  isEditing={isEditing}
                  fieldName="tipoJornada"
                  onChange={(v) => handleFieldChange("tipoJornada", v)}
                />
                <FieldDisplay
                  label="Tiempo para Alimentos"
                  value={getValue("tiempoParaAlimentos")}
                  isEditing={isEditing}
                  fieldName="tiempoParaAlimentos"
                  onChange={(v) => handleFieldChange("tiempoParaAlimentos", v)}
                />
                <FieldDisplay
                  label="Días de Descanso"
                  value={getValue("diasDescanso")}
                  isEditing={isEditing}
                  fieldName="diasDescanso"
                  onChange={(v) => handleFieldChange("diasDescanso", v)}
                />
                <FieldDisplay label="Periodo de Prueba" value={employee.periodoPrueba} type="boolean" />
                <FieldDisplay label="Duración de Prueba (días)" value={employee.duracionPrueba} />
                <FieldDisplay label="Reconoce Antigüedad" value={employee.reconoceAntiguedad} type="boolean" />
                <FieldDisplay
                  label="Fecha de Antigüedad"
                  value={getValue("fechaAntiguedad")}
                  type={isEditing ? undefined : "date"}
                  isEditing={isEditing}
                  fieldName="fechaAntiguedad"
                  onChange={(v) => handleFieldChange("fechaAntiguedad", v)}
                  inputType="date"
                />
                <FieldDisplay
                  label="Fecha de Ingreso"
                  value={getValue("fechaIngreso")}
                  type={isEditing ? undefined : "date"}
                  isEditing={isEditing}
                  fieldName="fechaIngreso"
                  onChange={(v) => handleFieldChange("fechaIngreso", v)}
                  inputType="date"
                />
                <FieldDisplay
                  label="Fecha Alta IMSS"
                  value={getValue("fechaAltaImss")}
                  type={isEditing ? undefined : "date"}
                  isEditing={isEditing}
                  fieldName="fechaAltaImss"
                  onChange={(v) => handleFieldChange("fechaAltaImss", v)}
                  inputType="date"
                />
                <FieldDisplay
                  label="Fecha de Terminación"
                  value={getValue("fechaTerminacion")}
                  type={isEditing ? undefined : "date"}
                  isEditing={isEditing}
                  fieldName="fechaTerminacion"
                  onChange={(v) => handleFieldChange("fechaTerminacion", v)}
                  inputType="date"
                />
                <FieldDisplay
                  label="Estatus"
                  value={getValue("estatus")}
                  isEditing={isEditing}
                  fieldName="estatus"
                  onChange={(v) => handleFieldChange("estatus", v)}
                  inputType="select"
                  selectOptions={estatusOptions}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Portal de Empleados
                </h3>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="portal-access" className="text-sm font-medium">
                      Acceso al Portal
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Permite al empleado acceder al portal con su RFC
                    </p>
                  </div>
                  <Switch
                    id="portal-access"
                    checked={getValue("portalActivo") as boolean ?? true}
                    onCheckedChange={(checked) => handleFieldChange("portalActivo", String(checked))}
                    disabled={!isEditing}
                  />
                </div>
                {employee.portalPassword && (
                  <p className="text-xs text-muted-foreground mt-2">
                    El empleado ya configuró su contraseña del portal
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Tab 4: Información Salarial */}
            <TabsContent value="salarial" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Salarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay
                    label="Salario Mensual"
                    value={getValue("salarioBrutoMensual")}
                    type={isEditing ? undefined : "currency"}
                    isEditing={isEditing}
                    fieldName="salarioBrutoMensual"
                    onChange={(v) => handleFieldChange("salarioBrutoMensual", v)}
                    inputType="number"
                  />
                  <FieldDisplay label="Base de Cálculo" value={employee.tipoEsquema === 'BRUTO' ? 'Bruto' : 'Neto'} />
                  <FieldDisplay label="Percepción Total Diaria" value={employee.salarioDiarioReal} type="currency" />
                  <FieldDisplay label="Salario Diario Nominal" value={employee.salarioDiarioNominal} type="currency" />
                  <FieldDisplay label="Percepción Adicional Diaria" value={employee.salarioDiarioExento} type="currency" />
                  <FieldDisplay label="Salario Base de Cotización (SBC)" value={employee.sbc} type="currency" />
                  <FieldDisplay label="Salario Diario Integrado (SDI)" value={employee.sdi} type="currency" />
                  <FieldDisplay label="Tabla IMSS" value={employee.tablaImss} />
                  <FieldDisplay label="Tipo de Cálculo de Salario" value={employee.tipoCalculoSalario} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Información de Pago</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay
                    label="Periodicidad de Pago"
                    value={getValue("periodicidadPago")}
                    isEditing={isEditing}
                    fieldName="periodicidadPago"
                    onChange={(v) => handleFieldChange("periodicidadPago", v)}
                  />
                  <FieldDisplay
                    label="Día de Pago"
                    value={getValue("diaPago")}
                    isEditing={isEditing}
                    fieldName="diaPago"
                    onChange={(v) => handleFieldChange("diaPago", v)}
                  />
                  <FieldDisplay
                    label="Forma de Pago"
                    value={getValue("formaPago")}
                    isEditing={isEditing}
                    fieldName="formaPago"
                    onChange={(v) => handleFieldChange("formaPago", v)}
                  />
                  <FieldDisplay
                    label="Esquema de Pago"
                    value={getValue("esquemaPago")}
                    isEditing={isEditing}
                    fieldName="esquemaPago"
                    onChange={(v) => handleFieldChange("esquemaPago", v)}
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Información Bancaria</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay
                    label="Banco"
                    value={getValue("banco")}
                    isEditing={isEditing}
                    fieldName="banco"
                    onChange={(v) => handleFieldChange("banco", v)}
                  />
                  <FieldDisplay
                    label="Cuenta"
                    value={getValue("cuenta")}
                    isEditing={isEditing}
                    fieldName="cuenta"
                    onChange={(v) => handleFieldChange("cuenta", v)}
                  />
                  <FieldDisplay
                    label="CLABE"
                    value={getValue("clabe")}
                    isEditing={isEditing}
                    fieldName="clabe"
                    onChange={(v) => handleFieldChange("clabe", v)}
                  />
                  <FieldDisplay
                    label="Sucursal"
                    value={getValue("sucursal")}
                    isEditing={isEditing}
                    fieldName="sucursal"
                    onChange={(v) => handleFieldChange("sucursal", v)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 5: Prestaciones y Beneficios */}
            <TabsContent value="prestaciones" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Vacaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay label="Días de Vacaciones Anuales" value={employee.diasVacacionesAnuales} />
                  <FieldDisplay label="Días de Vacaciones Disponibles" value={employee.diasVacacionesDisponibles} />
                  <FieldDisplay label="Días de Vacaciones Usados" value={employee.diasVacacionesUsados} />
                  <FieldDisplay
                    label="Días de Vacaciones Adicionales"
                    value={getValue("diasVacacionesAdicionales")}
                    isEditing={isEditing}
                    fieldName="diasVacacionesAdicionales"
                    onChange={(v) => handleFieldChange("diasVacacionesAdicionales", v)}
                    inputType="number"
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Aguinaldo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay
                    label="Días de Aguinaldo Adicionales"
                    value={getValue("diasAguinaldoAdicionales")}
                    isEditing={isEditing}
                    fieldName="diasAguinaldoAdicionales"
                    onChange={(v) => handleFieldChange("diasAguinaldoAdicionales", v)}
                    inputType="number"
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Créditos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay
                    label="Crédito Infonavit"
                    value={getValue("creditoInfonavit")}
                    isEditing={isEditing}
                    fieldName="creditoInfonavit"
                    onChange={(v) => handleFieldChange("creditoInfonavit", v)}
                  />
                  <FieldDisplay
                    label="Número Fonacot"
                    value={getValue("numeroFonacot")}
                    isEditing={isEditing}
                    fieldName="numeroFonacot"
                    onChange={(v) => handleFieldChange("numeroFonacot", v)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 6: Documentación */}
            <TabsContent value="documentacion" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FieldDisplay label="Contrato Laboral" value={employee.documentoContratoId} />
                <FieldDisplay label="Drive ID" value={employee.driveId} />
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  La gestión completa de documentos estará disponible próximamente.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {!isEditing && (
        <div className="border-t p-4 flex justify-start flex-shrink-0">
          <Button
            variant="outline"
            onClick={onBack}
            data-testid="button-back-to-quick-view"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Resumen
          </Button>
        </div>
        )}
      </Card>
    </div>
  );
}
