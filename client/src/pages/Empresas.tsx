import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, FileKey, Pencil, Trash2, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Empresa, RegistroPatronal, CredencialSistema } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmpresaForm from "@/components/EmpresaForm";
import RegistroPatronalManager from "@/components/RegistroPatronalManager";
import CredencialesManager from "@/components/CredencialesManager";
import { VacationSchemeSelector } from "@/components/VacationSchemeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Empresas() {
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: empresas = [], isLoading } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const deleteEmpresaMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/empresas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      toast({
        title: "Empresa eliminada",
        description: "La empresa ha sido eliminada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la empresa",
        variant: "destructive",
      });
    },
  });

  const handleEmpresaCreated = () => {
    setIsFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando empresas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las empresas, registros patronales y credenciales de sistemas gubernamentales
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-nueva-empresa">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Empresa</DialogTitle>
              <DialogDescription>
                Agrega una nueva empresa al sistema
              </DialogDescription>
            </DialogHeader>
            <EmpresaForm
              onSuccess={handleEmpresaCreated}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {empresas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay empresas registradas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comienza agregando tu primera empresa al sistema
            </p>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-crear-primera-empresa">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {empresas.map((empresa) => (
            <Card key={empresa.id} className="hover-elevate" data-testid={`card-empresa-${empresa.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {empresa.razonSocial}
                    </CardTitle>
                    {empresa.nombreComercial && (
                      <CardDescription className="mt-1 truncate">
                        {empresa.nombreComercial}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={empresa.estatus === 'activa' ? 'default' : 'secondary'}>
                    {empresa.estatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">RFC:</span>
                    <span className="font-mono">{empresa.rfc}</span>
                  </div>
                  {empresa.representanteLegal && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Rep. Legal:</span>
                      <span className="truncate">{empresa.representanteLegal}</span>
                    </div>
                  )}
                  {empresa.telefono && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Teléfono:</span>
                      <span>{empresa.telefono}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedEmpresa(empresa)}
                        data-testid={`button-ver-detalles-${empresa.id}`}
                      >
                        <FileKey className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{empresa.razonSocial}</DialogTitle>
                        <DialogDescription>
                          Gestiona registros patronales y credenciales de sistemas
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="registros" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="registros">Registros Patronales</TabsTrigger>
                          <TabsTrigger value="credenciales">Credenciales</TabsTrigger>
                          <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
                          <TabsTrigger value="info">Información</TabsTrigger>
                        </TabsList>
                        <TabsContent value="registros" className="mt-4">
                          <RegistroPatronalManager empresaId={empresa.id!} />
                        </TabsContent>
                        <TabsContent value="credenciales" className="mt-4">
                          <CredencialesManager empresaId={empresa.id!} />
                        </TabsContent>
                        <TabsContent value="vacaciones" className="mt-4">
                          <VacationSchemeSelector
                            entityType="empresa"
                            entityId={empresa.id!}
                            currentSchemeId={empresa.esquemaPrestacionesId}
                            entityName={empresa.razonSocial}
                          />
                        </TabsContent>
                        <TabsContent value="info" className="mt-4 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Información General</h4>
                              <dl className="space-y-2">
                                <div>
                                  <dt className="text-sm font-medium">Razón Social</dt>
                                  <dd className="text-sm text-muted-foreground">{empresa.razonSocial}</dd>
                                </div>
                                {empresa.nombreComercial && (
                                  <div>
                                    <dt className="text-sm font-medium">Nombre Comercial</dt>
                                    <dd className="text-sm text-muted-foreground">{empresa.nombreComercial}</dd>
                                  </div>
                                )}
                                <div>
                                  <dt className="text-sm font-medium">RFC</dt>
                                  <dd className="text-sm text-muted-foreground font-mono">{empresa.rfc}</dd>
                                </div>
                                {empresa.regimenFiscal && (
                                  <div>
                                    <dt className="text-sm font-medium">Régimen Fiscal</dt>
                                    <dd className="text-sm text-muted-foreground">{empresa.regimenFiscal}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Representante Legal</h4>
                              <dl className="space-y-2">
                                {empresa.representanteLegal && (
                                  <div>
                                    <dt className="text-sm font-medium">Nombre</dt>
                                    <dd className="text-sm text-muted-foreground">{empresa.representanteLegal}</dd>
                                  </div>
                                )}
                                {empresa.rfcRepresentante && (
                                  <div>
                                    <dt className="text-sm font-medium">RFC</dt>
                                    <dd className="text-sm text-muted-foreground font-mono">{empresa.rfcRepresentante}</dd>
                                  </div>
                                )}
                                {empresa.curpRepresentante && (
                                  <div>
                                    <dt className="text-sm font-medium">CURP</dt>
                                    <dd className="text-sm text-muted-foreground font-mono">{empresa.curpRepresentante}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </div>
                          {empresa.notas && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Notas</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{empresa.notas}</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-eliminar-${empresa.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente la empresa "{empresa.razonSocial}", 
                          sus registros patronales y credenciales asociadas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteEmpresaMutation.mutate(empresa.id!)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
