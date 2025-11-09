import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Vacante } from "@shared/schema";

interface VacanteRequisitosDialogProps {
  vacante: Vacante | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VacanteRequisitosDialog({ vacante, open, onOpenChange }: VacanteRequisitosDialogProps) {
  if (!vacante) return null;

  const conocimientos = (vacante.conocimientosTecnicos as any[]) || [];
  const competencias = (vacante.competenciasConductuales as string[]) || [];
  const idiomas = (vacante.idiomas as any[]) || [];
  const certificaciones = (vacante.certificaciones as string[]) || [];
  const condiciones = (vacante.condicionesLaborales as any) || {};

  const getNivelBadgeVariant = (nivel: string): "default" | "secondary" | "outline" => {
    switch (nivel) {
      case "avanzado":
        return "default";
      case "intermedio":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-requisitos">
        <DialogHeader>
          <DialogTitle data-testid="text-requisitos-title">
            Requisitos de la Vacante
          </DialogTitle>
          <DialogDescription>
            {vacante.titulo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conocimientos Técnicos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conocimientos Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              {conocimientos.length > 0 ? (
                <div className="space-y-2">
                  {conocimientos.map((item: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      data-testid={`conocimiento-${index}`}
                    >
                      <span className="text-sm">{item.conocimiento}</span>
                      <Badge variant={getNivelBadgeVariant(item.nivel)} data-testid={`badge-nivel-${index}`}>
                        {item.nivel}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-no-conocimientos">
                  No se especificaron conocimientos técnicos
                </p>
              )}
            </CardContent>
          </Card>

          {/* Competencias Conductuales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Competencias Conductuales</CardTitle>
            </CardHeader>
            <CardContent>
              {competencias.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {competencias.map((competencia: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      data-testid={`competencia-${index}`}
                    >
                      {competencia}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-no-competencias">
                  No se especificaron competencias conductuales
                </p>
              )}
            </CardContent>
          </Card>

          {/* Idiomas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Idiomas</CardTitle>
            </CardHeader>
            <CardContent>
              {idiomas.length > 0 ? (
                <div className="space-y-2">
                  {idiomas.map((item: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      data-testid={`idioma-${index}`}
                    >
                      <span className="text-sm">{item.idioma}</span>
                      <Badge variant={getNivelBadgeVariant(item.nivel)} data-testid={`badge-idioma-nivel-${index}`}>
                        {item.nivel}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-no-idiomas">
                  No se especificaron idiomas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certificaciones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Certificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {certificaciones.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {certificaciones.map((cert: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      data-testid={`certificacion-${index}`}
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-no-certificaciones">
                  No se especificaron certificaciones
                </p>
              )}
            </CardContent>
          </Card>

          {/* Condiciones Laborales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Condiciones Laborales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {condiciones.tipoHorario && (
                  <div data-testid="condicion-tipo-horario">
                    <span className="text-sm font-medium">Tipo de Horario: </span>
                    <span className="text-sm text-muted-foreground capitalize">{condiciones.tipoHorario}</span>
                  </div>
                )}
                
                {condiciones.horaEntrada && condiciones.horaSalida && (
                  <div data-testid="condicion-horario">
                    <span className="text-sm font-medium">Horario: </span>
                    <span className="text-sm text-muted-foreground">
                      {condiciones.horaEntrada} - {condiciones.horaSalida}
                    </span>
                  </div>
                )}

                {condiciones.horasSemanales !== undefined && condiciones.horasSemanales !== null && (
                  <div data-testid="condicion-horas-semanales">
                    <span className="text-sm font-medium">Horas Semanales: </span>
                    <span className="text-sm text-muted-foreground">{condiciones.horasSemanales} hrs</span>
                  </div>
                )}

                {condiciones.tiempoComida !== undefined && condiciones.tiempoComida !== null && (
                  <div data-testid="condicion-tiempo-comida">
                    <span className="text-sm font-medium">Tiempo de Comida: </span>
                    <span className="text-sm text-muted-foreground">{condiciones.tiempoComida} hrs</span>
                  </div>
                )}

                {condiciones.horarioComidaInicio && condiciones.horarioComidaFin && (
                  <div data-testid="condicion-horario-comida">
                    <span className="text-sm font-medium">Horario de Comida: </span>
                    <span className="text-sm text-muted-foreground">
                      {condiciones.horarioComidaInicio} - {condiciones.horarioComidaFin}
                    </span>
                  </div>
                )}

                {condiciones.guardias && (
                  <div data-testid="condicion-guardias">
                    <span className="text-sm font-medium">Guardias/Disponibilidad: </span>
                    <span className="text-sm text-muted-foreground">{condiciones.guardias}</span>
                  </div>
                )}

                {condiciones.horasGuardias !== undefined && condiciones.horasGuardias !== null && (
                  <div data-testid="condicion-horas-guardias">
                    <span className="text-sm font-medium">Horas de Guardia (semanales): </span>
                    <span className="text-sm text-muted-foreground">{condiciones.horasGuardias} hrs</span>
                  </div>
                )}

                {condiciones.modalidad && (
                  <div data-testid="condicion-modalidad">
                    <span className="text-sm font-medium">Modalidad: </span>
                    <span className="text-sm text-muted-foreground">{condiciones.modalidad}</span>
                  </div>
                )}

                {condiciones.nivelEsfuerzoFisico && (
                  <div data-testid="condicion-esfuerzo-fisico">
                    <span className="text-sm font-medium">Nivel de Esfuerzo Físico: </span>
                    <span className="text-sm text-muted-foreground capitalize">{condiciones.nivelEsfuerzoFisico}</span>
                  </div>
                )}

                {condiciones.ambienteTrabajo && (
                  <div data-testid="condicion-ambiente-trabajo">
                    <span className="text-sm font-medium">Ambiente de Trabajo: </span>
                    <span className="text-sm text-muted-foreground">{condiciones.ambienteTrabajo}</span>
                  </div>
                )}

                {condiciones.descripcionHorario && (
                  <>
                    <Separator />
                    <div data-testid="condicion-descripcion-horario">
                      <span className="text-sm font-medium">Descripción del Horario: </span>
                      <p className="text-sm text-muted-foreground mt-1">{condiciones.descripcionHorario}</p>
                    </div>
                  </>
                )}

                {Object.keys(condiciones).length === 0 && (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-condiciones">
                    No se especificaron condiciones laborales
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Descripción y Responsabilidades */}
          {(vacante.descripcion || vacante.responsabilidades || vacante.requisitos || vacante.prestaciones) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vacante.descripcion && (
                  <div data-testid="info-descripcion">
                    <span className="text-sm font-medium">Descripción: </span>
                    <p className="text-sm text-muted-foreground mt-1">{vacante.descripcion}</p>
                  </div>
                )}

                {vacante.requisitos && (
                  <>
                    {vacante.descripcion && <Separator />}
                    <div data-testid="info-requisitos">
                      <span className="text-sm font-medium">Requisitos: </span>
                      <p className="text-sm text-muted-foreground mt-1">{vacante.requisitos}</p>
                    </div>
                  </>
                )}

                {vacante.responsabilidades && (
                  <>
                    {(vacante.descripcion || vacante.requisitos) && <Separator />}
                    <div data-testid="info-responsabilidades">
                      <span className="text-sm font-medium">Responsabilidades: </span>
                      <p className="text-sm text-muted-foreground mt-1">{vacante.responsabilidades}</p>
                    </div>
                  </>
                )}

                {vacante.prestaciones && (
                  <>
                    {(vacante.descripcion || vacante.requisitos || vacante.responsabilidades) && <Separator />}
                    <div data-testid="info-prestaciones">
                      <span className="text-sm font-medium">Prestaciones: </span>
                      <p className="text-sm text-muted-foreground mt-1">{vacante.prestaciones}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
