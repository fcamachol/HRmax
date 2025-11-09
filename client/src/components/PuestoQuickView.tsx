import { X, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Puesto } from "@shared/schema";

interface PuestoQuickViewProps {
  puesto: Puesto;
  employeeCount: number;
  onViewDetails: () => void;
  onClose: () => void;
}

export function PuestoQuickView({ puesto, employeeCount, onViewDetails, onClose }: PuestoQuickViewProps) {
  const compensacion = puesto.compensacionYPrestaciones as any;
  const condiciones = puesto.condicionesLaborales as any;
  const formacion = puesto.formacionAcademica as any;
  const experiencia = puesto.experienciaLaboral as any;

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "No especificado";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{puesto.nombrePuesto}</h1>
              <p className="text-muted-foreground">
                {puesto.clavePuesto} | {puesto.area || "Sin área"} | {puesto.departamento || "Sin departamento"}
              </p>
              <Badge variant={puesto.estatus === "activo" ? "default" : "secondary"} className="mt-2">
                {puesto.estatus === "activo" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-quick-view"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Propósito General */}
          {puesto.propositoGeneral && (
            <Card>
              <CardHeader>
                <CardTitle>Propósito del Puesto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{puesto.propositoGeneral}</p>
              </CardContent>
            </Card>
          )}

          {/* Información Organizacional */}
          <Card>
            <CardHeader>
              <CardTitle>Información Organizacional</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nivel Jerárquico</p>
                <p className="text-sm">{puesto.nivelJerarquico || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Puesto</p>
                <p className="text-sm">{puesto.tipoPuesto || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                <p className="text-sm">{puesto.ubicacion || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground"># Empleados Activos</p>
                <Badge variant="secondary" data-testid="badge-employee-count">{employeeCount}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Compensación */}
          {compensacion && (
            <Card>
              <CardHeader>
                <CardTitle>Compensación</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rango Salarial</p>
                  <p className="text-sm font-medium">
                    {compensacion.rangoSalarialMin && compensacion.rangoSalarialMax
                      ? `${formatCurrency(compensacion.rangoSalarialMin)} - ${formatCurrency(compensacion.rangoSalarialMax)}`
                      : "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Pago</p>
                  <p className="text-sm">{compensacion.tipoPago || "No especificado"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requisitos */}
          <Card>
            <CardHeader>
              <CardTitle>Requisitos Principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Formación Académica Requerida</p>
                <p className="text-sm">{formacion?.requerida || "No especificada"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Experiencia Laboral Requerida</p>
                <p className="text-sm">{experiencia?.requerida || "No especificada"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Condiciones Laborales */}
          {condiciones && (
            <Card>
              <CardHeader>
                <CardTitle>Condiciones Laborales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horario</p>
                  <p className="text-sm">{condiciones.horario || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Modalidad</p>
                  <p className="text-sm">{condiciones.modalidad || "No especificada"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center pt-6">
            <Button
              onClick={onViewDetails}
              size="lg"
              data-testid="button-view-full-details"
            >
              Ver Descripción Completa de Puesto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
