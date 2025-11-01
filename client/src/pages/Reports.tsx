import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export default function Reports() {
  const reports = [
    {
      id: 1,
      title: "Resumen de Nómina Mensual",
      description: "Resumen completo de la nómina del mes con totales y deducciones",
      type: "Nómina",
    },
    {
      id: 2,
      title: "Reporte de ISR",
      description: "Cálculo y detalle del Impuesto Sobre la Renta retenido",
      type: "Fiscal",
    },
    {
      id: 3,
      title: "Reporte IMSS",
      description: "Contribuciones al Seguro Social por empleado",
      type: "Fiscal",
    },
    {
      id: 4,
      title: "Censo de Empleados",
      description: "Listado completo de empleados activos e inactivos",
      type: "RRHH",
    },
    {
      id: 5,
      title: "Reporte de Asistencias",
      description: "Registro mensual de asistencias, faltas y retardos",
      type: "Asistencia",
    },
    {
      id: 6,
      title: "Vacaciones y Permisos",
      description: "Resumen de días de vacaciones utilizados y pendientes",
      type: "RRHH",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reportes</h1>
        <p className="text-muted-foreground mt-2">
          Genera reportes detallados para análisis y cumplimiento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.id} data-testid={`card-report-${report.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {report.description}
                  </p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {report.type}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`button-generate-report-${report.id}`}
                  onClick={() => console.log(`Generate report ${report.id}`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
