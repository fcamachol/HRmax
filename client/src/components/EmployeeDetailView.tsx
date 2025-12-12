import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ChevronLeft, Edit } from "lucide-react";
import type { Employee } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmployeeDetailViewProps {
  employee: Employee;
  onBack: () => void;
  onEdit?: () => void;
}

interface FieldDisplayProps {
  label: string;
  value: string | number | boolean | null | undefined;
  type?: "text" | "currency" | "date" | "boolean";
}

function FieldDisplay({ label, value, type = "text" }: FieldDisplayProps) {
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

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{formatValue()}</p>
    </div>
  );
}

export function EmployeeDetailView({ employee, onBack, onEdit }: EmployeeDetailViewProps) {
  const [activeTab, setActiveTab] = useState("personal");

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
            {onEdit && (
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
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
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
                <FieldDisplay label="Nombre" value={employee.nombre} />
                <FieldDisplay label="Apellido Paterno" value={employee.apellidoPaterno} />
                <FieldDisplay label="Apellido Materno" value={employee.apellidoMaterno} />
                <FieldDisplay label="Género" value={employee.genero} />
                <FieldDisplay label="Estado Civil" value={employee.estadoCivil} />
                <FieldDisplay label="Lugar de Nacimiento" value={employee.lugarNacimiento} />
                <FieldDisplay label="Entidad de Nacimiento" value={employee.entidadNacimiento} />
                <FieldDisplay label="Nacionalidad" value={employee.nacionalidad} />
                <FieldDisplay label="Escolaridad" value={employee.escolaridad} />
                <FieldDisplay label="CURP" value={employee.curp} />
                <FieldDisplay label="RFC" value={employee.rfc} />
                <FieldDisplay label="NSS" value={employee.nss} />
              </div>
            </TabsContent>

            {/* Tab 2: Domicilio y Contacto */}
            <TabsContent value="domicilio" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Domicilio</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay label="Calle" value={employee.calle} />
                  <FieldDisplay label="Número Exterior" value={employee.numeroExterior} />
                  <FieldDisplay label="Número Interior" value={employee.numeroInterior} />
                  <FieldDisplay label="Colonia" value={employee.colonia} />
                  <FieldDisplay label="Municipio" value={employee.municipio} />
                  <FieldDisplay label="Estado" value={employee.estado} />
                  <FieldDisplay label="Código Postal" value={employee.codigoPostal} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay label="Teléfono" value={employee.telefono} />
                  <FieldDisplay label="Correo Electrónico" value={employee.email} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Contacto de Emergencia</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay label="Contacto de Emergencia" value={employee.contactoEmergencia} />
                  <FieldDisplay label="Parentesco" value={employee.parentescoEmergencia} />
                  <FieldDisplay label="Teléfono de Emergencia" value={employee.telefonoEmergencia} />
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Datos Laborales */}
            <TabsContent value="laboral" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FieldDisplay label="Número de Empleado" value={employee.numeroEmpleado} />
                <FieldDisplay label="Puesto" value={employee.puesto} />
                <FieldDisplay label="Departamento" value={employee.departamento} />
                <FieldDisplay label="Cliente o Proyecto" value={employee.clienteProyecto} />
                <FieldDisplay label="Jefe Directo" value={employee.jefeDirectoId} />
                <FieldDisplay label="Empresa ID" value={employee.empresaId} />
                <FieldDisplay label="Registro Patronal ID" value={employee.registroPatronalId} />
                <FieldDisplay label="Esquema de Contratación" value={employee.esquemaContratacion} />
                <FieldDisplay label="Tipo de Contrato" value={employee.tipoContrato} />
                <FieldDisplay label="Modalidad de Trabajo" value={employee.modalidadTrabajo} />
                <FieldDisplay label="Lugar de Trabajo" value={employee.lugarTrabajo} />
                <div className="md:col-span-3">
                  <FieldDisplay label="Funciones" value={employee.funciones} />
                </div>
                <FieldDisplay label="Días Laborales" value={employee.diasLaborales} />
                <FieldDisplay label="Horario" value={employee.horario} />
                <FieldDisplay label="Tipo de Jornada" value={employee.tipoJornada} />
                <FieldDisplay label="Tiempo para Alimentos" value={employee.tiempoParaAlimentos} />
                <FieldDisplay label="Días de Descanso" value={employee.diasDescanso} />
                <FieldDisplay label="Periodo de Prueba" value={employee.periodoPrueba} type="boolean" />
                <FieldDisplay label="Duración de Prueba (días)" value={employee.duracionPrueba} />
                <FieldDisplay label="Reconoce Antigüedad" value={employee.reconoceAntiguedad} type="boolean" />
                <FieldDisplay label="Fecha de Antigüedad" value={employee.fechaAntiguedad} type="date" />
                <FieldDisplay label="Fecha de Ingreso" value={employee.fechaIngreso} type="date" />
                <FieldDisplay label="Fecha Alta IMSS" value={employee.fechaAltaImss} type="date" />
                <FieldDisplay label="Fecha de Terminación" value={employee.fechaTerminacion} type="date" />
                <FieldDisplay label="Estatus" value={employee.estatus} />
              </div>
            </TabsContent>

            {/* Tab 4: Información Salarial */}
            <TabsContent value="salarial" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Salarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay 
                    label="Salario Mensual" 
                    value={employee.salarioBrutoMensual} 
                    type="currency" 
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
                  <FieldDisplay label="Periodicidad de Pago" value={employee.periodicidadPago} />
                  <FieldDisplay label="Día de Pago" value={employee.diaPago} />
                  <FieldDisplay label="Forma de Pago" value={employee.formaPago} />
                  <FieldDisplay label="Esquema de Pago" value={employee.esquemaPago} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Información Bancaria</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay label="Banco" value={employee.banco} />
                  <FieldDisplay label="Cuenta" value={employee.cuenta} />
                  <FieldDisplay label="CLABE" value={employee.clabe} />
                  <FieldDisplay label="Sucursal" value={employee.sucursal} />
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
                  <FieldDisplay label="Días de Vacaciones Adicionales" value={employee.diasVacacionesAdicionales} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Aguinaldo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay label="Días de Aguinaldo Adicionales" value={employee.diasAguinaldoAdicionales} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Créditos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FieldDisplay label="Crédito Infonavit" value={employee.creditoInfonavit} />
                  <FieldDisplay label="Número Fonacot" value={employee.numeroFonacot} />
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
      </Card>
    </div>
  );
}
