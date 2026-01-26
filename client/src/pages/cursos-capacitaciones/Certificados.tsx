import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Award,
  Download,
  Search,
  Eye,
  Calendar,
  User,
  GraduationCap,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCliente } from "@/contexts/ClienteContext";
import type { CertificadoCurso, Curso, Employee } from "@shared/schema";

interface CertificadoConDetalles extends CertificadoCurso {
  curso: Curso;
  empleado: Employee;
}

export default function Certificados() {
  const { clienteActual } = useCliente();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [cursoFilter, setCursoFilter] = useState<string>("todos");
  const [previewCertificado, setPreviewCertificado] = useState<CertificadoConDetalles | null>(null);

  const { data: certificados = [], isLoading } = useQuery<CertificadoConDetalles[]>({
    queryKey: ["/api/certificados-cursos", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  const { data: cursos = [] } = useQuery<Curso[]>({
    queryKey: ["/api/cursos", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  const regenerarMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiRequest("POST", `/api/certificados-cursos/${id}/regenerar`)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificados-cursos"] });
      toast({ title: "Certificado regenerado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredCertificados = certificados.filter((c) => {
    const matchesSearch =
      c.empleado?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.empleado?.apellidoPaterno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.curso?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigoVerificacion?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCurso = cursoFilter === "todos" || c.cursoId === cursoFilter;

    return matchesSearch && matchesCurso;
  });

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownload = (certificado: CertificadoConDetalles) => {
    // Generate a simple HTML certificate that can be printed/saved as PDF
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificado - ${certificado.curso?.nombre}</title>
        <style>
          @page { size: landscape; margin: 0; }
          body {
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            box-sizing: border-box;
          }
          .certificate {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
            text-align: center;
            max-width: 900px;
            margin: 0 auto;
            border: 8px solid #d4af37;
          }
          .header {
            border-bottom: 3px double #d4af37;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 42px;
            color: #1a365d;
            margin: 0;
            letter-spacing: 4px;
          }
          .subtitle {
            font-size: 18px;
            color: #666;
            margin-top: 10px;
          }
          .content {
            margin: 40px 0;
          }
          .certify-text {
            font-size: 16px;
            color: #555;
          }
          .recipient-name {
            font-size: 36px;
            color: #2c5282;
            font-weight: bold;
            margin: 20px 0;
            border-bottom: 2px solid #d4af37;
            display: inline-block;
            padding-bottom: 10px;
          }
          .course-name {
            font-size: 24px;
            color: #1a365d;
            margin: 20px 0;
            font-style: italic;
          }
          .details {
            margin: 30px 0;
            font-size: 14px;
            color: #666;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #ddd;
          }
          .signature-block {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 60px;
            padding-top: 10px;
          }
          .verification {
            font-size: 12px;
            color: #999;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <h1 class="title">CERTIFICADO</h1>
            <p class="subtitle">de Capacitación</p>
          </div>
          <div class="content">
            <p class="certify-text">Se certifica que</p>
            <p class="recipient-name">${certificado.empleado?.nombre} ${certificado.empleado?.apellidoPaterno} ${certificado.empleado?.apellidoMaterno || ""}</p>
            <p class="certify-text">ha completado satisfactoriamente el curso</p>
            <p class="course-name">"${certificado.curso?.nombre}"</p>
            <div class="details">
              <p>Duración: ${certificado.curso?.duracionEstimadaMinutos ? Math.round(certificado.curso.duracionEstimadaMinutos / 60) + " horas" : "N/A"}</p>
              ${certificado.calificacion ? `<p>Calificación obtenida: ${certificado.calificacion}%</p>` : ""}
              <p>Fecha de emisión: ${formatDate(certificado.fechaEmision)}</p>
              ${certificado.fechaVigencia ? `<p>Válido hasta: ${formatDate(certificado.fechaVigencia)}</p>` : ""}
            </div>
          </div>
          <div class="footer">
            <div class="signature-block">
              <div class="signature-line">Responsable de Capacitación</div>
            </div>
            <div class="signature-block">
              <div class="signature-line">Recursos Humanos</div>
            </div>
          </div>
          <div class="verification">
            Código de verificación: ${certificado.codigoVerificacion}<br/>
            Este certificado puede ser verificado en el sistema de gestión de capacitación
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([certificateHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `certificado_${certificado.empleado?.numeroEmpleado}_${certificado.curso?.codigo}.html`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Certificado descargado",
      description: "Abre el archivo HTML en tu navegador e imprime como PDF",
    });
  };

  const stats = {
    total: certificados.length,
    vigentes: certificados.filter((c) => !c.fechaVigencia || new Date(c.fechaVigencia) > new Date()).length,
    vencidos: certificados.filter((c) => c.fechaVigencia && new Date(c.fechaVigencia) <= new Date()).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            Certificados
          </h1>
          <p className="text-muted-foreground">
            Gestiona los certificados de capacitación emitidos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total emitidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.vigentes}</p>
                <p className="text-sm text-muted-foreground">Vigentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.vencidos}</p>
                <p className="text-sm text-muted-foreground">Por renovar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado, curso o código de verificación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={cursoFilter} onValueChange={setCursoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cursos</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredCertificados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay certificados que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredCertificados.map((certificado) => {
                  const isExpired =
                    certificado.fechaVigencia && new Date(certificado.fechaVigencia) <= new Date();
                  return (
                    <TableRow key={certificado.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {certificado.empleado?.nombre} {certificado.empleado?.apellidoPaterno}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {certificado.empleado?.numeroEmpleado}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{certificado.curso?.nombre}</p>
                        <p className="text-sm text-muted-foreground">{certificado.curso?.codigo}</p>
                      </TableCell>
                      <TableCell>{formatDate(certificado.fechaEmision)}</TableCell>
                      <TableCell>
                        {certificado.fechaVigencia ? (
                          <Badge variant={isExpired ? "destructive" : "secondary"}>
                            {isExpired ? "Vencido" : formatDate(certificado.fechaVigencia)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Sin vencimiento</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {certificado.calificacion ? `${certificado.calificacion}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {certificado.codigoVerificacion}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewCertificado(certificado)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(certificado)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Certificate Preview Dialog */}
      <Dialog open={!!previewCertificado} onOpenChange={() => setPreviewCertificado(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista previa del certificado</DialogTitle>
          </DialogHeader>
          {previewCertificado && (
            <div className="border rounded-lg p-8 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-center space-y-4">
                <div className="border-b-2 border-yellow-500 pb-4">
                  <h2 className="text-3xl font-bold text-blue-900">CERTIFICADO</h2>
                  <p className="text-muted-foreground">de Capacitación</p>
                </div>
                <div className="py-6">
                  <p className="text-sm text-muted-foreground">Se certifica que</p>
                  <p className="text-2xl font-bold text-blue-800 border-b border-yellow-500 inline-block pb-2 mt-2">
                    {previewCertificado.empleado?.nombre} {previewCertificado.empleado?.apellidoPaterno}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    ha completado satisfactoriamente el curso
                  </p>
                  <p className="text-xl font-semibold text-blue-900 italic mt-2">
                    "{previewCertificado.curso?.nombre}"
                  </p>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Fecha de emisión: {formatDate(previewCertificado.fechaEmision)}</p>
                  {previewCertificado.calificacion && (
                    <p>Calificación: {previewCertificado.calificacion}%</p>
                  )}
                  {previewCertificado.fechaVigencia && (
                    <p>Válido hasta: {formatDate(previewCertificado.fechaVigencia)}</p>
                  )}
                </div>
                <div className="pt-4 text-xs text-muted-foreground">
                  Código: {previewCertificado.codigoVerificacion}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewCertificado(null)}>
              Cerrar
            </Button>
            <Button onClick={() => previewCertificado && handleDownload(previewCertificado)}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
