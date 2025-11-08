import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCentroTrabajoSchema, type InsertCentroTrabajo, type CentroTrabajo, type Empresa, type RegistroPatronal } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface CentroTrabajoFormProps {
  centro?: CentroTrabajo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CentroTrabajoForm({ centro, onSuccess, onCancel }: CentroTrabajoFormProps) {
  const { toast } = useToast();
  const isEditing = !!centro;

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const { data: registrosPatronales = [] } = useQuery<RegistroPatronal[]>({
    queryKey: ["/api/registros-patronales"],
  });

  const form = useForm<InsertCentroTrabajo>({
    resolver: zodResolver(insertCentroTrabajoSchema),
    defaultValues: {
      nombre: centro?.nombre || "",
      calle: centro?.calle || "",
      numeroExterior: centro?.numeroExterior || "",
      numeroInterior: centro?.numeroInterior || "",
      colonia: centro?.colonia || "",
      municipio: centro?.municipio || "",
      estado: centro?.estado || "",
      codigoPostal: centro?.codigoPostal || "",
      horaEntrada: centro?.horaEntrada || "09:00",
      horaSalida: centro?.horaSalida || "18:00",
      turno: centro?.turno || "matutino",
      empresaId: centro?.empresaId || "",
      registroPatronalId: centro?.registroPatronalId || undefined,
      descripcion: centro?.descripcion || "",
      responsable: centro?.responsable || "",
      estatus: centro?.estatus || "activo",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertCentroTrabajo) => {
      if (isEditing && centro?.id) {
        return await apiRequest("PATCH", `/api/centros-trabajo/${centro.id}`, data);
      }
      return await apiRequest("POST", "/api/centros-trabajo", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/centros-trabajo"] });
      toast({
        title: isEditing ? "Centro actualizado" : "Centro creado",
        description: isEditing
          ? "El centro de trabajo ha sido actualizado correctamente"
          : "El centro de trabajo ha sido creado correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el centro de trabajo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCentroTrabajo) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Centro</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej: Planta Matriz, Sucursal Norte"
                    data-testid="input-nombre"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="empresaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-empresa">
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id!}>
                        {empresa.razonSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Dirección</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="calle"
              render={({ field }) => (
                <FormItem>
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
                  <FormLabel>Número Exterior</FormLabel>
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
                  <FormLabel>Número Interior</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Opcional" data-testid="input-numero-interior" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
              name="codigoPostal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-codigo-postal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Horarios y Turnos</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="horaEntrada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de Entrada</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="time"
                      data-testid="input-hora-entrada"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horaSalida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de Salida</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="time"
                      data-testid="input-hora-salida"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="turno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Turno</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "matutino"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-turno">
                        <SelectValue placeholder="Selecciona un turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="matutino">Matutino</SelectItem>
                      <SelectItem value="vespertino">Vespertino</SelectItem>
                      <SelectItem value="nocturno">Nocturno</SelectItem>
                      <SelectItem value="mixto">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="registroPatronalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registro Patronal (Opcional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                  defaultValue={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-registro-patronal">
                      <SelectValue placeholder="Selecciona un registro" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin registro patronal</SelectItem>
                    {registrosPatronales.map((registro) => (
                      <SelectItem key={registro.id} value={registro.id!}>
                        {registro.numeroRegistro} - {registro.delegacion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Opcional: Vincula este centro a un registro patronal específico
                </FormDescription>
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "activo"}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-estatus">
                      <SelectValue placeholder="Selecciona un estatus" />
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
          name="responsable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  placeholder="Nombre del responsable del centro"
                  data-testid="input-responsable"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Descripción del centro de trabajo"
                  rows={3}
                  data-testid="textarea-descripcion"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
            data-testid="button-cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-guardar"
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Actualizar" : "Crear"} Centro
          </Button>
        </div>
      </form>
    </Form>
  );
}
