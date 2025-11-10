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
import { ConceptoMedioPagoForm } from "@/components/configuracion/ConceptoMedioPagoForm";
import { useToast } from "@/hooks/use-toast";
import type { ConceptoMedioPagoWithRelations } from "@shared/schema";

export function ConceptosMedioPagoTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConcepto, setSelectedConcepto] = useState<ConceptoMedioPagoWithRelations | null>(null);
  const { toast } = useToast();

  const { data: conceptos = [], isLoading } = useQuery<ConceptoMedioPagoWithRelations[]>({
    queryKey: ["/api/conceptos-medio-pago"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/conceptos-medio-pago/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conceptos-medio-pago"] });
      toast({
        title: "Concepto eliminado",
        description: "El concepto de medio de pago ha sido eliminado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el concepto",
        variant: "destructive",
      });
    },
  });

  const filteredConceptos = conceptos.filter((concepto) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      concepto.nombre.toLowerCase().includes(searchLower) ||
      concepto.formula?.toLowerCase().includes(searchLower) ||
      concepto.tipo.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (concepto: ConceptoMedioPagoWithRelations) => {
    setSelectedConcepto(concepto);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este concepto?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedConcepto(null);
  };

  const getTipoDisplay = (tipo: string) => {
    switch (tipo) {
      case "percepcion":
        return { label: "Percepción", variant: "default" as const };
      case "deduccion":
        return { label: "Deducción", variant: "secondary" as const };
      default:
        return { label: tipo, variant: "outline" as const };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Conceptos de Medio de Pago</h2>
          <p className="text-muted-foreground text-sm">
            Configura conceptos con fórmulas dinámicas para cálculos asociados a medios de pago
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-nuevo-concepto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Concepto
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, fórmula o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-conceptos"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fórmula</TableHead>
              <TableHead>Gravable ISR</TableHead>
              <TableHead>Integra SBC</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredConceptos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {searchTerm
                    ? "No se encontraron conceptos que coincidan con la búsqueda"
                    : "No hay conceptos configurados. Crea uno nuevo para comenzar."}
                </TableCell>
              </TableRow>
            ) : (
              filteredConceptos.map((concepto) => {
                const tipoDisplay = getTipoDisplay(concepto.tipo);
                return (
                  <TableRow key={concepto.id} data-testid={`row-concepto-${concepto.id}`}>
                    <TableCell className="font-medium">{concepto.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={tipoDisplay.variant}>{tipoDisplay.label}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {concepto.formula || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {concepto.gravableISR ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Sí
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {concepto.integraSBC ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Sí
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {concepto.activo ? (
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
                          onClick={() => handleEdit(concepto)}
                          data-testid={`button-edit-concepto-${concepto.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(concepto.id!)}
                          data-testid={`button-delete-concepto-${concepto.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ConceptoMedioPagoForm
        open={dialogOpen}
        onClose={handleDialogClose}
        concepto={selectedConcepto}
      />
    </div>
  );
}
