import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, UserPlus, MoreVertical, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Candidato, type InsertCandidato, type EtapaSeleccion, type InsertProcesoSeleccion, type ProcesoSeleccion, type Vacante } from "@shared/schema";
import { CandidatoForm } from "@/components/reclutamiento/CandidatoForm";

type CandidatoEstatus = "activo" | "contratado" | "descartado" | "inactivo";

export default function Candidatos() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CandidatoEstatus | "todos">("todos");
  const [fuenteFilter, setFuenteFilter] = useState<string>("todas");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCandidato, setEditingCandidato] = useState<Candidato | null>(null);
  const { toast } = useToast();

  const { data: candidatos = [], isLoading } = useQuery<Candidato[]>({
    queryKey: ["/api/candidatos"],
  });

  // Cargar etapas de selección para obtener la etapa inicial
  const { data: etapas = [] } = useQuery<EtapaSeleccion[]>({
    queryKey: ["/api/etapas-seleccion"],
  });

  // Cargar procesos de selección para mostrar vacantes vinculadas
  const { data: procesoSeleccion = [] } = useQuery<ProcesoSeleccion[]>({
    queryKey: ["/api/proceso-seleccion"],
  });

  // Cargar vacantes para mostrar títulos
  const { data: vacantes = [] } = useQuery<Vacante[]>({
    queryKey: ["/api/vacantes"],
  });

  const createCandidatoMutation = useMutation({
    mutationFn: async (data: InsertCandidato & { vacanteId?: string }) => {
      // Separar vacanteId del resto de los datos del candidato
      const { vacanteId, ...candidatoData } = data;
      
      // Si se va a vincular a una vacante, obtener la etapa inicial ANTES de crear el candidato
      let etapaInicialId: string | null = null;
      if (vacanteId && vacanteId !== "") {
        // Fetch etapas si aún no están cargadas
        let etapasActuales = etapas;
        if (etapasActuales.length === 0) {
          const etapasResponse = await apiRequest("GET", "/api/etapas-seleccion", {});
          etapasActuales = await etapasResponse.json();
        }

        const etapaInicial = etapasActuales.find(e => e.orden === 1);
        if (!etapaInicial) {
          throw new Error("No se encontró la etapa inicial de selección. Por favor contacta al administrador para inicializar las etapas.");
        }
        etapaInicialId = etapaInicial.id;
      }
      
      // Crear el candidato
      const candidatoResponse = await apiRequest("POST", "/api/candidatos", candidatoData);
      const candidato = await candidatoResponse.json();

      // Si se seleccionó una vacante, crear el procesoSeleccion
      if (vacanteId && vacanteId !== "" && etapaInicialId) {
        const procesoData: InsertProcesoSeleccion = {
          candidatoId: candidato.id,
          vacanteId: vacanteId,
          etapaActualId: etapaInicialId,
          estatus: "activo",
        };

        try {
          await apiRequest("POST", "/api/proceso-seleccion", procesoData);
        } catch (error: any) {
          // Nota: En caso de falla aquí, el candidato ya fue creado.
          // Para MVP esto es aceptable - el usuario puede vincular manualmente después.
          // Para producción, considerar endpoint backend que maneje ambas operaciones en transacción.
          
          // Informar al usuario que el candidato fue creado pero no vinculado
          toast({
            title: "Candidato creado con advertencia",
            description: "El candidato fue creado pero no se pudo vincular a la vacante. Puedes vincularlo manualmente desde la página de Vacantes.",
            variant: "default",
          });
          
          console.error("Error al crear proceso de selección:", error);
          // No re-lanzar el error para que la creación del candidato se considere exitosa
        }
      }

      return candidato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidatos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proceso-seleccion"] });
      setIsFormOpen(false);
      setEditingCandidato(null);
      toast({
        title: "Candidato creado",
        description: "El candidato ha sido registrado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCandidatoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCandidato> }) => {
      const response = await apiRequest("PATCH", `/api/candidatos/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidatos"] });
      setIsFormOpen(false);
      setEditingCandidato(null);
      toast({
        title: "Candidato actualizado",
        description: "Los cambios han sido guardados exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCandidatoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/candidatos/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidatos"] });
      toast({
        title: "Candidato eliminado",
        description: "El candidato ha sido eliminado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCandidatos = candidatos.filter((candidato) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      candidato.nombre.toLowerCase().includes(searchLower) ||
      candidato.apellidoPaterno.toLowerCase().includes(searchLower) ||
      candidato.apellidoMaterno?.toLowerCase().includes(searchLower) ||
      candidato.email.toLowerCase().includes(searchLower) ||
      candidato.telefono.toLowerCase().includes(searchLower) ||
      candidato.puestoDeseado?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "todos" || candidato.estatus === statusFilter;
    const matchesFuente = fuenteFilter === "todas" || candidato.fuente === fuenteFilter;

    return matchesSearch && matchesStatus && matchesFuente;
  });

  const handleFormSubmit = (data: InsertCandidato) => {
    if (editingCandidato) {
      updateCandidatoMutation.mutate({ id: editingCandidato.id, data });
    } else {
      createCandidatoMutation.mutate(data);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingCandidato(null);
    }
  };

  const handleEditCandidato = (candidato: Candidato) => {
    setEditingCandidato(candidato);
    setIsFormOpen(true);
  };

  const handleDeleteCandidato = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este candidato?")) {
      deleteCandidatoMutation.mutate(id);
    }
  };

  const handleChangeStatus = (id: string, newStatus: CandidatoEstatus) => {
    updateCandidatoMutation.mutate({
      id,
      data: { estatus: newStatus },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      activo: { variant: "default", label: "Activo" },
      contratado: { variant: "secondary", label: "Contratado" },
      descartado: { variant: "destructive", label: "Descartado" },
      inactivo: { variant: "secondary", label: "Inactivo" },
    };

    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const getFuenteBadge = (fuente: string) => {
    const labels: Record<string, string> = {
      linkedin: "LinkedIn",
      indeed: "Indeed",
      computrabajo: "Computrabajo",
      occmundial: "OCC Mundial",
      bumeran: "Bumeran",
      referido_empleado: "Referido",
      bolsa_universitaria: "Bolsa Universitaria",
      redes_sociales: "Redes Sociales",
      portal_empresa: "Portal Empresa",
      agencia_reclutamiento: "Agencia",
      feria_empleo: "Feria",
      aplicacion_directa: "Aplicación Directa",
      headhunter: "Headhunter",
      otro: "Otro",
    };

    return (
      <Badge variant="secondary" className="text-xs" data-testid={`badge-fuente-${fuente}`}>
        {labels[fuente] || fuente}
      </Badge>
    );
  };

  // Precalcular mapa de candidatoId → Vacante para evitar O(n²) en render
  const candidatoVacanteMap = useMemo(() => {
    const map = new Map<string, Vacante>();
    procesoSeleccion.forEach(proceso => {
      const vacante = vacantes.find(v => v.id === proceso.vacanteId);
      if (vacante) {
        map.set(proceso.candidatoId, vacante);
      }
    });
    return map;
  }, [procesoSeleccion, vacantes]);

  const getInitials = (nombre: string, apellidoPaterno: string) => {
    return `${nombre.charAt(0)}${apellidoPaterno.charAt(0)}`.toUpperCase();
  };

  const getNombreCompleto = (candidato: Candidato) => {
    return `${candidato.nombre} ${candidato.apellidoPaterno} ${candidato.apellidoMaterno || ""}`.trim();
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy", { locale: es });
  };

  const uniqueFuentes = Array.from(new Set(candidatos.map(c => c.fuente)));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-heading">
            Candidatos
          </h1>
          <p className="text-muted-foreground">
            Base de datos de candidatos y gestión de información
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          data-testid="button-create-candidato"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Candidato
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono, puesto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as CandidatoEstatus | "todos")}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="contratado">Contratados</SelectItem>
                <SelectItem value="descartado">Descartados</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={fuenteFilter}
              onValueChange={setFuenteFilter}
            >
              <SelectTrigger className="w-[200px]" data-testid="select-fuente-filter">
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las fuentes</SelectItem>
                {uniqueFuentes.map((fuente) => (
                  <SelectItem key={fuente} value={fuente}>
                    {fuente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Puesto Deseado</TableHead>
                  <TableHead>Vacante Vinculada</TableHead>
                  <TableHead>Experiencia</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Cargando candidatos...
                    </TableCell>
                  </TableRow>
                ) : filteredCandidatos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <UserPlus className="h-8 w-8 text-muted-foreground/50" />
                        <p>No se encontraron candidatos</p>
                        {search || statusFilter !== "todos" || fuenteFilter !== "todas" ? (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("todos");
                              setFuenteFilter("todas");
                            }}
                            data-testid="button-clear-filters"
                          >
                            Limpiar filtros
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidatos.map((candidato) => (
                    <TableRow key={candidato.id} data-testid={`row-candidato-${candidato.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar data-testid={`avatar-${candidato.id}`}>
                            <AvatarFallback>
                              {getInitials(candidato.nombre, candidato.apellidoPaterno)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium" data-testid={`text-nombre-${candidato.id}`}>
                              {getNombreCompleto(candidato)}
                            </div>
                            {candidato.referidoPor && (
                              <div className="text-xs text-muted-foreground">
                                Referido por: {candidato.referidoPor}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {candidato.puestoDeseado || (
                          <span className="text-muted-foreground">No especificado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(() => {
                          const vacante = candidatoVacanteMap.get(candidato.id);
                          return vacante ? (
                            <div data-testid={`text-vacante-${candidato.id}`}>
                              <div className="font-medium">{vacante.titulo}</div>
                              <div className="text-xs text-muted-foreground">{vacante.departamento}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Sin vacante</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {candidato.experienciaAnios !== null ? (
                          <span data-testid={`text-experiencia-${candidato.id}`}>
                            {candidato.experienciaAnios} {candidato.experienciaAnios === 1 ? "año" : "años"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Sin experiencia</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span data-testid={`text-email-${candidato.id}`}>{candidato.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span data-testid={`text-telefono-${candidato.id}`}>{candidato.telefono}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getFuenteBadge(candidato.fuente)}</TableCell>
                      <TableCell>{getStatusBadge(candidato.estatus ?? "activo")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(candidato.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-actions-${candidato.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditCandidato(candidato)}
                              data-testid={`button-edit-${candidato.id}`}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Cambiar Estatus
                            </DropdownMenuLabel>
                            {candidato.estatus !== "activo" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(candidato.id, "activo")}
                                data-testid={`button-status-activo-${candidato.id}`}
                              >
                                Marcar como Activo
                              </DropdownMenuItem>
                            )}
                            {candidato.estatus !== "contratado" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(candidato.id, "contratado")}
                                data-testid={`button-status-contratado-${candidato.id}`}
                              >
                                Marcar como Contratado
                              </DropdownMenuItem>
                            )}
                            {candidato.estatus !== "descartado" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(candidato.id, "descartado")}
                                data-testid={`button-status-descartado-${candidato.id}`}
                              >
                                Marcar como Descartado
                              </DropdownMenuItem>
                            )}
                            {candidato.estatus !== "inactivo" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(candidato.id, "inactivo")}
                                data-testid={`button-status-inactivo-${candidato.id}`}
                              >
                                Marcar como Inactivo
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteCandidato(candidato.id)}
                              data-testid={`button-delete-${candidato.id}`}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CandidatoForm
        candidato={editingCandidato}
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        isPending={createCandidatoMutation.isPending || updateCandidatoMutation.isPending}
      />
    </div>
  );
}
