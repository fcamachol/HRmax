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
import { insertRegistroREPSESchema, type RegistroREPSE, type Empresa } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

const formSchema = insertRegistroREPSESchema.extend({
  empresaId: z.string().min(1, "La empresa es requerida"),
  numeroRegistro: z.string().min(1, "El número de registro es requerido"),
  fechaEmision: z.string().min(1, "La fecha de emisión es requerida"),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
});

type FormData = z.infer<typeof formSchema>;

interface RegistroREPSEFormProps {
  registro?: RegistroREPSE | null;
  empresas: Empresa[];
  onSuccess: () => void;
}

export default function RegistroREPSEForm({ registro, empresas, onSuccess }: RegistroREPSEFormProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresaId: registro?.empresaId || "",
      numeroRegistro: registro?.numeroRegistro || "",
      fechaEmision: registro?.fechaEmision ? format(new Date(registro.fechaEmision), 'yyyy-MM-dd') : "",
      fechaVencimiento: registro?.fechaVencimiento ? format(new Date(registro.fechaVencimiento), 'yyyy-MM-dd') : "",
      estatus: registro?.estatus || "vigente",
      tipoRegistro: registro?.tipoRegistro || "servicios_especializados",
      archivoUrl: registro?.archivoUrl || "",
      archivoNombre: registro?.archivoNombre || "",
      alertaVencimiento90: registro?.alertaVencimiento90 || false,
      alertaVencimiento60: registro?.alertaVencimiento60 || false,
      alertaVencimiento30: registro?.alertaVencimiento30 || false,
      notas: registro?.notas || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (registro) {
        return await apiRequest("PATCH", `/api/registros-repse/${registro.id}`, data);
      } else {
        return await apiRequest("POST", "/api/registros-repse", data);
      }
    },
    onSuccess: () => {
      toast({
        title: registro ? "Registro actualizado" : "Registro creado",
        description: registro 
          ? "El registro REPSE ha sido actualizado correctamente" 
          : "El registro REPSE ha sido creado correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el registro",
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="empresaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-empresa">
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.razonSocial}
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
            name="numeroRegistro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Registro *</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-numero-registro" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipoRegistro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Registro</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-tipo-registro">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="servicios_especializados">Servicios Especializados</SelectItem>
                    <SelectItem value="obras_especializadas">Obras Especializadas</SelectItem>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-estatus">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vigente">Vigente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="en_tramite">En Trámite</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaEmision"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Emisión *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-fecha-emision" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaVencimiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-fecha-vencimiento" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="archivoNombre"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nombre del Archivo PDF</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ejemplo: registro-repse-2024.pdf" data-testid="input-archivo-nombre" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="archivoUrl"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>URL del Archivo (Object Storage)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="URL del archivo en Object Storage" data-testid="input-archivo-url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            data-testid="button-guardar-registro"
          >
            {mutation.isPending ? "Guardando..." : "Guardar Registro"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
