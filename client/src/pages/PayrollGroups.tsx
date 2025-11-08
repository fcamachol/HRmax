import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Users, Edit, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type GrupoNomina = {
  id: string;
  nombre: string;
  tipoPeriodo: "semanal" | "catorcenal" | "quincenal" | "mensual";
  diaInicioSemana: number | null;
  diaCorte: number | null;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

type PayrollPeriod = {
  id: string;
  grupoNominaId: string;
  startDate: string;
  endDate: string;
  frequency: string;
  year: number;
  periodNumber: number;
  status: string;
  createdAt: string;
};

const tipoPeriodoLabels = {
  semanal: "Semanal",
  catorcenal: "Catorcenal (14 días)",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

const diasSemanaLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function PayrollGroups() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GrupoNomina | null>(null);
  const [formData, setFormData] = useState<{
    nombre: string;
    tipoPeriodo: "semanal" | "catorcenal" | "quincenal" | "mensual";
    diaInicioSemana: number;
    diaCorte: number | null;
    descripcion: string;
  }>({
    nombre: "",
    tipoPeriodo: "quincenal",
    diaInicioSemana: 1,
    diaCorte: null,
    descripcion: "",
  });

  const { data: grupos = [] } = useQuery<GrupoNomina[]>({
    queryKey: ["/api/grupos-nomina"],
  });

  // Get upcoming periods (next 6 periods from today)
  const { data: upcomingPeriods = [] } = useQuery<PayrollPeriod[]>({
    queryKey: ["/api/upcoming-payroll-periods"],
    enabled: false, // We'll implement this endpoint or calculate client-side
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest("POST", "/api/grupos-nomina", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos-nomina"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Grupo creado",
        description: "El grupo de nómina se ha creado exitosamente y se generaron los periodos de pago automáticamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      apiRequest("PATCH", `/api/grupos-nomina/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos-nomina"] });
      setDialogOpen(false);
      setEditingGroup(null);
      resetForm();
      toast({
        title: "Grupo actualizado",
        description: "El grupo de nómina se ha actualizado exitosamente.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/grupos-nomina/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos-nomina"] });
      toast({
        title: "Grupo eliminado",
        description: "El grupo de nómina se ha eliminado exitosamente.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipoPeriodo: "quincenal",
      diaInicioSemana: 1,
      diaCorte: null,
      descripcion: "",
    });
  };

  const handleOpenDialog = (group?: GrupoNomina) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        nombre: group.nombre,
        tipoPeriodo: group.tipoPeriodo,
        diaInicioSemana: group.diaInicioSemana || 1,
        diaCorte: group.diaCorte,
        descripcion: group.descripcion || "",
      });
    } else {
      setEditingGroup(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    // Normalize data based on frequency type - create proper DTO
    type CreateGrupoDTO = {
      nombre: string;
      tipoPeriodo: "semanal" | "catorcenal" | "quincenal" | "mensual";
      descripcion: string;
      diaInicioSemana?: number;
      diaCorte?: number | null;
    };

    const normalizedData: CreateGrupoDTO = {
      nombre: formData.nombre,
      tipoPeriodo: formData.tipoPeriodo,
      descripcion: formData.descripcion,
    };

    // Only include diaInicioSemana for weekly/biweekly frequencies
    if (formData.tipoPeriodo === "semanal" || formData.tipoPeriodo === "catorcenal") {
      normalizedData.diaInicioSemana = formData.diaInicioSemana;
    }

    // Include diaCorte if provided (for monthly/bimonthly)
    if (formData.diaCorte !== null) {
      normalizedData.diaCorte = formData.diaCorte;
    }

    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: normalizedData });
    } else {
      createMutation.mutate(normalizedData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este grupo de nómina?")) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate upcoming periods for display based on group configuration
  const getUpcomingPeriodsForGroup = (group: GrupoNomina): { startDate: Date; endDate: Date; periodName: string }[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const periods: { startDate: Date; endDate: Date; periodName: string }[] = [];
    
    switch (group.tipoPeriodo) {
      case "quincenal": {
        // Determine if we're in first or second half of month
        const currentDate = today.getDate();
        const isFirstHalf = currentDate <= 15;
        
        // Start from current period and generate 4 periods
        let periodCount = 0;
        let monthOffset = 0;
        
        while (periodCount < 4) {
          const month = currentMonth + monthOffset;
          const year = currentYear + Math.floor(month / 12);
          const adjustedMonth = month % 12;
          
          // If it's the first iteration and we're in second half, skip first half
          if (monthOffset === 0 && !isFirstHalf) {
            // Only add second half of current month
            const lastDay = new Date(year, adjustedMonth + 1, 0).getDate();
            const secondHalfStart = new Date(year, adjustedMonth, 16);
            const secondHalfEnd = new Date(year, adjustedMonth, lastDay);
            secondHalfEnd.setHours(23, 59, 59, 999);
            
            periods.push({
              startDate: secondHalfStart,
              endDate: secondHalfEnd,
              periodName: `2ª Quincena ${format(secondHalfStart, 'MMMM yyyy', { locale: es })}`,
            });
            periodCount++;
          } else {
            // Add both halves for this month
            // Primera quincena (1-15)
            const firstHalfStart = new Date(year, adjustedMonth, 1);
            const firstHalfEnd = new Date(year, adjustedMonth, 15);
            firstHalfEnd.setHours(23, 59, 59, 999);
            
            periods.push({
              startDate: firstHalfStart,
              endDate: firstHalfEnd,
              periodName: `1ª Quincena ${format(firstHalfStart, 'MMMM yyyy', { locale: es })}`,
            });
            periodCount++;
            
            if (periodCount < 4) {
              // Segunda quincena (16-fin de mes)
              const lastDay = new Date(year, adjustedMonth + 1, 0).getDate();
              const secondHalfStart = new Date(year, adjustedMonth, 16);
              const secondHalfEnd = new Date(year, adjustedMonth, lastDay);
              secondHalfEnd.setHours(23, 59, 59, 999);
              
              periods.push({
                startDate: secondHalfStart,
                endDate: secondHalfEnd,
                periodName: `2ª Quincena ${format(secondHalfStart, 'MMMM yyyy', { locale: es })}`,
              });
              periodCount++;
            }
          }
          
          monthOffset++;
        }
        break;
      }
        
      case "mensual": {
        // Generate monthly periods for current and next 3 months (total 4)
        for (let i = 0; i < 4; i++) {
          const month = currentMonth + i;
          const year = currentYear + Math.floor(month / 12);
          const adjustedMonth = month % 12;
          const monthStart = new Date(year, adjustedMonth, 1);
          const lastDay = new Date(year, adjustedMonth + 1, 0).getDate();
          const monthEnd = new Date(year, adjustedMonth, lastDay);
          monthEnd.setHours(23, 59, 59, 999);
          
          periods.push({
            startDate: monthStart,
            endDate: monthEnd,
            periodName: format(monthStart, 'MMMM yyyy', { locale: es }),
          });
        }
        break;
      }
        
      case "semanal": {
        // Find the most recent period start (on or before today)
        const targetDay = group.diaInicioSemana || 1;
        const currentDayOfWeek = today.getDay();
        
        // Calculate days since last target day
        let daysSinceStart = (currentDayOfWeek - targetDay + 7) % 7;
        const currentPeriodStart = new Date(today);
        currentPeriodStart.setDate(currentPeriodStart.getDate() - daysSinceStart);
        
        // Generate 4 weekly periods starting from current period
        for (let i = 0; i < 4; i++) {
          const periodStart = new Date(currentPeriodStart);
          periodStart.setDate(periodStart.getDate() + (i * 7));
          const periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 6);
          periodEnd.setHours(23, 59, 59, 999);
          
          periods.push({
            startDate: periodStart,
            endDate: periodEnd,
            periodName: `Semana ${i + 1} - ${format(periodStart, 'dd MMM', { locale: es })}`,
          });
        }
        break;
      }
        
      case "catorcenal": {
        // Find the most recent period start (on or before today)
        const targetDay = group.diaInicioSemana || 1;
        const currentDayOfWeek = today.getDay();
        
        // Calculate days since last target day
        let daysSinceStart = (currentDayOfWeek - targetDay + 7) % 7;
        const currentPeriodStart = new Date(today);
        currentPeriodStart.setDate(currentPeriodStart.getDate() - daysSinceStart);
        
        // Generate 4 biweekly periods starting from current period
        for (let i = 0; i < 4; i++) {
          const periodStart = new Date(currentPeriodStart);
          periodStart.setDate(periodStart.getDate() + (i * 14));
          const periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 13);
          periodEnd.setHours(23, 59, 59, 999);
          
          periods.push({
            startDate: periodStart,
            endDate: periodEnd,
            periodName: `Catorcenal ${i + 1} - ${format(periodStart, 'dd MMM', { locale: es })}`,
          });
        }
        break;
      }
    }
    
    // Filter out completely past periods (endDate < today) and limit to 4
    return periods.filter(p => p.endDate >= today).slice(0, 4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Grupos de Nómina</h1>
          <p className="text-muted-foreground mt-2">
            Administra los grupos de nómina y sus periodicidades de pago
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-create-grupo">
          <Plus className="h-4 w-4 mr-2" />
          Crear Grupo
        </Button>
      </div>

      {/* Próximas Nóminas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Próximas Nóminas a Pagar
          </CardTitle>
          <CardDescription>
            Periodos de pago programados próximamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {grupos.filter(g => g.activo).map((grupo) => (
              <Card key={grupo.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{grupo.nombre}</CardTitle>
                    <Badge variant="outline">{tipoPeriodoLabels[grupo.tipoPeriodo]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {getUpcomingPeriodsForGroup(grupo).map((period, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm p-2 rounded-md hover-elevate"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{period.periodName}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {format(period.startDate, 'dd/MMM', { locale: es })} - {format(period.endDate, 'dd/MMM', { locale: es })}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            
            {grupos.filter(g => g.activo).length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                No hay grupos de nómina activos. Crea uno para ver las próximas nóminas.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Grupos */}
      <Card>
        <CardHeader>
          <CardTitle>Grupos de Nómina Configurados</CardTitle>
          <CardDescription>
            Administra los grupos y sus configuraciones de periodicidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Periodicidad</TableHead>
                <TableHead>Configuración</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grupos.map((grupo) => (
                <TableRow key={grupo.id}>
                  <TableCell className="font-medium">{grupo.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tipoPeriodoLabels[grupo.tipoPeriodo]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(grupo.tipoPeriodo === "semanal" || grupo.tipoPeriodo === "catorcenal") && (
                      <span>Inicia: {diasSemanaLabels[grupo.diaInicioSemana || 1]}</span>
                    )}
                    {grupo.diaCorte && <span>Corte día {grupo.diaCorte}</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {grupo.descripcion || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={grupo.activo ? "default" : "outline"}>
                      {grupo.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(grupo)}
                      data-testid={`button-edit-${grupo.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(grupo.id)}
                      data-testid={`button-delete-${grupo.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {grupos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay grupos de nómina configurados. Crea uno para comenzar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para crear/editar grupo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Editar Grupo de Nómina" : "Crear Grupo de Nómina"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup 
                ? "Modifica la información del grupo de nómina"
                : "Configura un nuevo grupo de nómina. Los periodos de pago se generarán automáticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Grupo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="ej. Empleados Administrativos"
                data-testid="input-grupo-nombre"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoPeriodo" className="text-base font-semibold">
                Periodicidad de Pago * 
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Define cada cuándo se pagará la nómina)
                </span>
              </Label>
              <Select
                value={formData.tipoPeriodo}
                onValueChange={(value: "semanal" | "catorcenal" | "quincenal" | "mensual") =>
                  setFormData({ ...formData, tipoPeriodo: value })
                }
              >
                <SelectTrigger id="tipoPeriodo" data-testid="select-tipo-periodo" className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">
                    <div className="py-1">
                      <div className="font-medium">Semanal</div>
                      <div className="text-xs text-muted-foreground">Cada 7 días (~52 periodos al año)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="catorcenal">
                    <div className="py-1">
                      <div className="font-medium">Catorcenal</div>
                      <div className="text-xs text-muted-foreground">Cada 14 días (~26 periodos al año)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="quincenal">
                    <div className="py-1">
                      <div className="font-medium">Quincenal</div>
                      <div className="text-xs text-muted-foreground">Dos veces al mes (24 periodos al año)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="mensual">
                    <div className="py-1">
                      <div className="font-medium">Mensual</div>
                      <div className="text-xs text-muted-foreground">Una vez al mes (12 periodos al año)</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.tipoPeriodo === "semanal" || formData.tipoPeriodo === "catorcenal") && (
              <div className="space-y-2">
                <Label htmlFor="diaInicioSemana">Día de Inicio de Semana</Label>
                <Select
                  value={String(formData.diaInicioSemana)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, diaInicioSemana: Number(value) })
                  }
                >
                  <SelectTrigger id="diaInicioSemana" data-testid="select-dia-inicio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemanaLabels.map((dia, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe el propósito de este grupo de nómina"
                rows={3}
                data-testid="input-descripcion"
              />
            </div>

            {!editingGroup && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Al crear este grupo, se generarán automáticamente todos los periodos de pago 
                  para el año {new Date().getFullYear()} y {new Date().getFullYear() + 1}.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingGroup(null);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.nombre || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-grupo"
            >
              {editingGroup ? "Guardar Cambios" : "Crear Grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
