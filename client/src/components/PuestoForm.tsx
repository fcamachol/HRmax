import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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

// Beneficios de ley en México
const BENEFICIOS_LEY = [
  "Aguinaldo (15 días mínimo)",
  "Vacaciones (12 días primer año + prima vacacional 25%)",
  "IMSS (Seguro Social)",
  "Infonavit",
  "SAR/Afore",
  "Prima dominical (25% extra)",
  "Días de descanso obligatorio",
  "Utilidades (PTU)",
];

export function PuestoForm({ open, onOpenChange, onSubmit, defaultValues, mode = "create" }: PuestoFormProps) {
  const [currentTab, setCurrentTab] = useState("general");
  const [newCompetencia, setNewCompetencia] = useState("");
  const [newConocimiento, setNewConocimiento] = useState("");
  const [newNivelConocimiento, setNewNivelConocimiento] = useState("basico");
  const [newCertificacion, setNewCertificacion] = useState("");
  const [newPrestacion, setNewPrestacion] = useState("");
  const [newIdioma, setNewIdioma] = useState("");
  const [newNivelIdioma, setNewNivelIdioma] = useState("basico");

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
      condicionesLaborales: {
        tipoHorario: "fijo",
      },
      compensacionYPrestaciones: {
        prestaciones: BENEFICIOS_LEY,
        prestacionesAdicionales: [],
      },
      indicadoresDesempeno: [],
      cumplimientoLegal: {},
      estatus: "activo",
    },
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

  const { fields: funcionesPrincipalesFields, append: appendFuncionPrincipal, remove: removeFuncionPrincipal } = useFieldArray({
    control: form.control,
    name: "funcionesPrincipales" as any,
  });

  const { fields: funcionesSecundariasFields, append: appendFuncionSecundaria, remove: removeFuncionSecundaria } = useFieldArray({
    control: form.control,
    name: "funcionesSecundarias" as any,
  });

  const { fields: prestacionesAdicionalesFields, append: appendPrestacionAdicional, remove: removePrestacionAdicional } = useFieldArray({
    control: form.control,
    name: "compensacionYPrestaciones.prestacionesAdicionales" as any,
  });

  const { fields: idiomasFields, append: appendIdioma, remove: removeIdioma } = useFieldArray({
    control: form.control,
    name: "idiomas" as any,
  });

  const tipoHorario = form.watch("condicionesLaborales.tipoHorario");

  // Reset form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues && open) {
      // Asegurar que prestaciones incluya beneficios de ley si no existen
      const prestacionesActuales = defaultValues.compensacionYPrestaciones?.prestaciones || [];
      const prestacionesConLey = Array.from(new Set([...BENEFICIOS_LEY, ...prestacionesActuales]));
      
      // Migrar conocimientos técnicos de strings a objetos si es necesario
      const conocimientosNormalizados = (defaultValues.conocimientosTecnicos || []).map((item: any) => {
        if (typeof item === 'string') {
          // Convertir strings antiguos a objetos nuevos
          return { conocimiento: item, nivel: 'basico' };
        }
        return item;
      });

      // Migrar idiomas de formato antiguo si es necesario
      const idiomasNormalizados = (defaultValues.idiomas || []).map((item: any) => {
        if (typeof item === 'string') {
          return { idioma: item, nivel: 'basico' };
        }
        return item;
      });
      
      form.reset({
        ...defaultValues,
        conocimientosTecnicos: conocimientosNormalizados,
        idiomas: idiomasNormalizados,
        compensacionYPrestaciones: {
          ...defaultValues.compensacionYPrestaciones,
          prestaciones: prestacionesConLey,
          prestacionesAdicionales: defaultValues.compensacionYPrestaciones?.prestacionesAdicionales || [],
        },
        condicionesLaborales: {
          ...defaultValues.condicionesLaborales,
          tipoHorario: (defaultValues.condicionesLaborales as any)?.tipoHorario || "fijo",
        },
      });
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

  const handleAddPrestacionAdicional = () => {
    if (newPrestacion.trim()) {
      appendPrestacionAdicional(newPrestacion.trim() as any);
      setNewPrestacion("");
    }
  };

  const toggleBeneficio = (beneficio: string) => {
    const prestacionesActuales = form.watch("compensacionYPrestaciones.prestaciones") || [];
    const index = prestacionesActuales.indexOf(beneficio);
    
    let nuevasPrestaciones: string[];
    if (index > -1) {
      // Remover
      nuevasPrestaciones = prestacionesActuales.filter((_, i) => i !== index);
    } else {
      // Agregar
      nuevasPrestaciones = [...prestacionesActuales, beneficio];
    }
    
    form.setValue("compensacionYPrestaciones.prestaciones", nuevasPrestaciones);
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
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
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
                      name="reportaA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporta a</FormLabel>
                          <FormControl>
                            <Input placeholder="ID del puesto superior" {...field} value={field.value || ""} data-testid="input-reporta-a" />
                          </FormControl>
                          <FormDescription>
                            ID del puesto al que reporta en la jerarquía
                          </FormDescription>
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Funciones Principales</FormLabel>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => appendFuncionPrincipal("" as any)}
                        data-testid="button-add-funcion-principal"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {funcionesPrincipalesFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <FormField
                            control={form.control}
                            name={`funcionesPrincipales.${index}`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Describe una función principal"
                                    data-testid={`input-funcion-principal-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFuncionPrincipal(index)}
                            data-testid={`button-remove-funcion-principal-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Funciones Secundarias</FormLabel>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => appendFuncionSecundaria("" as any)}
                        data-testid="button-add-funcion-secundaria"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {funcionesSecundariasFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <FormField
                            control={form.control}
                            name={`funcionesSecundarias.${index}`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Describe una función secundaria"
                                    data-testid={`input-funcion-secundaria-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFuncionSecundaria(index)}
                            data-testid={`button-remove-funcion-secundaria-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel>Certificaciones</FormLabel>
                      </div>
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

                <TabsContent value="competencias" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel>Competencias Conductuales</FormLabel>
                      </div>
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel>Conocimientos Técnicos</FormLabel>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newConocimiento}
                          onChange={(e) => setNewConocimiento(e.target.value)}
                          placeholder="Ej: Excel, SAP, Python"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddConocimiento();
                            }
                          }}
                          data-testid="input-new-conocimiento"
                          className="flex-1"
                        />
                        <Select value={newNivelConocimiento} onValueChange={setNewNivelConocimiento}>
                          <SelectTrigger className="w-[180px]" data-testid="select-nivel-conocimiento">
                            <SelectValue placeholder="Nivel" />
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
                          // Manejar tanto formato antiguo (string) como nuevo (objeto)
                          const displayText = typeof conocimiento === 'string' 
                            ? `${conocimiento} - basico` 
                            : `${conocimiento?.conocimiento} - ${conocimiento?.nivel}`;
                          return (
                            <Badge key={field.id} variant="secondary" className="gap-1" data-testid={`badge-conocimiento-${index}`}>
                              {displayText}
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel>Idiomas</FormLabel>
                      </div>
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
                          className="flex-1"
                        />
                        <Select value={newNivelIdioma} onValueChange={setNewNivelIdioma}>
                          <SelectTrigger className="w-[180px]" data-testid="select-nivel-idioma">
                            <SelectValue placeholder="Nivel" />
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
                          // Manejar tanto formato antiguo (string) como nuevo (objeto)
                          const displayText = typeof idioma === 'string' 
                            ? `${idioma} - basico` 
                            : `${idioma?.idioma} - ${idioma?.nivel}`;
                          return (
                            <Badge key={field.id} variant="secondary" className="gap-1" data-testid={`badge-idioma-${index}`}>
                              {displayText}
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
                  </div>
                </TabsContent>

                <TabsContent value="condiciones" className="space-y-4 mt-0">
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
                            <FormLabel>Descripción del Horario Variable</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe las condiciones del horario variable, turnos rotativos, etc..."
                                className="resize-none"
                                rows={4}
                                {...field}
                                value={field.value || ""}
                                data-testid="textarea-descripcion-horario"
                              />
                            </FormControl>
                            <FormDescription>
                              Especifica cómo funciona el horario variable, turnos, rotaciones, etc.
                            </FormDescription>
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
                              placeholder="40"
                              {...field}
                              onChange={e => field.onChange(e.target.value)}
                              value={field.value || ""}
                              data-testid="input-horas-semanales"
                            />
                          </FormControl>
                          <FormDescription>
                            Horas de trabajo por semana
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                  </div>
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

                  <div className="space-y-2">
                    <FormLabel>Prestaciones de Ley</FormLabel>
                    <div className="space-y-2 border rounded-md p-4">
                      <p className="text-sm text-muted-foreground mb-2">Marcadas por defecto</p>
                      <div className="grid grid-cols-2 gap-2">
                        {BENEFICIOS_LEY.map((beneficio) => {
                          const prestacionesActuales = form.watch("compensacionYPrestaciones.prestaciones") || [];
                          const isChecked = prestacionesActuales.includes(beneficio);
                          
                          return (
                            <div key={beneficio} className="flex items-center space-x-2">
                              <Checkbox
                                id={beneficio}
                                checked={isChecked}
                                onCheckedChange={() => toggleBeneficio(beneficio)}
                                data-testid={`checkbox-beneficio-${beneficio}`}
                              />
                              <label
                                htmlFor={beneficio}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {beneficio}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Prestaciones Adicionales</FormLabel>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newPrestacion}
                        onChange={(e) => setNewPrestacion(e.target.value)}
                        placeholder="Ej: Vales de despensa, Seguro de gastos médicos mayores"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPrestacionAdicional();
                          }
                        }}
                        data-testid="input-new-prestacion"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleAddPrestacionAdicional}
                        data-testid="button-add-prestacion"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {prestacionesAdicionalesFields.map((field, index) => (
                        <Badge key={field.id} variant="secondary" className="gap-1" data-testid={`badge-prestacion-${index}`}>
                          {form.watch(`compensacionYPrestaciones.prestacionesAdicionales.${index}`)}
                          <button
                            type="button"
                            onClick={() => removePrestacionAdicional(index)}
                            className="ml-1 hover:text-destructive"
                            data-testid={`button-remove-prestacion-${index}`}
                            >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
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
