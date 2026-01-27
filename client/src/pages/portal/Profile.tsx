import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
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
  Eye,
  EyeOff,
  Copy,
  Check,
  Settings,
  HelpCircle,
  Bell,
  Lock,
  LogOut,
  Landmark,
  FileText,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InfoItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined | null;
  sensitive?: boolean;
  copyable?: boolean;
  onEdit?: () => void;
}

function InfoRow({ icon: Icon, label, value, sensitive, copyable, onEdit }: InfoItem) {
  const [isVisible, setIsVisible] = useState(!sensitive);
  const [copied, setCopied] = useState(false);

  if (!value && !onEdit) return null;

  const displayValue = value
    ? sensitive && !isVisible
      ? value.replace(/./g, "•").slice(0, 8) + value.slice(-4)
      : value
    : "No registrado";

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={cn(
          "text-sm font-medium break-words",
          value ? "text-gray-900 font-mono" : "text-gray-400 italic"
        )}>
          {displayValue}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {sensitive && value && (
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Edit className="h-4 w-4 text-[#135bec]" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function PortalProfile() {
  const { employee, logout, clienteId, refreshUser } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editSection, setEditSection] = useState<"identification" | "banking" | null>(null);

  // Form state for identification
  const [formData, setFormData] = useState({
    rfc: "",
    curp: "",
    nss: "",
    banco: "",
    clabe: "",
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar perfil");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente",
      });
      refreshUser();
      setShowEditSheet(false);
      setEditSection(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (nombre?: string, apellido?: string) => {
    const n = nombre?.charAt(0) || "";
    const a = apellido?.charAt(0) || "";
    return (n + a).toUpperCase() || "?";
  };

  const getSeniority = () => {
    if (!employee?.fechaIngreso) return null;
    const start = new Date(employee.fechaIngreso);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();

    let totalMonths = years * 12 + months;
    if (totalMonths < 0) totalMonths = 0;

    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;

    if (y === 0) return `${m} ${m === 1 ? "mes" : "meses"}`;
    if (m === 0) return `${y} ${y === 1 ? "año" : "años"}`;
    return `${y} ${y === 1 ? "año" : "años"}, ${m} ${m === 1 ? "mes" : "meses"}`;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = `/portal/${clienteId}/login`;
  };

  const openEditSheet = (section: "identification" | "banking") => {
    setEditSection(section);
    if (section === "identification") {
      setFormData({
        ...formData,
        rfc: employee?.rfc || "",
        curp: employee?.curp || "",
        nss: employee?.nss || "",
      });
    } else if (section === "banking") {
      setFormData({
        ...formData,
        banco: employee?.banco || "",
        clabe: employee?.clabe || "",
      });
    }
    setShowEditSheet(true);
  };

  const handleSave = () => {
    if (editSection === "identification") {
      updateProfileMutation.mutate({
        rfc: formData.rfc || undefined,
        curp: formData.curp || undefined,
        nss: formData.nss || undefined,
      });
    } else if (editSection === "banking") {
      updateProfileMutation.mutate({
        banco: formData.banco || undefined,
        clabe: formData.clabe || undefined,
      });
    }
  };

  const formatClabe = (value: string) => {
    // Only allow numbers and limit to 18 characters
    return value.replace(/\D/g, "").slice(0, 18);
  };

  return (
    <PortalMobileLayout title="Mi Perfil">
      <div className="bg-[#f6f6f8] min-h-screen pb-24">
        {/* Profile Header */}
        <div className="bg-white px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                <AvatarFallback className="text-2xl bg-[#135bec] text-white font-semibold">
                  {getInitials(employee?.nombre, employee?.apellidoPaterno)}
                </AvatarFallback>
              </Avatar>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-4">
              {employee?.nombre} {employee?.apellidoPaterno}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{employee?.puesto}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Identification Information */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Identificación
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[#135bec] hover:text-[#135bec]/80 hover:bg-blue-50"
                  onClick={() => openEditSheet("identification")}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              <InfoRow icon={CreditCard} label="RFC" value={employee?.rfc} sensitive copyable />
              <InfoRow icon={CreditCard} label="CURP" value={employee?.curp} sensitive copyable />
              <InfoRow icon={CreditCard} label="NSS (IMSS)" value={employee?.nss} sensitive copyable />
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-gray-500" />
                  Información Bancaria
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[#135bec] hover:text-[#135bec]/80 hover:bg-blue-50"
                  onClick={() => openEditSheet("banking")}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              <InfoRow icon={Building} label="Banco" value={employee?.banco} />
              <InfoRow icon={CreditCard} label="CLABE Interbancaria" value={employee?.clabe} sensitive copyable />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              <InfoRow icon={Mail} label="Correo electrónico" value={employee?.email} copyable />
              <InfoRow icon={Phone} label="Teléfono" value={employee?.telefono} copyable />
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                Información Laboral
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              <InfoRow icon={Building} label="Departamento" value={employee?.departamento} />
              <InfoRow icon={Calendar} label="Antigüedad" value={getSeniority()} />
            </CardContent>
          </Card>

          {/* Account Options */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900">Cambiar contraseña</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900">Notificaciones</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900">Ayuda y soporte</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Edit Bottom Sheet */}
      <BottomSheet
        isOpen={showEditSheet}
        onClose={() => {
          setShowEditSheet(false);
          setEditSection(null);
        }}
        title={editSection === "identification" ? "Editar Identificación" : "Editar Información Bancaria"}
      >
        <div className="space-y-4 pt-2">
          {editSection === "identification" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                  placeholder="XAXX010101000"
                  maxLength={13}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">13 caracteres para personas físicas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="curp">CURP</Label>
                <Input
                  id="curp"
                  value={formData.curp}
                  onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                  placeholder="XAXX010101HDFRRL09"
                  maxLength={18}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">18 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nss">NSS (Número de Seguro Social)</Label>
                <Input
                  id="nss"
                  value={formData.nss}
                  onChange={(e) => setFormData({ ...formData, nss: e.target.value.replace(/\D/g, "") })}
                  placeholder="12345678901"
                  maxLength={11}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">11 dígitos</p>
              </div>
            </>
          )}

          {editSection === "banking" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  placeholder="Ej: BBVA, Santander, Banorte"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clabe">CLABE Interbancaria</Label>
                <Input
                  id="clabe"
                  value={formData.clabe}
                  onChange={(e) => setFormData({ ...formData, clabe: formatClabe(e.target.value) })}
                  placeholder="000000000000000000"
                  maxLength={18}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">18 dígitos - Asegúrate de que sea correcta para recibir tu nómina</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-amber-800">
                  <strong>Importante:</strong> Verifica que la CLABE sea correcta. Los cambios en tu información bancaria pueden tardar hasta el siguiente periodo de nómina en aplicarse.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowEditSheet(false);
                setEditSection(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-[#135bec] hover:bg-[#0f4ed8]"
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </PortalMobileLayout>
  );
}
