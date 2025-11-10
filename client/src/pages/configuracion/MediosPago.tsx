import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { MedioPagoForm } from "@/components/configuracion/MedioPagoForm";
import type { MedioPago } from "@shared/schema";

export default function MediosPago() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMedio, setSelectedMedio] = useState<MedioPago | undefined>();

  const { data: mediosPago = [], isLoading } = useQuery<MedioPago[]>({
    queryKey: ["/api/medios-pago"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/medios-pago/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medios-pago"] });
    },
  });

  const filteredMedios = mediosPago.filter((medio) => {
    const matchesSearch = medio.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medio.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medio.cuentaDeposito?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = (medio: MedioPago) => {
    setSelectedMedio(medio);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este medio de pago?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedMedio(undefined);
  };

  const getTipoComprobanteBadge = (tipo: string) => {
    const tipoMap: Record<string, { label: string; variant: any }> = {
      factura: { label: "Factura", variant: "default" as const },
      recibo_sin_iva: { label: "Recibo sin IVA", variant: "secondary" as const },
    };
    const config = tipoMap[tipo] || { label: tipo, variant: "secondary" as const };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medios de Pago</h1>
          <p className="text-muted-foreground">
            Configuración de plataformas de pago (monederos electrónicos, sindicatos)
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-nuevo-medio-pago">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Medio de Pago
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, descripción o cuenta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-medios-pago"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo Comprobante</TableHead>
              <TableHead>Cuenta Depósito</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Cargando medios de pago...
                </TableCell>
              </TableRow>
            ) : filteredMedios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No se encontraron medios de pago" : "No hay medios de pago registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredMedios.map((medio) => (
                <TableRow key={medio.id} data-testid={`row-medio-pago-${medio.id}`}>
                  <TableCell className="font-medium" data-testid={`text-nombre-${medio.id}`}>
                    {medio.nombre}
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`text-descripcion-${medio.id}`}>
                    {medio.descripcion || "-"}
                  </TableCell>
                  <TableCell data-testid={`badge-tipo-comprobante-${medio.id}`}>
                    {getTipoComprobanteBadge(medio.tipoComprobante)}
                  </TableCell>
                  <TableCell className="font-mono text-sm" data-testid={`text-cuenta-deposito-${medio.id}`}>
                    {medio.cuentaDeposito}
                  </TableCell>
                  <TableCell className="text-center" data-testid={`badge-estado-${medio.id}`}>
                    {medio.activo ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(medio)}
                        data-testid={`button-edit-${medio.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(medio.id!)}
                        data-testid={`button-delete-${medio.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MedioPagoForm
        open={dialogOpen}
        onClose={handleDialogClose}
        medioPago={selectedMedio}
      />
    </div>
  );
}
