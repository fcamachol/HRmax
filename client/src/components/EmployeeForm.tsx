import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrestacionesEmpleadoOverride } from "@/components/PrestacionesEmpleadoOverride";
import { Gift } from "lucide-react";

const employeeFormSchema = insertEmployeeSchema;

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormDefaultValues extends Partial<EmployeeFormValues> {
  id?: string;
  puestoId?: string | null;
  esquemaPrestacionesId?: string | null;
}

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormValues) => void;
  defaultValues?: EmployeeFormDefaultValues;
}

export function EmployeeForm({ onSubmit, defaultValues }: EmployeeFormProps) {
  const [prestacionesDialogOpen, setPrestacionesDialogOpen] = useState(false);
  const isEditMode = !!(defaultValues?.id);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: defaultValues || {
      numeroEmpleado: "",
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      rfc: "",
      curp: "",
      nss: "",
      email: "",
      telefono: "",
      departamento: "",
      puesto: "",
      salarioBrutoMensual: "",
      tipoContrato: "indeterminado",
      fechaIngreso: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="numeroEmpleado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Empleado *</FormLabel>
                <FormControl>
                  <Input placeholder="EMP001" {...field} data-testid="input-numeroEmpleado" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre(s) *</FormLabel>
                <FormControl>
                  <Input placeholder="María" {...field} data-testid="input-nombre" />
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
                <FormLabel>Apellido Paterno *</FormLabel>
                <FormControl>
                  <Input placeholder="García" {...field} data-testid="input-apellidoPaterno" />
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
                  <Input placeholder="López" {...field} value={field.value || ""} data-testid="input-apellidoMaterno" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rfc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RFC</FormLabel>
                <FormControl>
                  <Input
                    placeholder="GACM850101AB1"
                    className="font-mono uppercase"
                    maxLength={13}
                    {...field}
                    value={field.value || ""}
                    data-testid="input-rfc"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="curp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CURP</FormLabel>
                <FormControl>
                  <Input
                    placeholder="GACM850101MDFRLR09"
                    className="font-mono uppercase"
                    maxLength={18}
                    {...field}
                    value={field.value || ""}
                    data-testid="input-curp"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nss"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NSS</FormLabel>
                <FormControl>
                  <Input
                    placeholder="12345678901"
                    className="font-mono"
                    maxLength={11}
                    {...field}
                    value={field.value || ""}
                    data-testid="input-nss"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="maria.garcia@empresa.com"
                    {...field}
                    data-testid="input-email"
                  />
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
                <FormLabel>Teléfono *</FormLabel>
                <FormControl>
                  <Input placeholder="5512345678" {...field} data-testid="input-telefono" />
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
                <FormLabel>Departamento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-departamento">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Ventas">Ventas</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="RRHH">RRHH</SelectItem>
                    <SelectItem value="Finanzas">Finanzas</SelectItem>
                    <SelectItem value="Operaciones">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="puesto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Puesto *</FormLabel>
                <FormControl>
                  <Input placeholder="Gerente de Ventas" {...field} data-testid="input-puesto" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salarioBrutoMensual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salario Bruto Mensual (MXN) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="15000.00"
                    {...field}
                    value={field.value || ""}
                    data-testid="input-salarioBrutoMensual"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipoContrato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contrato</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "indeterminado"}>
                  <FormControl>
                    <SelectTrigger data-testid="select-tipoContrato">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="indeterminado">Indeterminado</SelectItem>
                    <SelectItem value="temporal">Temporal</SelectItem>
                    <SelectItem value="por_obra">Por Obra</SelectItem>
                    <SelectItem value="honorarios">Honorarios</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaIngreso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Ingreso *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-fechaIngreso" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between gap-4">
          <div>
            {isEditMode && defaultValues && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPrestacionesDialogOpen(true)}
                data-testid="button-configurar-prestaciones"
              >
                <Gift className="mr-2 h-4 w-4" />
                Configurar Prestaciones Especiales
              </Button>
            )}
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" data-testid="button-cancel">
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit">
              Guardar Empleado
            </Button>
          </div>
        </div>
      </form>

      {isEditMode && defaultValues && (
        <PrestacionesEmpleadoOverride
          employee={{
            id: defaultValues.id!,
            nombre: defaultValues.nombre || "",
            apellidoPaterno: defaultValues.apellidoPaterno || "",
            apellidoMaterno: defaultValues.apellidoMaterno ?? undefined,
            puestoId: defaultValues.puestoId ?? null,
            esquemaPrestacionesId: defaultValues.esquemaPrestacionesId ?? null,
          }}
          open={prestacionesDialogOpen}
          onOpenChange={setPrestacionesDialogOpen}
        />
      )}
    </Form>
  );
}
