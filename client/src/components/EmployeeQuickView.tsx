import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar, 
  CreditCard, 
  MapPin,
  Building2,
  FileText,
  ChevronRight,
  X
} from "lucide-react";
import type { Employee } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmployeeQuickViewProps {
  employee: Employee;
  onViewDetails: () => void;
  onClose: () => void;
}

export function EmployeeQuickView({ employee, onViewDetails, onClose }: EmployeeQuickViewProps) {
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

  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return "N/A";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(num);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return format(d, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {getInitials(employee.nombre, employee.apellidoPaterno)}
              </AvatarFallback>
            </Avatar>
            <div>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-quick-view"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">
          {/* Información de Contacto */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Información de Contacto
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{employee.email || "No registrado"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{employee.telefono || "No registrado"}</span>
              </div>
              {employee.calle && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">
                    {employee.calle} {employee.numeroExterior}
                    {employee.numeroInterior && ` Int. ${employee.numeroInterior}`}, {employee.colonia}, {employee.municipio}, {employee.estado} {employee.codigoPostal}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Información Laboral */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Datos Laborales
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{employee.puesto}</p>
                  <p className="text-xs text-muted-foreground">{employee.departamento}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Fecha de Ingreso</p>
                  <p className="text-xs text-muted-foreground">{formatDate(employee.fechaIngreso)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Tipo de Contrato</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {employee.tipoContrato?.replace(/_/g, " ") || "No especificado"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información Fiscal y Salarial */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Información Fiscal y Salarial
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">RFC</p>
                <p className="text-sm font-mono font-medium uppercase">
                  {employee.rfc || "No registrado"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">CURP</p>
                <p className="text-sm font-mono font-medium uppercase">
                  {employee.curp || "No registrado"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">NSS</p>
                <p className="text-sm font-mono font-medium">
                  {employee.nss || "No registrado"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Salario Mensual</p>
                <p className="text-sm font-medium">
                  {formatCurrency(employee.salarioBrutoMensual)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información Bancaria */}
          {(employee.banco || employee.clabe) && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Información Bancaria
                </h3>
                <div className="grid gap-3">
                  {employee.banco && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{employee.banco}</p>
                        {employee.clabe && (
                          <p className="text-xs text-muted-foreground font-mono">
                            CLABE: {employee.clabe}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Botón Ver Detalle Completo */}
          <Button
            onClick={onViewDetails}
            className="w-full"
            size="lg"
            data-testid="button-view-full-details"
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Detalle Completo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
