import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SalaryRangeInputs } from "@/components/shared/SalaryRangeInputs";
import { insertVacanteSchema, type Vacante, type Puesto, type InsertVacante } from "@shared/schema";

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
        rangoSalarialMin: vacante.rangoSalarialMin ? parseFloat(vacante.rangoSalarialMin) : undefined,
        rangoSalarialMax: vacante.rangoSalarialMax ? parseFloat(vacante.rangoSalarialMax) : undefined,
        descripcion: vacante.descripcion ?? undefined,
        requisitos: vacante.requisitos ?? undefined,
        responsabilidades: vacante.responsabilidades ?? undefined,
        prestaciones: vacante.prestaciones ?? undefined,
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
      };

  const form = useForm<VacanteFormValues>({
    resolver: zodResolver(vacanteFormSchema),
    defaultValues,
  });

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
        {/* Sección 1: Información Básica */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Información Básica</h3>
            <p className="text-sm text-muted-foreground">Datos generales de la vacante</p>
          </div>

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
                    defaultValue={field.value ?? undefined}
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
                    Opcional: vincula con un puesto del catálogo
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
                    defaultValue={field.value}
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
          </div>
        </div>

        {/* Sección 2: Fechas y Estatus */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Fechas y Estatus</h3>
            <p className="text-sm text-muted-foreground">Periodo y estado de la vacante</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                <FormItem>
                  <FormLabel>Estatus<span className="text-destructive"> *</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
        </div>

        {/* Sección 3: Detalles del Puesto */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Detalles del Puesto</h3>
            <p className="text-sm text-muted-foreground">Condiciones laborales y compensación</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tipoContrato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contrato</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
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
                    defaultValue={field.value ?? undefined}
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
              name="ubicacion"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Ciudad de México, CDMX"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-ubicacion"
                    />
                  </FormControl>
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
        </div>

        {/* Sección 4: Contenido Descriptivo */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Contenido Descriptivo</h3>
            <p className="text-sm text-muted-foreground">Información detallada para candidatos</p>
          </div>

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
                    placeholder="Prestaciones de ley y adicionales (seguro de gastos médicos, vales de despensa, etc.)..."
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
        </div>

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
            disabled={isSubmitting || (puestos.length === 0 && !vacante)}
            data-testid="button-submit"
          >
            {isSubmitting ? "Guardando..." : vacante ? "Actualizar" : "Crear"} Vacante
          </Button>
        </div>
      </form>
    </Form>
  );
}
