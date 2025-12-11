import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmpresaSchema, type Empresa, type InsertEmpresa } from "@shared/schema";
import { useCliente } from "@/contexts/ClienteContext";

interface EmpresaFormProps {
  empresa?: Empresa;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmpresaForm({ empresa, onSuccess, onCancel }: EmpresaFormProps) {
  const { toast } = useToast();
  const { selectedCliente } = useCliente();
  const isEditing = !!empresa;

  const form = useForm<InsertEmpresa>({
    resolver: zodResolver(insertEmpresaSchema),
    defaultValues: empresa || {
      razonSocial: "",
      nombreComercial: "",
      rfc: "",
      regimenFiscal: "",
      actividadEconomica: "",
      calle: "",
      numeroExterior: "",
      numeroInterior: "",
      colonia: "",
      municipio: "",
      estado: "",
      codigoPostal: "",
      pais: "México",
      telefono: "",
      email: "",
      sitioWeb: "",
      representanteLegal: "",
      rfcRepresentante: "",
      curpRepresentante: "",
      notas: "",
      estatus: "activa",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmpresa) => {
      const endpoint = isEditing ? `/api/empresas/${empresa.id}` : "/api/empresas";
      const method = isEditing ? "PATCH" : "POST";
      // Automatically assign clienteId from context when creating new empresa
      const payload = isEditing ? data : { ...data, clienteId: selectedCliente?.id };
      return await apiRequest(method, endpoint, payload);
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Empresa actualizada" : "Empresa creada",
        description: isEditing
          ? "La empresa ha sido actualizada correctamente"
          : "La empresa ha sido creada correctamente",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la empresa",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmpresa) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="razonSocial"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
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
                  <Input {...field} value={field.value || ""} data-testid="input-nombre-comercial" />
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
                    maxLength={13}
                    placeholder="ABC123456XYZ"
                    className="font-mono uppercase"
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
            name="regimenFiscal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Régimen Fiscal</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-regimen-fiscal" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actividadEconomica"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actividad Económica</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-actividad-economica" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Domicilio Fiscal</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="calle"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Calle</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-calle" />
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
                  <FormLabel>No. Ext</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-numero-exterior" />
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
                  <FormLabel>No. Int</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-numero-interior" />
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
                    <Input {...field} value={field.value || ""} data-testid="input-colonia" />
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
                  <FormLabel>Municipio</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-municipio" />
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
                    <Input {...field} value={field.value || ""} data-testid="input-estado" />
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
                  <FormLabel>C.P.</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} maxLength={5} data-testid="input-codigo-postal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-pais" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Contacto</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} type="tel" data-testid="input-telefono" />
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
                    <Input {...field} value={field.value || ""} type="email" data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sitioWeb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio Web</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} type="url" data-testid="input-sitio-web" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Representante Legal</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="representanteLegal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-representante-legal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rfcRepresentante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFC</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      maxLength={13}
                      className="font-mono uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      data-testid="input-rfc-representante"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="curpRepresentante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CURP</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      maxLength={18}
                      className="font-mono uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      data-testid="input-curp-representante"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="estatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estatus</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || "activa"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-estatus">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="activa">Activa</SelectItem>
                      <SelectItem value="suspendida">Suspendida</SelectItem>
                      <SelectItem value="inactiva">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    rows={3}
                    placeholder="Información adicional sobre la empresa..."
                    data-testid="input-notas"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancelar">
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={createMutation.isPending} data-testid="button-guardar">
            {createMutation.isPending
              ? isEditing
                ? "Actualizando..."
                : "Creando..."
              : isEditing
              ? "Actualizar Empresa"
              : "Crear Empresa"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
