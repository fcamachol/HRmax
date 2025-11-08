import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertClienteREPSESchema, type ClienteREPSE } from "@shared/schema";
import { z } from "zod";

const formSchema = insertClienteREPSESchema.extend({
  razonSocial: z.string().min(1, "La razón social es requerida"),
  rfc: z.string().min(12, "El RFC debe tener al menos 12 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface ClienteREPSEFormProps {
  cliente?: ClienteREPSE | null;
  onSuccess: () => void;
}

export default function ClienteREPSEForm({ cliente, onSuccess }: ClienteREPSEFormProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razonSocial: cliente?.razonSocial || "",
      rfc: cliente?.rfc || "",
      nombreComercial: cliente?.nombreComercial || "",
      giro: cliente?.giro || "",
      calle: cliente?.calle || "",
      numeroExterior: cliente?.numeroExterior || "",
      numeroInterior: cliente?.numeroInterior || "",
      colonia: cliente?.colonia || "",
      municipio: cliente?.municipio || "",
      estado: cliente?.estado || "",
      codigoPostal: cliente?.codigoPostal || "",
      telefono: cliente?.telefono || "",
      email: cliente?.email || "",
      contactoPrincipal: cliente?.contactoPrincipal || "",
      puestoContacto: cliente?.puestoContacto || "",
      telefonoContacto: cliente?.telefonoContacto || "",
      emailContacto: cliente?.emailContacto || "",
      estatus: cliente?.estatus || "activo",
      notas: cliente?.notas || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (cliente) {
        return await apiRequest("PATCH", `/api/clientes-repse/${cliente.id}`, data);
      } else {
        return await apiRequest("POST", "/api/clientes-repse", data);
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
              name="razonSocial"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Razón Social *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-razon-social" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombreComercial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Comercial</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-nombre-comercial" />
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
                    <Input {...field} data-testid="input-rfc" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="giro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giro</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-giro" />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-estatus">
                        <SelectValue />
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
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Dirección</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="calle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calle</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-calle" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroExterior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número Exterior</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-numero-exterior" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroInterior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número Interior</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-numero-interior" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="colonia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colonia</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-colonia" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="municipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio/Delegación</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-municipio" />
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
                    <Input {...field} data-testid="input-estado" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codigoPostal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-codigo-postal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Contacto</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-telefono" />
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
                    <Input type="email" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactoPrincipal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contacto Principal</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-contacto-principal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="puestoContacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puesto del Contacto</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-puesto-contacto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefonoContacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono del Contacto</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-telefono-contacto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailContacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Contacto</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} data-testid="input-email-contacto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} data-testid="textarea-notas" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
