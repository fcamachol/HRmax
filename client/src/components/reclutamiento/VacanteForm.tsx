import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalaryRangeInputs } from "@/components/shared/SalaryRangeInputs";
import { 
  insertVacanteSchema, 
  type Vacante, 
  type Puesto, 
  type InsertVacante,
  type CentroTrabajo,
} from "@shared/schema";

const vacanteFormSchema = insertVacanteSchema.extend({
  // Additional frontend validation
  rangoSalarialMin: z.union([
    z.coerce.number().positive(),
    z.literal("").transform(() => undefined)
  ]).optional(),
  rangoSalarialMax: z.union([
    z.coerce.number().positive(),
    z.literal("").transform(() => undefined)
  ]).optional(),
}).refine(
  (data) => {
    if (data.rangoSalarialMin && data.rangoSalarialMax) {
      return data.rangoSalarialMax >= data.rangoSalarialMin;
    }
    return true;
  },
  {
    message: "El salario máximo debe ser mayor o igual al mínimo",
    path: ["rangoSalarialMax"],
  }
).refine(
  (data) => {
    if (data.fechaLimite && data.fechaApertura) {
      return new Date(data.fechaLimite) >= new Date(data.fechaApertura);
    }
    return true;
  },
  {
    message: "La fecha límite debe ser posterior a la fecha de apertura",
    path: ["fechaLimite"],
  }
);

type VacanteFormValues = z.infer<typeof vacanteFormSchema>;

