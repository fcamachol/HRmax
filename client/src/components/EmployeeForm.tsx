import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

const employeeFormSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  rfc: z.string().length(13, "El RFC debe tener 13 caracteres").toUpperCase(),
  curp: z.string().length(18, "El CURP debe tener 18 caracteres").toUpperCase(),
  nss: z.string().length(11, "El NSS debe tener 11 dígitos"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  department: z.string().min(1, "Selecciona un departamento"),
  position: z.string().min(1, "El puesto es requerido"),
  salary: z.string().min(1, "El salario es requerido"),
  contractType: z.string().min(1, "Selecciona un tipo de contrato"),
  startDate: z.string().min(1, "La fecha de ingreso es requerida"),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormValues) => void;
  defaultValues?: Partial<EmployeeFormValues>;
}

export function EmployeeForm({ onSubmit, defaultValues }: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: defaultValues || {
      firstName: "",
      lastName: "",
      rfc: "",
      curp: "",
      nss: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      salary: "",
      contractType: "",
      startDate: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre(s) *</FormLabel>
                <FormControl>
                  <Input placeholder="María" {...field} data-testid="input-firstName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido(s) *</FormLabel>
                <FormControl>
                  <Input placeholder="García López" {...field} data-testid="input-lastName" />
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
                <FormLabel>RFC *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="GACM850101AB1"
                    className="font-mono uppercase"
                    maxLength={13}
                    {...field}
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
                <FormLabel>CURP *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="GACM850101MDFRLR09"
                    className="font-mono uppercase"
                    maxLength={18}
                    {...field}
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
                <FormLabel>NSS *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="12345678901"
                    className="font-mono"
                    maxLength={11}
                    {...field}
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono *</FormLabel>
                <FormControl>
                  <Input placeholder="5512345678" {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-department">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ventas">Ventas</SelectItem>
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="rrhh">RRHH</SelectItem>
                    <SelectItem value="finanzas">Finanzas</SelectItem>
                    <SelectItem value="operaciones">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Puesto *</FormLabel>
                <FormControl>
                  <Input placeholder="Gerente de Ventas" {...field} data-testid="input-position" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salario Mensual (MXN) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="15000.00"
                    {...field}
                    data-testid="input-salary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contractType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contrato *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-contractType">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="indefinido">Indefinido</SelectItem>
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
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Ingreso *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-startDate" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" data-testid="button-cancel">
            Cancelar
          </Button>
          <Button type="submit" data-testid="button-submit">
            Guardar Empleado
          </Button>
        </div>
      </form>
    </Form>
  );
}
