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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertContratoREPSESchema, type ContratoREPSE, type Empresa, type ClienteREPSE, type RegistroREPSE } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

const formSchema = insertContratoREPSESchema.extend({
  empresaId: z.string().min(1, "La empresa es requerida"),
  registroREPSEId: z.string().min(1, "El registro REPSE es requerido"),
  clienteId: z.string().min(1, "El cliente es requerido"),
  numeroContrato: z.string().min(1, "El número de contrato es requerido"),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  serviciosEspecializados: z.string().min(1, "Los servicios especializados son requeridos"),
});

type FormData = z.infer<typeof formSchema>;

interface ContratoREPSEFormProps {
  contrato?: ContratoREPSE | null;
  empresas: Empresa[];
  clientes: ClienteREPSE[];
  registros: RegistroREPSE[];
  onSuccess: () => void;
}

export default function ContratoREPSEForm({ contrato, empresas, clientes, registros, onSuccess }: ContratoREPSEFormProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresaId: contrato?.empresaId || "",
      registroREPSEId: contrato?.registroREPSEId || "",
      clienteId: contrato?.clienteId || "",
      numeroContrato: contrato?.numeroContrato || "",
      fechaInicio: contrato?.fechaInicio ? format(new Date(contrato.fechaInicio), 'yyyy-MM-dd') : "",
      fechaFin: contrato?.fechaFin ? format(new Date(contrato.fechaFin), 'yyyy-MM-dd') : "",
      serviciosEspecializados: contrato?.serviciosEspecializados || "",
      objetoContrato: contrato?.objetoContrato || "",
      montoContrato: contrato?.montoContrato || "",
      archivoUrl: contrato?.archivoUrl || "",
      archivoNombre: contrato?.archivoNombre || "",
      notificadoIMSS: contrato?.notificadoIMSS || false,
      numeroAvisoIMSS: contrato?.numeroAvisoIMSS || "",
      fechaNotificacionIMSS: contrato?.fechaNotificacionIMSS ? format(new Date(contrato.fechaNotificacionIMSS), 'yyyy-MM-dd') : "",
      estatus: contrato?.estatus || "vigente",
      notas: contrato?.notas || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (contrato) {
        return await apiRequest("PATCH", `/api/contratos-repse/${contrato.id}`, data);
      } else {
        return await apiRequest("POST", "/api/contratos-repse", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contratos-repse"] });
      toast({
        title: contrato ? "Contrato actualizado" : "Contrato creado",
        description: contrato 
          ? "El contrato ha sido actualizado correctamente" 
          : "El contrato ha sido creado correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el contrato",
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
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="registroREPSEId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registro REPSE *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-registro-repse">
                      <SelectValue placeholder="Seleccionar registro" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {registros.map((registro) => (
                      <SelectItem key={registro.id} value={registro.id}>
                        {registro.numeroRegistro}
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
            name="clienteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-cliente">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.razonSocial}
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
            name="numeroContrato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Contrato *</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-numero-contrato" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaInicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Inicio *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-fecha-inicio" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaFin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Fin</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-fecha-fin" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="montoContrato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto del Contrato</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    data-testid="input-monto-contrato" 
                  />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-estatus">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vigente">Vigente</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="serviciosEspecializados"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Servicios Especializados *</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} data-testid="textarea-servicios" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objetoContrato"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objeto del Contrato</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} data-testid="textarea-objeto" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Notificación IMSS</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="notificadoIMSS"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-notificado-imss"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Notificado al IMSS</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroAvisoIMSS"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Aviso IMSS</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-numero-aviso-imss" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaNotificacionIMSS"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Fecha de Notificación IMSS</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-fecha-notificacion-imss" />
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
            data-testid="button-guardar-contrato"
          >
            {mutation.isPending ? "Guardando..." : "Guardar Contrato"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