interface VacanteFormProps {
  vacante: Vacante | null;
  puestos: Puesto[];
  onSubmit: (data: InsertVacante) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function VacanteForm({ vacante, puestos, onSubmit, onCancel, isSubmitting }: VacanteFormProps) {
  const [currentTab, setCurrentTab] = useState("general");
  const [newCompetencia, setNewCompetencia] = useState("");
  const [newConocimiento, setNewConocimiento] = useState("");
  const [newNivelConocimiento, setNewNivelConocimiento] = useState("basico");
  const [newCertificacion, setNewCertificacion] = useState("");
  const [newIdioma, setNewIdioma] = useState("");
  const [newNivelIdioma, setNewNivelIdioma] = useState("basico");

  // Fetch centros de trabajo
  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
  });

  const defaultValues: Partial<VacanteFormValues> = vacante
    ? {
        titulo: vacante.titulo,
        puestoId: vacante.puestoId ?? undefined,
        departamento: vacante.departamento,
        numeroVacantes: vacante.numeroVacantes,
        prioridad: vacante.prioridad,
        fechaApertura: vacante.fechaApertura ?? undefined,
        fechaLimite: vacante.fechaLimite ?? undefined,
        estatus: vacante.estatus,
        tipoContrato: vacante.tipoContrato ?? undefined,
        modalidadTrabajo: vacante.modalidadTrabajo ?? undefined,
        ubicacion: vacante.ubicacion ?? undefined,
        centroTrabajoId: vacante.centroTrabajoId ?? undefined,
        rangoSalarialMin: vacante.rangoSalarialMin ? parseFloat(vacante.rangoSalarialMin) : undefined,
        rangoSalarialMax: vacante.rangoSalarialMax ? parseFloat(vacante.rangoSalarialMax) : undefined,
        descripcion: vacante.descripcion ?? undefined,
        requisitos: vacante.requisitos ?? undefined,
        responsabilidades: vacante.responsabilidades ?? undefined,
        prestaciones: vacante.prestaciones ?? undefined,
        conocimientosTecnicos: vacante.conocimientosTecnicos as any || [],
        competenciasConductuales: vacante.competenciasConductuales as any || [],
        idiomas: vacante.idiomas as any || [],
        certificaciones: vacante.certificaciones as any || [],
        condicionesLaborales: {
          tipoHorario: (vacante.condicionesLaborales as any)?.tipoHorario || "fijo",
          horaEntrada: (vacante.condicionesLaborales as any)?.horaEntrada || "",
          horaSalida: (vacante.condicionesLaborales as any)?.horaSalida || "",
          descripcionHorario: (vacante.condicionesLaborales as any)?.descripcionHorario || "",
          horasSemanales: (vacante.condicionesLaborales as any)?.horasSemanales !== undefined ? (vacante.condicionesLaborales as any).horasSemanales : undefined,
          tiempoComida: (vacante.condicionesLaborales as any)?.tiempoComida !== undefined ? (vacante.condicionesLaborales as any).tiempoComida : undefined,
          horarioComidaInicio: (vacante.condicionesLaborales as any)?.horarioComidaInicio || "",
          horarioComidaFin: (vacante.condicionesLaborales as any)?.horarioComidaFin || "",
          modalidad: (vacante.condicionesLaborales as any)?.modalidad || "",
          guardias: (vacante.condicionesLaborales as any)?.guardias || "",
          horasGuardias: (vacante.condicionesLaborales as any)?.horasGuardias !== undefined ? (vacante.condicionesLaborales as any).horasGuardias : undefined,
          nivelEsfuerzoFisico: (vacante.condicionesLaborales as any)?.nivelEsfuerzoFisico || "",
          ambienteTrabajo: (vacante.condicionesLaborales as any)?.ambienteTrabajo || "",
        },
        empresaId: vacante.empresaId ?? undefined,
        creadoPor: vacante.creadoPor ?? undefined,
      }
    : {
        numeroVacantes: 1,
        prioridad: "media",
        fechaApertura: new Date().toISOString().split('T')[0],
        estatus: "abierta",
        tipoContrato: "indeterminado",
        modalidadTrabajo: "presencial",
        conocimientosTecnicos: [],
        competenciasConductuales: [],
        idiomas: [],
        certificaciones: [],
        condicionesLaborales: {
          tipoHorario: "fijo",
          horaEntrada: "",
          horaSalida: "",
          descripcionHorario: "",
          horasSemanales: undefined,
          tiempoComida: undefined,
          horarioComidaInicio: "",
          horarioComidaFin: "",
          modalidad: "",
          guardias: "",
          horasGuardias: undefined,
          nivelEsfuerzoFisico: "",
          ambienteTrabajo: "",
        },
      };

  const form = useForm<VacanteFormValues>({
    resolver: zodResolver(vacanteFormSchema),
    defaultValues,
  });

  const { fields: competenciasFields, append: appendCompetencia, remove: removeCompetencia } = useFieldArray({
    control: form.control,
    name: "competenciasConductuales" as any,
  });

  const { fields: conocimientosFields, append: appendConocimiento, remove: removeConocimiento } = useFieldArray({
    control: form.control,
    name: "conocimientosTecnicos" as any,
  });

  const { fields: certificacionesFields, append: appendCertificacion, remove: removeCertificacion } = useFieldArray({
    control: form.control,
    name: "certificaciones" as any,
  });

  const { fields: idiomasFields, append: appendIdioma, remove: removeIdioma } = useFieldArray({
    control: form.control,
    name: "idiomas" as any,
  });

  const tipoHorario = form.watch("condicionesLaborales.tipoHorario");
  const selectedPuestoId = form.watch("puestoId");
  const selectedCentroTrabajoId = form.watch("centroTrabajoId");

  // Auto-fill from Puesto
  useEffect(() => {
    if (selectedPuestoId && !vacante) { // Only auto-fill on create
      const puesto = puestos.find(p => p.id === selectedPuestoId);
      if (puesto) {
        // Fill departamento if empty
        if (!form.getValues("departamento")) {
          form.setValue("departamento", puesto.departamento || "");
        }

        // Fill competencias if empty
        const currentCompetencias = form.getValues("competenciasConductuales") as string[];
        if (!currentCompetencias || currentCompetencias.length === 0) {
          form.setValue("competenciasConductuales", puesto.competenciasConductuales as any || []);
        }

        // Fill conocimientos técnicos if empty
        const currentConocimientos = form.getValues("conocimientosTecnicos") as any[];
        if (!currentConocimientos || currentConocimientos.length === 0) {
          form.setValue("conocimientosTecnicos", puesto.conocimientosTecnicos as any || []);
        }

        // Fill idiomas if empty
        const currentIdiomas = form.getValues("idiomas") as any[];
        if (!currentIdiomas || currentIdiomas.length === 0) {
          form.setValue("idiomas", puesto.idiomas as any || []);
        }

        // Fill certificaciones if empty
        const currentCertificaciones = form.getValues("certificaciones") as string[];
        if (!currentCertificaciones || currentCertificaciones.length === 0) {
          form.setValue("certificaciones", puesto.certificaciones as any || []);
        }

        // Fill condiciones laborales if empty
        const currentCondiciones = form.getValues("condicionesLaborales") as any;
        if (!currentCondiciones || Object.keys(currentCondiciones).length <= 1) {
          form.setValue("condicionesLaborales", puesto.condicionesLaborales as any || {});
        }
      }
    }
  }, [selectedPuestoId, puestos, form, vacante]);

  // Auto-fill ubicacion from Centro de Trabajo
  useEffect(() => {
    if (selectedCentroTrabajoId) {
      const centro = centrosTrabajo.find(c => c.id === selectedCentroTrabajoId);
      if (centro) {
        const direccion = [
          centro.calle,
          centro.numeroExterior,
          centro.colonia,
          centro.municipio,
          centro.estado,
          centro.codigoPostal,
        ].filter(Boolean).join(", ");
        form.setValue("ubicacion", direccion || centro.nombre);
      }
    }
  }, [selectedCentroTrabajoId, centrosTrabajo, form]);

  const handleAddCompetencia = () => {
    if (newCompetencia.trim()) {
      appendCompetencia(newCompetencia.trim() as any);
      setNewCompetencia("");
    }
  };

  const handleAddConocimiento = () => {
    if (newConocimiento.trim()) {
      appendConocimiento({ conocimiento: newConocimiento.trim(), nivel: newNivelConocimiento } as any);
      setNewConocimiento("");
      setNewNivelConocimiento("basico");
    }
  };

  const handleAddCertificacion = () => {
    if (newCertificacion.trim()) {
      appendCertificacion(newCertificacion.trim() as any);
      setNewCertificacion("");
    }
  };

  const handleAddIdioma = () => {
    if (newIdioma.trim()) {
      appendIdioma({ idioma: newIdioma.trim(), nivel: newNivelIdioma } as any);
      setNewIdioma("");
      setNewNivelIdioma("basico");
    }
  };

  const handleSubmit = (values: VacanteFormValues) => {
    // Convert salary numbers to strings for backend numeric fields
    const submitData: InsertVacante = {
      ...values,
      rangoSalarialMin: values.rangoSalarialMin !== undefined ? String(values.rangoSalarialMin) : undefined,
      rangoSalarialMax: values.rangoSalarialMax !== undefined ? String(values.rangoSalarialMax) : undefined,
    } as InsertVacante;
    
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
            <TabsTrigger value="detalles" data-testid="tab-detalles">Detalles</TabsTrigger>
            <TabsTrigger value="competencias" data-testid="tab-competencias">Competencias</TabsTrigger>
            <TabsTrigger value="condiciones" data-testid="tab-condiciones">Condiciones</TabsTrigger>
          </TabsList>

          {/* Tab 1: General */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título de la Vacante<span className="text-destructive"> *</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Desarrollador Full Stack Senior"
                        {...field}
                        data-testid="input-titulo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="puestoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puesto (Catálogo)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-puesto">
                          <SelectValue placeholder="Seleccionar puesto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {puestos.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No hay puestos disponibles
                          </div>
                        ) : (
                          puestos.map((puesto) => (
                            <SelectItem key={puesto.id} value={puesto.id}>
                              <div>
                                <div className="font-medium">{puesto.nombrePuesto}</div>
                                {puesto.departamento && (
                                  <div className="text-xs text-muted-foreground">
                                    {puesto.departamento}
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Auto-llena competencias y condiciones del puesto
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento<span className="text-destructive"> *</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Tecnología"
                        {...field}
                        data-testid="input-departamento"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroVacantes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Vacantes<span className="text-destructive"> *</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-numero-vacantes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad<span className="text-destructive"> *</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-prioridad">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaApertura"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Apertura<span className="text-destructive"> *</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-fecha-apertura"
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaLimite"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Límite</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-fecha-limite"
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP", { locale: es })
                            ) : (
                              <span>Sin fecha límite</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0] ?? undefined)}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Opcional: fecha límite para recibir aplicaciones</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estatus"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Estatus<span className="text-destructive"> *</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-estatus">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="abierta">Abierta</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                        <SelectItem value="cerrada">Cerrada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Detalles */}
          <TabsContent value="detalles" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoContrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-tipo-contrato">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="indeterminado">Indeterminado</SelectItem>
                        <SelectItem value="determinado">Determinado</SelectItem>
                        <SelectItem value="por_obra">Por Obra</SelectItem>
                        <SelectItem value="honorarios">Honorarios</SelectItem>
                        <SelectItem value="practicante">Practicante</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modalidadTrabajo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad de Trabajo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-modalidad-trabajo">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="remoto">Remoto</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="centroTrabajoId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Centro de Trabajo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-centro-trabajo">
                          <SelectValue placeholder="Seleccionar centro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centrosTrabajo.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No hay centros disponibles
                          </div>
                        ) : (
                          centrosTrabajo.map((centro) => (
                            <SelectItem key={centro.id} value={centro.id}>
                              <div>
                                <div className="font-medium">{centro.nombre}</div>
                                {centro.municipio && (
                                  <div className="text-xs text-muted-foreground">
                                    {centro.municipio}, {centro.estado}
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Auto-llena la dirección completa del centro de trabajo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ubicacion"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Av. Reforma 222, Col. Juárez, CDMX"
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-ubicacion"
                      />
                    </FormControl>
                    <FormDescription>
                      Dirección completa del lugar de trabajo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SalaryRangeInputs
              form={form}
              minFieldName="rangoSalarialMin"
              maxFieldName="rangoSalarialMax"
              minLabel="Salario Mínimo (MXN)"
              maxLabel="Salario Máximo (MXN)"
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Puesto</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción general del puesto y la oportunidad..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="textarea-descripcion"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requisitos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requisitos</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Educación, experiencia, habilidades técnicas requeridas..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="textarea-requisitos"
                    />
                  </FormControl>
                  <FormDescription>
                    Requisitos mínimos que debe cumplir el candidato
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsabilidades"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsabilidades</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Principales funciones y responsabilidades del puesto..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="textarea-responsabilidades"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prestaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prestaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Prestaciones de ley y adicionales..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="textarea-prestaciones"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Tab 3: Competencias */}
          <TabsContent value="competencias" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Competencias Conductuales */}
              <div className="space-y-2">
                <FormLabel>Competencias Conductuales</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={newCompetencia}
                    onChange={(e) => setNewCompetencia(e.target.value)}
                    placeholder="Ej: Liderazgo, Trabajo en equipo"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCompetencia();
                      }
                    }}
                    data-testid="input-new-competencia"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleAddCompetencia}
                    data-testid="button-add-competencia"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {competenciasFields.map((field, index) => (
                    <Badge key={field.id} variant="secondary" className="gap-1" data-testid={`badge-competencia-${index}`}>
                      {form.watch(`competenciasConductuales.${index}`)}
                      <button
                        type="button"
                        onClick={() => removeCompetencia(index)}
                        className="ml-1 hover:text-destructive"
                        data-testid={`button-remove-competencia-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Conocimientos Técnicos */}
              <div className="space-y-2">
                <FormLabel>Conocimientos Técnicos</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={newConocimiento}
                    onChange={(e) => setNewConocimiento(e.target.value)}
                    placeholder="Ej: React, Python, SQL"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddConocimiento();
                      }
                    }}
                    data-testid="input-new-conocimiento"
                  />
                  <Select value={newNivelConocimiento} onValueChange={setNewNivelConocimiento}>
                    <SelectTrigger className="w-[150px]" data-testid="select-nivel-conocimiento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleAddConocimiento}
                    data-testid="button-add-conocimiento"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {conocimientosFields.map((field, index) => {
                    const conocimiento = form.watch(`conocimientosTecnicos.${index}`) as any;
                    return (
                      <Badge key={field.id} variant="secondary" className="gap-1" data-testid={`badge-conocimiento-${index}`}>
                        {conocimiento?.conocimiento} - {conocimiento?.nivel}
                        <button
                          type="button"
                          onClick={() => removeConocimiento(index)}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-conocimiento-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Idiomas */}
              <div className="space-y-2">
                <FormLabel>Idiomas</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={newIdioma}
                    onChange={(e) => setNewIdioma(e.target.value)}
                    placeholder="Ej: Inglés, Francés"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddIdioma();
                      }
                    }}
                    data-testid="input-new-idioma"
                  />
                  <Select value={newNivelIdioma} onValueChange={setNewNivelIdioma}>
                    <SelectTrigger className="w-[150px]" data-testid="select-nivel-idioma">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                      <SelectItem value="nativo">Nativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleAddIdioma}
                    data-testid="button-add-idioma"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {idiomasFields.map((field, index) => {
                    const idioma = form.watch(`idiomas.${index}`) as any;
                    return (
                      <Badge key={field.id} variant="secondary" className="gap-1" data-testid={`badge-idioma-${index}`}>
                        {idioma?.idioma} - {idioma?.nivel}
                        <button
                          type="button"
                          onClick={() => removeIdioma(index)}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-idioma-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Certificaciones */}
              <div className="space-y-2">
                <FormLabel>Certificaciones</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={newCertificacion}
                    onChange={(e) => setNewCertificacion(e.target.value)}
                    placeholder="Ej: PMP, Six Sigma"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCertificacion();
                      }
                    }}
                    data-testid="input-new-certificacion"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleAddCertificacion}
                    data-testid="button-add-certificacion"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {certificacionesFields.map((field, index) => (
                    <Badge key={field.id} variant="secondary" className="gap-1" data-testid={`badge-certificacion-${index}`}>
                      {form.watch(`certificaciones.${index}`)}
                      <button
                        type="button"
                        onClick={() => removeCertificacion(index)}
                        className="ml-1 hover:text-destructive"
                        data-testid={`button-remove-certificacion-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Condiciones Laborales */}
          <TabsContent value="condiciones" className="space-y-4 mt-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="condicionesLaborales.tipoHorario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Horario</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "fijo"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tipo-horario">
                          <SelectValue placeholder="Selecciona tipo de horario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fijo">Horario Fijo</SelectItem>
                        <SelectItem value="variable">Horario Variable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tipoHorario === "fijo" ? (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condicionesLaborales.horaEntrada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Entrada</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-hora-entrada"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="condicionesLaborales.horaSalida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Salida</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-hora-salida"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="condicionesLaborales.descripcionHorario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Horario</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el horario variable..."
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-descripcion-horario"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="condicionesLaborales.horasSemanales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Semanales</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ej: 40"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        data-testid="input-horas-semanales"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condicionesLaborales.tiempoComida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Comida (horas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        min="0.5"
                        step="0.5"
                        {...field}
                        onChange={e => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        value={field.value ?? ""}
                        data-testid="input-tiempo-comida"
                      />
                    </FormControl>
                    <FormDescription>
                      Mínimo 0.5 horas (30 minutos)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="condicionesLaborales.horarioComidaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario de Comida - Inicio (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-horario-comida-inicio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condicionesLaborales.horarioComidaFin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario de Comida - Fin (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-horario-comida-fin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="condicionesLaborales.modalidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Presencial, Remoto, Híbrido"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-modalidad-condiciones"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condicionesLaborales.guardias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardias / Disponibilidad</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe si requiere guardias, disponibilidad de fines de semana, etc."
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-guardias"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condicionesLaborales.horasGuardias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas de Guardia (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.5"
                        {...field}
                        onChange={e => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        value={field.value ?? ""}
                        data-testid="input-horas-guardias"
                      />
                    </FormControl>
                    <FormDescription>
                      Número de horas de guardia por semana
                    </FormDescription>
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
                    <FormControl>
                      <Input
                        placeholder="Ej: Bajo, Medio, Alto"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-esfuerzo-fisico"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condicionesLaborales.ambienteTrabajo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente de Trabajo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el ambiente laboral (oficina, planta, campo, etc.)"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-ambiente-trabajo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="button-cancel"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? "Guardando..." : vacante ? "Actualizar" : "Crear"} Vacante
          </Button>
        </div>
      </form>
    </Form>
  );
}
