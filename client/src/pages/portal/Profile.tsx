import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Calendar,
  CreditCard,
  Edit,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

interface InfoItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined | null;
}

function InfoRow({ icon: Icon, label, value }: InfoItem) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export default function PortalProfile() {
  const { employee, user, logout } = usePortalAuth();
  const [showEditRequest, setShowEditRequest] = useState(false);

  const getInitials = (nombre?: string, apellido?: string) => {
    const n = nombre?.charAt(0) || "";
    const a = apellido?.charAt(0) || "";
    return (n + a).toUpperCase() || "?";
  };

  const getFullAddress = () => {
    if (!employee) return null;
    const parts = [
      employee.calle,
      employee.numeroExterior,
      employee.colonia,
      employee.municipio,
      employee.estado,
      employee.codigoPostal,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/portal/login";
  };

  return (
    <PortalMobileLayout title="Mi Perfil">
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center py-4">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {getInitials(employee?.nombre, employee?.apellidoPaterno)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold">
            {employee?.nombre} {employee?.apellidoPaterno}
          </h1>
          <p className="text-sm text-muted-foreground">{employee?.puesto}</p>
          <Badge variant="secondary" className="mt-2">
            {employee?.numeroEmpleado}
          </Badge>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow icon={Mail} label="Correo" value={employee?.email || employee?.correo} />
            <InfoRow icon={Phone} label="Teléfono" value={employee?.telefono} />
            <InfoRow icon={MapPin} label="Dirección" value={getFullAddress()} />
            <InfoRow icon={CreditCard} label="RFC" value={employee?.rfc} />
            <InfoRow icon={CreditCard} label="CURP" value={employee?.curp} />
            <InfoRow icon={CreditCard} label="NSS" value={employee?.nss} />
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Información Laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow icon={Briefcase} label="Puesto" value={employee?.puesto} />
            <InfoRow icon={Building} label="Departamento" value={employee?.departamento} />
            <InfoRow
              icon={Calendar}
              label="Fecha de ingreso"
              value={
                employee?.fechaIngreso
                  ? new Date(employee.fechaIngreso).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null
              }
            />
            <InfoRow icon={Calendar} label="Tipo de contrato" value={employee?.tipoContrato} />
            <InfoRow icon={Calendar} label="Horario" value={employee?.horario} />
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Información Bancaria
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow icon={Building} label="Banco" value={employee?.banco} />
            <InfoRow
              icon={CreditCard}
              label="CLABE"
              value={employee?.clabe ? `****${employee.clabe.slice(-4)}` : null}
            />
          </CardContent>
        </Card>

        {/* Request Data Change */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => setShowEditRequest(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Solicitar cambio de datos
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </div>

      {/* Edit Request Sheet */}
      <BottomSheet
        isOpen={showEditRequest}
        onClose={() => setShowEditRequest(false)}
        title="Solicitar cambio"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para modificar tu información personal, contacta a Recursos Humanos.
          </p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between">
              Actualizar teléfono
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Actualizar dirección
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Actualizar cuenta bancaria
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Otro cambio
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </BottomSheet>
    </PortalMobileLayout>
  );
}
