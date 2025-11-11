import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Cliente } from "@shared/schema";
import { insertClienteSchema } from "@shared/schema";

const formSchema = insertClienteSchema.extend({
  rfc: z.string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC debe tener máximo 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Formato de RFC inválido"),
  email: z.string().email("Formato de email inválido").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface ClienteFormProps {
  cliente?: Cliente | null;
  onSuccess: () => void;
}

export default function ClienteForm({ cliente, onSuccess }: ClienteFormProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreComercial: cliente?.nombreComercial || "",
      razonSocial: cliente?.razonSocial || "",
      rfc: cliente?.rfc || "",
      activo: cliente?.activo ?? true,
      fechaAlta: cliente?.fechaAlta || new Date().toISOString().split('T')[0],
      telefono: cliente?.telefono ?? "",
      email: cliente?.email ?? "",
      notas: cliente?.notas ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (cliente) {
        return await apiRequest("PATCH", `/api/clientes/${cliente.id}`, data);
      } else {
        return await apiRequest("POST", "/api/clientes", data);
      }
    },
    onSuccess: () => {
      toast({
        title: cliente ? "Cliente actualizado" : "Cliente creado",
        description: cliente 
          ? "El cliente ha sido actualizado correctamente" 
          : "El cliente ha sido creado correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el cliente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Información General</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nombreComercial"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nombre Comercial *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Nombre comercial del cliente"
                      data-testid="input-nombre-comercial"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="razonSocial"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Razón Social *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Razón social del cliente"
                      data-testid="input-razon-social"
                    />
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
                      {...field} 
                      placeholder="ABC123456XYZ"
                      maxLength={13}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      data-testid="input-rfc"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaAlta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Alta *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="date"
                      data-testid="input-fecha-alta"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Datos de Contacto</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="5512345678"
                      data-testid="input-telefono"
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      placeholder="contacto@empresa.com"
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Información Adicional</h3>
          
          <FormField
            control={form.control}
            name="notas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Información adicional sobre el cliente"
                    rows={3}
                    data-testid="input-notas"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="activo"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Estado del Cliente</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    {field.value ? "Cliente activo" : "Cliente inactivo"}
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-activo"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-guardar-cliente"
          >
            {mutation.isPending ? "Guardando..." : "Guardar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
