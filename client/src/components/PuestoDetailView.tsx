import { X, ArrowLeft, Briefcase, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Puesto, Employee } from "@shared/schema";

interface PuestoDetailViewProps {
  puesto: Puesto;
  onBackToQuickView: () => void;
  onClose: () => void;
}

function FieldDisplay({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "") {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-sm text-muted-foreground italic">No registrado</p>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-sm">{value ? "Sí" : "No"}</p>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-sm">
          {new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
          }).format(value)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function ListDisplay({ label, items }: { label: string; items: string[] | undefined }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        <p className="text-sm text-muted-foreground italic">No registrado</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PuestoDetailView({
  puesto,
  onBackToQuickView,
  onClose,
}: PuestoDetailViewProps) {
  const compensacion = puesto.compensacionYPrestaciones as any;
  const condiciones = puesto.condicionesLaborales as any;
  const formacion = puesto.formacionAcademica as any;
  const experiencia = puesto.experienciaLaboral as any;
  const cumplimiento = puesto.cumplimientoLegal as any;
  const relaciones = puesto.relaciones as any[];
  const idiomas = puesto.idiomas as any[];
  const indicadores = puesto.indicadoresDesempeno as any[];
  const funcionesPrincipales = puesto.funcionesPrincipales as string[];
  const funcionesSecundarias = puesto.funcionesSecundarias as string[];
  const conocimientos = puesto.conocimientosTecnicos as any[]; // Puede ser array de strings (legacy) o array de objetos (nuevo)
  const competencias = puesto.competenciasConductuales as string[];
  const certificaciones = puesto.certificaciones as string[];

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/puestos", puesto.id, "employees"],
  });

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{puesto.nombrePuesto}</h1>
              <p className="text-muted-foreground">
                {puesto.clavePuesto} | {puesto.area || "Sin área"} | {puesto.departamento || "Sin departamento"}
              </p>
              <Badge variant={puesto.estatus === "activo" ? "default" : "secondary"} className="mt-2">
                {puesto.estatus === "activo" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onBackToQuickView}
              data-testid="button-back-to-quick-view"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Resumen
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-detail-view"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="general" data-testid="tab-general">
              General
            </TabsTrigger>
            <TabsTrigger value="jerarquia" data-testid="tab-jerarquia">
              Jerarquía
            </TabsTrigger>
            <TabsTrigger value="funciones" data-testid="tab-funciones">
              Funciones
            </TabsTrigger>
            <TabsTrigger value="requisitos" data-testid="tab-requisitos">
              Requisitos
            </TabsTrigger>
            <TabsTrigger value="compensacion" data-testid="tab-compensacion">
              Compensación
            </TabsTrigger>
            <TabsTrigger value="condiciones" data-testid="tab-condiciones">
              Condiciones
            </TabsTrigger>
            <TabsTrigger value="legal" data-testid="tab-legal">
              Legal
            </TabsTrigger>
            <TabsTrigger value="empleados" data-testid="tab-empleados">
              Empleados
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Información General */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identificación</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FieldDisplay label="Clave del Puesto" value={puesto.clavePuesto} />
                <FieldDisplay label="Nombre del Puesto" value={puesto.nombrePuesto} />
                <FieldDisplay label="Área" value={puesto.area} />
                <FieldDisplay label="Departamento" value={puesto.departamento} />
                <FieldDisplay label="Ubicación" value={puesto.ubicacion} />
                <FieldDisplay label="Nivel Jerárquico" value={puesto.nivelJerarquico} />
                <FieldDisplay label="Tipo de Puesto" value={puesto.tipoPuesto} />
                <FieldDisplay label="Estatus" value={puesto.estatus === "activo" ? "Activo" : "Inactivo"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Propósito General del Puesto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{puesto.propositoGeneral || "No especificado"}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Jerarquía y Relaciones */}
          <TabsContent value="jerarquia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Jerarquía Organizacional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldDisplay label="Reporta a (Puesto Superior)" value={puesto.reportaA || "Sin reporte directo"} />
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Puestos que reportan a este</p>
                  {(puesto.puestosQueReportan as string[])?.length > 0 ? (
                    <Badge variant="secondary">{(puesto.puestosQueReportan as string[]).length} puestos subordinados</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin subordinados directos</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autoridad y Decisiones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{puesto.autoridadYDecisiones || "No especificado"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relaciones Internas y Externas</CardTitle>
              </CardHeader>
              <CardContent>
                {relaciones && relaciones.length > 0 ? (
                  <div className="space-y-4">
                    {relaciones.map((rel, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Tipo</p>
                            <p className="text-sm">{rel.tipo}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Con quién</p>
                            <p className="text-sm">{rel.conQuien}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Propósito</p>
                            <p className="text-sm">{rel.proposito}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No se han registrado relaciones</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Funciones y Responsabilidades */}
          <TabsContent value="funciones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Funciones Principales</CardTitle>
              </CardHeader>
              <CardContent>
                <ListDisplay label="" items={funcionesPrincipales} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funciones Secundarias</CardTitle>
              </CardHeader>
              <CardContent>
                <ListDisplay label="" items={funcionesSecundarias} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Desempeño</CardTitle>
              </CardHeader>
              <CardContent>
                {indicadores && indicadores.length > 0 ? (
                  <div className="space-y-3">
                    {indicadores.map((ind, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="text-sm font-medium">{ind.indicador}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Meta sugerida: {ind.metaSugerida}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No se han definido indicadores</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Requisitos y Competencias */}
          <TabsContent value="requisitos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formación Académica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldDisplay label="Requerida" value={formacion?.requerida} />
                <Separator />
                <FieldDisplay label="Deseable" value={formacion?.deseable} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experiencia Laboral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldDisplay label="Requerida" value={experiencia?.requerida} />
                <Separator />
                <FieldDisplay label="Deseable" value={experiencia?.deseable} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conocimientos Técnicos</CardTitle>
              </CardHeader>
              <CardContent>
                {conocimientos && conocimientos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {conocimientos.map((conocimiento, idx) => {
                      // Manejar tanto formato antiguo (string) como nuevo (objeto)
                      const nombre = typeof conocimiento === 'string' ? conocimiento : conocimiento?.conocimiento;
                      const nivel = typeof conocimiento === 'string' ? 'básico' : conocimiento?.nivel;
                      return (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="text-sm font-medium">{nombre}</p>
                          <p className="text-sm text-muted-foreground">Nivel: {nivel}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No se requieren conocimientos técnicos específicos</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competencias Conductuales</CardTitle>
              </CardHeader>
              <CardContent>
                <ListDisplay label="" items={competencias} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Idiomas</CardTitle>
              </CardHeader>
              <CardContent>
                {idiomas && idiomas.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {idiomas.map((idioma, idx) => {
                      // Manejar tanto formato antiguo (string) como nuevo (objeto)
                      const nombre = typeof idioma === 'string' ? idioma : idioma?.idioma;
                      const nivel = typeof idioma === 'string' ? 'básico' : idioma?.nivel;
                      return (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="text-sm font-medium">{nombre}</p>
                          <p className="text-sm text-muted-foreground">Nivel: {nivel}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No se requieren idiomas adicionales</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ListDisplay label="" items={certificaciones} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Compensación y Prestaciones */}
          <TabsContent value="compensacion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rango Salarial</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FieldDisplay label="Salario Mínimo" value={compensacion?.rangoSalarialMin} />
                <FieldDisplay label="Salario Máximo" value={compensacion?.rangoSalarialMax} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldDisplay label="Tipo de Pago" value={compensacion?.tipoPago} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prestaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ListDisplay label="" items={compensacion?.prestaciones} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: Condiciones Laborales */}
          <TabsContent value="condiciones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Condiciones del Puesto</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FieldDisplay label="Horario" value={condiciones?.horario} />
                <FieldDisplay label="Guardias" value={condiciones?.guardias} />
                <FieldDisplay label="Modalidad de Trabajo" value={condiciones?.modalidad} />
                <FieldDisplay label="Requiere Viajes" value={condiciones?.requiereViaje} />
                <FieldDisplay label="Nivel de Esfuerzo Físico" value={condiciones?.nivelEsfuerzoFisico} />
                <FieldDisplay label="Ambiente de Trabajo" value={condiciones?.ambienteTrabajo} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 7: Cumplimiento Legal */}
          <TabsContent value="legal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cumplimiento y Seguridad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldDisplay label="Nivel de Riesgo" value={cumplimiento?.nivelRiesgo} />
                <Separator />
                <FieldDisplay label="Equipo de Protección Personal" value={cumplimiento?.equipoProteccion} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>NOMs Aplicables</CardTitle>
              </CardHeader>
              <CardContent>
                <ListDisplay label="" items={cumplimiento?.nomsAplicables} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 8: Empleados en este Puesto */}
          <TabsContent value="empleados" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <CardTitle>Empleados Activos en este Puesto</CardTitle>
                <Badge variant="secondary" data-testid="badge-employees-count">
                  {employees.length} {employees.length === 1 ? "empleado" : "empleados"}
                </Badge>
              </CardHeader>
              <CardContent>
                {isLoadingEmployees ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Cargando empleados...</p>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No hay empleados asignados a este puesto actualmente
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead data-testid="header-employee-name">Nombre</TableHead>
                        <TableHead data-testid="header-employee-number">No. Empleado</TableHead>
                        <TableHead data-testid="header-employee-department">Departamento</TableHead>
                        <TableHead data-testid="header-employee-status">Estatus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                          <TableCell data-testid={`cell-employee-name-${employee.id}`}>
                            {employee.nombre} {employee.apellidoPaterno} {employee.apellidoMaterno}
                          </TableCell>
                          <TableCell data-testid={`cell-employee-number-${employee.id}`}>
                            {employee.numeroEmpleado}
                          </TableCell>
                          <TableCell data-testid={`cell-employee-department-${employee.id}`}>
                            {employee.departamento || "No especificado"}
                          </TableCell>
                          <TableCell data-testid={`cell-employee-status-${employee.id}`}>
                            <Badge
                              variant={employee.estatus === "activo" ? "default" : "secondary"}
                              data-testid={`badge-employee-status-${employee.id}`}
                            >
                              {employee.estatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
