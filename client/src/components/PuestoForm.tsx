import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPuestoSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const puestoFormSchema = insertPuestoSchema.extend({
  nombrePuesto: z.string().min(1, "El nombre del puesto es requerido"),
  clavePuesto: z.string().min(1, "La clave del puesto es requerida"),
});

type PuestoFormValues = z.infer<typeof puestoFormSchema>;

interface PuestoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PuestoFormValues) => void;
  defaultValues?: Partial<PuestoFormValues>;
  mode?: "create" | "edit";
}

export function PuestoForm({ open, onOpenChange, onSubmit, defaultValues, mode = "create" }: PuestoFormProps) {
  const [currentTab, setCurrentTab] = useState("general");

  const form = useForm<PuestoFormValues>({
    resolver: zodResolver(puestoFormSchema),
    defaultValues: defaultValues || {
      nombrePuesto: "",
      clavePuesto: "",
      departamento: "",
      area: "",
      ubicacion: "",
      nivelJerarquico: "",
      tipoPuesto: "",
      reportaA: "",
      puestosQueReportan: [],
      propositoGeneral: "",
      funcionesPrincipales: [],
      funcionesSecundarias: [],
      autoridadYDecisiones: "",
      relaciones: [],
      formacionAcademica: {},
      experienciaLaboral: {},
      conocimientosTecnicos: [],
      competenciasConductuales: [],
      idiomas: [],
      certificaciones: [],
      condicionesLaborales: {},
      compensacionYPrestaciones: {},
      indicadoresDesempeno: [],
      cumplimientoLegal: {},
      estatus: "activo",
    },
  });

  // Reset form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues && open) {
      form.reset(defaultValues);
      setCurrentTab("general");
    }
  }, [defaultValues, open, form]);

  const handleSubmit = (data: PuestoFormValues) => {
    onSubmit(data);
    if (mode === "create") {
      form.reset();
      setCurrentTab("general");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nuevo Puesto" : "Editar Puesto"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Crea una nueva descripción de puesto completa"
              : "Modifica la descripción del puesto"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
                <TabsTrigger value="jerarquia" data-testid="tab-jerarquia">Jerarquía</TabsTrigger>
                <TabsTrigger value="funciones" data-testid="tab-funciones">Funciones</TabsTrigger>
                <TabsTrigger value="requisitos" data-testid="tab-requisitos">Requisitos</TabsTrigger>
                <TabsTrigger value="competencias" data-testid="tab-competencias">Competencias</TabsTrigger>
                <TabsTrigger value="condiciones" data-testid="tab-condiciones">Condiciones</TabsTrigger>
                <TabsTrigger value="compensacion" data-testid="tab-compensacion">Compensación</TabsTrigger>
                <TabsTrigger value="legal" data-testid="tab-legal">Legal</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4 px-1">
                <TabsContent value="general" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombrePuesto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Puesto *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Gerente de Recursos Humanos" {...field} data-testid="input-nombre-puesto" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clavePuesto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clave del Puesto *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: GRH-001" {...field} data-testid="input-clave-puesto" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="departamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Recursos Humanos" {...field} value={field.value || ""} data-testid="input-departamento" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Administración" {...field} value={field.value || ""} data-testid="input-area" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ubicacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ubicación</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Oficina Central - CDMX" {...field} value={field.value || ""} data-testid="input-ubicacion" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nivelJerarquico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nivel Jerárquico</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-nivel-jerarquico">
                                <SelectValue placeholder="Selecciona un nivel" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Operativo">Operativo</SelectItem>
                              <SelectItem value="Técnico">Técnico</SelectItem>
                              <SelectItem value="Supervisión">Supervisión</SelectItem>
                              <SelectItem value="Jefatura">Jefatura</SelectItem>
                              <SelectItem value="Gerencia">Gerencia</SelectItem>
                              <SelectItem value="Dirección">Dirección</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoPuesto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Puesto</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-tipo-puesto">
                                <SelectValue placeholder="Selecciona un tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Operativo">Operativo</SelectItem>
                              <SelectItem value="Administrativo">Administrativo</SelectItem>
                              <SelectItem value="Directivo">Directivo</SelectItem>
                              <SelectItem value="Técnico">Técnico</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estatus</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "activo"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-estatus">
                                <SelectValue placeholder="Selecciona estatus" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="activo">Activo</SelectItem>
                              <SelectItem value="inactivo">Inactivo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="propositoGeneral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propósito General del Puesto</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el propósito principal y la razón de ser de este puesto..."
                            className="resize-none"
                            rows={4}
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-proposito-general"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="jerarquia" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="reportaA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporta a (ID del Puesto Superior)</FormLabel>
                        <FormControl>
                          <Input placeholder="ID del puesto al que reporta" {...field} value={field.value || ""} data-testid="input-reporta-a" />
                        </FormControl>
                        <FormDescription>
                          Ingresa el ID del puesto al que este puesto reporta en la jerarquía organizacional
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="funciones" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="autoridadYDecisiones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autoridad y Decisiones</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el nivel de autoridad y las decisiones que puede tomar esta posición..."
                            className="resize-none"
                            rows={4}
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-autoridad-decisiones"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="requisitos" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Formación Académica</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="formacionAcademica.requerida"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formación Requerida</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Licenciatura en Administración" {...field} data-testid="input-formacion-requerida" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="formacionAcademica.deseable"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formación Deseable</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Maestría en RH" {...field} data-testid="input-formacion-deseable" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Experiencia Laboral</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="experienciaLaboral.requerida"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experiencia Requerida</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: 5 años en puesto similar" {...field} data-testid="input-experiencia-requerida" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="experienciaLaboral.deseable"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experiencia Deseable</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: 7 años con liderazgo de equipos" {...field} data-testid="input-experiencia-deseable" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="competencias" className="space-y-4 mt-0">
                  <div className="text-sm text-muted-foreground">
                    Los conocimientos técnicos, competencias conductuales, idiomas y certificaciones se pueden gestionar desde la vista de detalles completa después de crear/editar el puesto.
                  </div>
                </TabsContent>

                <TabsContent value="condiciones" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="condicionesLaborales.horario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horario</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 9:00 - 18:00" {...field} data-testid="input-horario" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condicionesLaborales.modalidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modalidad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-modalidad">
                                <SelectValue placeholder="Selecciona modalidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Presencial">Presencial</SelectItem>
                              <SelectItem value="Remoto">Remoto</SelectItem>
                              <SelectItem value="Híbrido">Híbrido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condicionesLaborales.nivelEsfuerzoFisico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nivel de Esfuerzo Físico</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-esfuerzo-fisico">
                                <SelectValue placeholder="Selecciona nivel" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Bajo">Bajo</SelectItem>
                              <SelectItem value="Medio">Medio</SelectItem>
                              <SelectItem value="Alto">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condicionesLaborales.requiereViaje"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-requiere-viaje"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Requiere Viajes</FormLabel>
                            <FormDescription>
                              El puesto requiere viajar regularmente
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="condicionesLaborales.ambienteTrabajo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ambiente de Trabajo</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el ambiente y condiciones de trabajo..."
                            className="resize-none"
                            rows={3}
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-ambiente-trabajo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="compensacion" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="compensacionYPrestaciones.rangoSalarialMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salario Mínimo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value || ""}
                              data-testid="input-salario-min"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compensacionYPrestaciones.rangoSalarialMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salario Máximo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value || ""}
                              data-testid="input-salario-max"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compensacionYPrestaciones.tipoPago"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Pago</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-tipo-pago">
                                <SelectValue placeholder="Selecciona tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mensual">Mensual</SelectItem>
                              <SelectItem value="Quincenal">Quincenal</SelectItem>
                              <SelectItem value="Semanal">Semanal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="legal" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="cumplimientoLegal.nivelRiesgo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel de Riesgo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-nivel-riesgo">
                              <SelectValue placeholder="Selecciona nivel de riesgo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Clase I">Clase I - Riesgo Mínimo</SelectItem>
                            <SelectItem value="Clase II">Clase II - Riesgo Bajo</SelectItem>
                            <SelectItem value="Clase III">Clase III - Riesgo Medio</SelectItem>
                            <SelectItem value="Clase IV">Clase IV - Riesgo Alto</SelectItem>
                            <SelectItem value="Clase V">Clase V - Riesgo Máximo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Clasificación de riesgo según IMSS
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cumplimientoLegal.equipoProteccion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipo de Protección</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el equipo de protección personal requerido..."
                            className="resize-none"
                            rows={3}
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-equipo-proteccion"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-puesto"
              >
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-submit-puesto">
                {mode === "create" ? "Crear Puesto" : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
