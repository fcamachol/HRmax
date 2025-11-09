import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { insertCandidatoSchema, type Candidato, type InsertCandidato, type Vacante } from "@shared/schema";

const candidatoFormSchema = insertCandidatoSchema.extend({
  salarioDeseado: z.union([
    z.coerce.number().positive(),
    z.literal("").transform(() => undefined)
  ]).optional(),
  experienciaAnios: z.union([
    z.coerce.number().int().nonnegative(),
    z.literal("").transform(() => undefined)
  ]).optional(),
  vacanteId: z.string().optional(), // Campo extra para vincular a vacante
});

type CandidatoFormValues = z.infer<typeof candidatoFormSchema>;

interface CandidatoFormProps {
  candidato?: Candidato | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertCandidato & { vacanteId?: string }) => void;
  isPending?: boolean;
}

const fuentesReclutamiento = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "computrabajo", label: "Computrabajo" },
  { value: "occmundial", label: "OCC Mundial" },
  { value: "bumeran", label: "Bumeran" },
  { value: "referido_empleado", label: "Referido por Empleado" },
  { value: "bolsa_universitaria", label: "Bolsa Universitaria" },
  { value: "redes_sociales", label: "Redes Sociales" },
  { value: "portal_empresa", label: "Portal de la Empresa" },
  { value: "agencia_reclutamiento", label: "Agencia de Reclutamiento" },
  { value: "feria_empleo", label: "Feria de Empleo" },
  { value: "aplicacion_directa", label: "Aplicación Directa" },
  { value: "headhunter", label: "Headhunter" },
  { value: "otro", label: "Otro" },
];

const nivelesEducacion = [
  { value: "secundaria", label: "Secundaria" },
  { value: "preparatoria", label: "Preparatoria" },
  { value: "licenciatura", label: "Licenciatura" },
  { value: "maestria", label: "Maestría" },
  { value: "doctorado", label: "Doctorado" },
];

const disponibilidades = [
  { value: "inmediata", label: "Inmediata" },
  { value: "15_dias", label: "15 días" },
  { value: "1_mes", label: "1 mes" },
  { value: "2_meses", label: "2 meses" },
  { value: "a_negociar", label: "A negociar" },
];

