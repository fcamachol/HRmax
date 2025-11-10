import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { insertIncapacidadSchema, type InsertIncapacidad, type Incapacidad } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Info, Upload, FileText, ExternalLink } from "lucide-react";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

interface IncapacidadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertIncapacidad) => void;
  initialData?: Incapacidad | null;
  isPending?: boolean;
}

export function IncapacidadForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isPending = false,
}: IncapacidadFormProps) {
  const form = useForm<InsertIncapacidad>({
    resolver: zodResolver(insertIncapacidadSchema),
    defaultValues: initialData
      ? {
          empleadoId: initialData.empleadoId,
          tipo: initialData.tipo as "enfermedad_general" | "riesgo_trabajo" | "maternidad",
          fechaInicio: initialData.fechaInicio,
          fechaFin: initialData.fechaFin,
          diasIncapacidad: initialData.diasIncapacidad,
          numeroCertificado: initialData.numeroCertificado || undefined,
          certificadoMedicoUrl: initialData.certificadoMedicoUrl || undefined,
          diagnostico: initialData.diagnostico || undefined,
          medicoNombre: initialData.medicoNombre || undefined,
          unidadMedica: initialData.unidadMedica || undefined,
          porcentajePago: initialData.porcentajePago || undefined,
          pagoPatronPrimerosTresDias: initialData.pagoPatronPrimerosTresDias ?? false,
        }
      : {
          empleadoId: "",
          tipo: "enfermedad_general" as const,
          fechaInicio: new Date().toISOString().split('T')[0],
          fechaFin: new Date().toISOString().split('T')[0],
          diasIncapacidad: 0,
          numeroCertificado: undefined,
          certificadoMedicoUrl: undefined,
          diagnostico: undefined,
          medicoNombre: undefined,
          unidadMedica: undefined,
          porcentajePago: undefined,
          pagoPatronPrimerosTresDias: false,
        },
  });

  const fechaInicio = form.watch("fechaInicio");
  const fechaFin = form.watch("fechaFin");
  const tipo = form.watch("tipo");

  useEffect(() => {
    const dias = calculateDias();
    if (dias !== null) {
      form.setValue("diasIncapacidad", dias, { shouldValidate: true });
    } else {
      form.setValue("diasIncapacidad", 0, { shouldValidate: true });
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    if (tipo === "riesgo_trabajo" || tipo === "maternidad") {
      form.setValue("porcentajePago", 100, { shouldValidate: true });
    } else if (tipo === "enfermedad_general") {
      form.setValue("porcentajePago", 60, { shouldValidate: true });
    }
  }, [tipo]);

  const handleSubmit = (data: InsertIncapacidad) => {
    onSubmit(data);
  };

  const calculateDias = (): number | null => {
    if (!fechaInicio || !fechaFin) return null;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return null;
    if (fin < inicio) return null;
    
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const dias = calculateDias();
  const porcentajePago = form.watch("porcentajePago");

  const getPaymentInfo = () => {
    if (tipo === "enfermedad_general") {
      return {
        text: "IMSS paga 60% desde el día 4",
        variant: "default" as const
      };
    } else if (tipo === "riesgo_trabajo") {
      return {
        text: "IMSS paga 100% desde el día 1",
        variant: "default" as const
      };
    } else {
      return {
        text: "IMSS paga 100% (subsidio por maternidad)",
        variant: "default" as const
      };
    }
  };

  const paymentInfo = getPaymentInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-incapacidad-form">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {initialData ? "Editar Incapacidad" : "Nueva Incapacidad"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Modifica los datos de la incapacidad"
              : "Registra una nueva incapacidad médica según reglas IMSS"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="empleadoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empleado *</FormLabel>
                    <FormControl>
                      <EmployeeCombobox
                        value={field.value}
                        onChange={field.onChange}
                        testId="combobox-empleado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Incapacidad *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      data-testid="select-tipo"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="enfermedad_general">Enfermedad General</SelectItem>
                        <SelectItem value="riesgo_trabajo">Riesgo de Trabajo</SelectItem>
                        <SelectItem value="maternidad">Maternidad</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-fecha-inicio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Fin *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-fecha-fin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {dias !== null && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Días Totales</p>
                      <p className="text-2xl font-semibold" data-testid="text-dias-incapacidad">{dias}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">% de Pago IMSS</p>
                      <p className="text-2xl font-semibold" data-testid="text-porcentaje-pago">{porcentajePago}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <p className="text-xs">{paymentInfo.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Certificado Médico IMSS</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="numeroCertificado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Certificado</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Folio ST-2 o ST-3"
                          data-testid="input-numero-certificado"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Número de folio del certificado IMSS
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unidadMedica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad Médica</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Clínica IMSS"
                          data-testid="input-unidad-medica"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicoNombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Médico</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Dr(a)..."
                          data-testid="input-medico-nombre"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pagoPatronPrimerosTresDias"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-pago-patron"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm cursor-pointer">
                          Patrón pagó primeros 3 días
                        </FormLabel>
                        <FormDescription className="text-xs">
                          (Voluntario para enfermedad general)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="certificadoMedicoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificado Médico (Archivo)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {field.value ? (
                          <div className="flex items-center gap-2 p-3 border rounded-md">
                            <FileText className="h-5 w-5" />
                            <span className="text-sm flex-1 truncate" data-testid="text-certificado-nombre">Certificado cargado</span>
                            <a
                              href={field.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                              data-testid="link-ver-certificado"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => field.onChange(undefined)}
                              data-testid="button-eliminar-certificado"
                            >
                              Eliminar
                            </Button>
                          </div>
                        ) : (
                          <ObjectUploader
                            onGetUploadParameters={async () => {
                              const response = await fetch("/api/objects/upload", {
                                method: "POST",
                              });
                              const data = await response.json();
                              return {
                                method: "PUT",
                                url: data.uploadURL,
                              };
                            }}
                            onComplete={(result) => {
                              field.onChange(result.uploadURL);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Subir Certificado
                          </ObjectUploader>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Sube el certificado médico ST-2 o ST-3 (PDF o imagen)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Información Médica</h3>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-yellow-600">Datos sensibles - LFPDPPP</span>
              </div>
              
              <FormField
                control={form.control}
                name="diagnostico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Diagnóstico médico..."
                        className="resize-none"
                        rows={3}
                        data-testid="input-diagnostico"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Información protegida por Ley de Protección de Datos Personales
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancelar"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-guardar"
              >
                {isPending ? "Guardando..." : initialData ? "Guardar Cambios" : "Registrar Incapacidad"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