const nivelesIdioma = [
  { value: "basico", label: "Básico" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
  { value: "nativo", label: "Nativo" },
];

export function CandidatoForm({ candidato, open, onOpenChange, onSubmit, isPending }: CandidatoFormProps) {
  const [newCompetencia, setNewCompetencia] = useState("");
  const [newIdioma, setNewIdioma] = useState({ idioma: "", nivel: "basico" });

  // Cargar vacantes activas para el selector
  const { data: vacantes = [] } = useQuery<Vacante[]>({
    queryKey: ["/api/vacantes/activas"],
    enabled: open, // Solo cargar cuando el diálogo esté abierto
  });

  const buildDefaultValues = useMemo((): Partial<CandidatoFormValues> => {
    if (!candidato) {
      return {
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        email: "",
        telefono: "",
        telefonoSecundario: "",
        linkedinUrl: "",
        cvUrl: "",
        puestoDeseado: "",
        disponibilidad: "inmediata",
        fuente: "aplicacion_directa",
        referidoPor: "",
        ciudad: "",
        estado: "",
        nivelEducacion: "",
        carrera: "",
        universidad: "",
        notas: "",
        estatus: "activo",
        competenciasClave: [],
        idiomas: [],
        documentosAdicionales: [],
      };
    }

    return {
      nombre: candidato.nombre,
      apellidoPaterno: candidato.apellidoPaterno,
      apellidoMaterno: candidato.apellidoMaterno ?? "",
      email: candidato.email,
      telefono: candidato.telefono,
      telefonoSecundario: candidato.telefonoSecundario ?? "",
      linkedinUrl: candidato.linkedinUrl ?? "",
      cvUrl: candidato.cvUrl ?? "",
      puestoDeseado: candidato.puestoDeseado ?? "",
      salarioDeseado: candidato.salarioDeseado ? parseFloat(candidato.salarioDeseado) : undefined,
      disponibilidad: candidato.disponibilidad ?? "inmediata",
      fuente: candidato.fuente,
      referidoPor: candidato.referidoPor ?? "",
      empleadoReferidorId: candidato.empleadoReferidorId ?? "",
      ciudad: candidato.ciudad ?? "",
      estado: candidato.estado ?? "",
      experienciaAnios: candidato.experienciaAnios ?? undefined,
      nivelEducacion: candidato.nivelEducacion ?? "",
      carrera: candidato.carrera ?? "",
      universidad: candidato.universidad ?? "",
      competenciasClave: (candidato.competenciasClave as string[]) ?? [],
      idiomas: (candidato.idiomas as Array<{ idioma: string; nivel: string }>) ?? [],
      notas: candidato.notas ?? "",
      documentosAdicionales: (candidato.documentosAdicionales as Array<{ nombre: string; url: string }>) ?? [],
      estatus: candidato.estatus ?? "activo",
    };
  }, [candidato]);

  const form = useForm<CandidatoFormValues>({
    resolver: zodResolver(candidatoFormSchema),
    defaultValues: buildDefaultValues,
  });

  useEffect(() => {
    form.reset(buildDefaultValues);
  }, [candidato, buildDefaultValues, form]);

  const handleSubmit = (data: CandidatoFormValues) => {
    // Separar vacanteId antes de procesar
    const { vacanteId, ...candidatoData } = data;

    const submitData = {
      ...candidatoData,
      salarioDeseado: candidatoData.salarioDeseado !== undefined ? String(candidatoData.salarioDeseado) : undefined,
      experienciaAnios: candidatoData.experienciaAnios,
    };

    // Limpiar undefined values del candidato
    const cleanedCandidatoData = Object.fromEntries(
      Object.entries(submitData).filter(([_, v]) => v !== undefined)
    ) as InsertCandidato;

    // Normalizar vacanteId: "NONE" o string vacía → undefined, valor real → mantener
    const normalizedVacanteId = vacanteId && vacanteId !== "NONE" && vacanteId.trim() !== "" ? vacanteId : undefined;

    // Agregar vacanteId normalizado solo si tiene valor
    const finalData: InsertCandidato & { vacanteId?: string } = {
      ...cleanedCandidatoData,
      ...(normalizedVacanteId && { vacanteId: normalizedVacanteId }),
    };

    onSubmit(finalData);
  };

  const addCompetencia = () => {
    if (newCompetencia.trim()) {
      const current = form.getValues("competenciasClave") || [];
      form.setValue("competenciasClave", [...current, newCompetencia.trim()]);
      setNewCompetencia("");
    }
  };

  const removeCompetencia = (index: number) => {
    const current = form.getValues("competenciasClave") || [];
    form.setValue("competenciasClave", current.filter((_, i) => i !== index));
  };

  const addIdioma = () => {
    if (newIdioma.idioma.trim()) {
      const current = form.getValues("idiomas") || [];
      form.setValue("idiomas", [...current, { idioma: newIdioma.idioma.trim(), nivel: newIdioma.nivel }]);
      setNewIdioma({ idioma: "", nivel: "basico" });
    }
  };

  const removeIdioma = (index: number) => {
    const current = form.getValues("idiomas") || [];
    form.setValue("idiomas", current.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">
            {candidato ? "Editar Candidato" : "Nuevo Candidato"}
          </DialogTitle>
          <DialogDescription>
            {candidato
              ? "Actualiza la información del candidato"
              : "Registra un nuevo candidato en la base de datos"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
                <TabsTrigger value="perfil" data-testid="tab-perfil">Perfil Profesional</TabsTrigger>
                <TabsTrigger value="educacion" data-testid="tab-educacion">Educación & Competencias</TabsTrigger>
                <TabsTrigger value="documentos" data-testid="tab-documentos">Documentos & Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre<span className="text-destructive"> *</span></FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-nombre" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apellidoPaterno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido Paterno<span className="text-destructive"> *</span></FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-apellido-paterno" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apellidoMaterno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido Materno</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} data-testid="input-apellido-materno" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email<span className="text-destructive"> *</span></FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono<span className="text-destructive"> *</span></FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-telefono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefonoSecundario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono Secundario</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} data-testid="input-telefono-secundario" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="https://linkedin.com/in/..." data-testid="input-linkedin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fuente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuente de Reclutamiento<span className="text-destructive"> *</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "aplicacion_directa"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-fuente">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fuentesReclutamiento.map((fuente) => (
                              <SelectItem key={fuente.value} value={fuente.value}>
                                {fuente.label}
                              </SelectItem>
                            ))}
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
                        <FormLabel>Estatus<span className="text-destructive"> *</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "activo"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-estatus">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="contratado">Contratado</SelectItem>
                            <SelectItem value="descartado">Descartado</SelectItem>
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
                  name="referidoPor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referido Por</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Nombre de quien lo refirió" data-testid="input-referido-por" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selector de Vacante */}
                <FormField
                  control={form.control}
                  name="vacanteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vacante Vinculada (Opcional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ?? "NONE"}
                        disabled={!!candidato}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-vacante">
                            <SelectValue placeholder="Seleccionar vacante..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">Ninguna (Candidato de banco)</SelectItem>
                          {vacantes.map((vacante) => (
                            <SelectItem key={vacante.id} value={vacante.id}>
                              {vacante.titulo} - {vacante.departamento}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {candidato && (
                        <p className="text-xs text-muted-foreground">
                          Para cambiar la vacante vinculada, usa la página de Vacantes o Proceso de Selección
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="perfil" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="puestoDeseado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Puesto Deseado</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} data-testid="input-puesto-deseado" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disponibilidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disponibilidad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "inmediata"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-disponibilidad">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {disponibilidades.map((disp) => (
                              <SelectItem key={disp.value} value={disp.value}>
                                {disp.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salarioDeseado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salario Deseado (MXN)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                            data-testid="input-salario-deseado"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experienciaAnios"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experiencia (años)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                            data-testid="input-experiencia-anios"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ciudad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} data-testid="input-ciudad" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} data-testid="input-estado" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="educacion" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nivelEducacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel de Educación</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-nivel-educacion">
                              <SelectValue placeholder="Selecciona nivel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nivelesEducacion.map((nivel) => (
                              <SelectItem key={nivel.value} value={nivel.value}>
                                {nivel.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carrera"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carrera</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} data-testid="input-carrera" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="universidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Universidad</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} data-testid="input-universidad" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Competencias Clave</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newCompetencia}
                      onChange={(e) => setNewCompetencia(e.target.value)}
                      placeholder="Ej: Liderazgo, Trabajo en equipo..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCompetencia();
                        }
                      }}
                      data-testid="input-nueva-competencia"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addCompetencia}
                      data-testid="button-add-competencia"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(form.watch("competenciasClave") || []).map((comp, index) => (
                      <Badge key={index} variant="secondary" className="gap-1" data-testid={`badge-competencia-${index}`}>
                        {comp}
                        <button
                          type="button"
                          onClick={() => removeCompetencia(index)}
                          className="ml-1"
                          data-testid={`button-remove-competencia-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <FormLabel>Idiomas</FormLabel>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Input
                      value={newIdioma.idioma}
                      onChange={(e) => setNewIdioma({ ...newIdioma, idioma: e.target.value })}
                      placeholder="Idioma"
                      className="col-span-2"
                      data-testid="input-nuevo-idioma"
                    />
                    <div className="flex gap-2">
                      <Select
                        value={newIdioma.nivel}
                        onValueChange={(nivel) => setNewIdioma({ ...newIdioma, nivel })}
                      >
                        <SelectTrigger data-testid="select-nivel-idioma">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {nivelesIdioma.map((nivel) => (
                            <SelectItem key={nivel.value} value={nivel.value}>
                              {nivel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addIdioma}
                        data-testid="button-add-idioma"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    {(form.watch("idiomas") || []).map((idioma, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                        data-testid={`item-idioma-${index}`}
                      >
                        <span className="text-sm">
                          {idioma.idioma} - <span className="text-muted-foreground">{idioma.nivel}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIdioma(index)}
                          data-testid={`button-remove-idioma-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documentos" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="cvUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CV URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="URL del CV" data-testid="input-cv-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          rows={6}
                          placeholder="Notas sobre el candidato, observaciones, comentarios..."
                          data-testid="textarea-notas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending ? "Guardando..." : candidato ? "Actualizar" : "Crear Candidato"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
