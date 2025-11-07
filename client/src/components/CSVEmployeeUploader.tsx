import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CSVRow {
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  email: string;
  telefono: string;
  departamento: string;
  puesto: string;
  salarioBrutoMensual: string;
  fechaIngreso: string;
  rfc?: string;
  curp?: string;
  nss?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface CSVEmployeeUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVEmployeeUploader({ open, onOpenChange }: CSVEmployeeUploaderProps) {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateRow = (row: CSVRow, index: number): ValidationError[] => {
    const rowErrors: ValidationError[] = [];
    const rowNum = index + 2;

    if (!row.numeroEmpleado?.trim()) {
      rowErrors.push({ row: rowNum, field: "numeroEmpleado", message: "Número de empleado requerido" });
    }
    if (!row.nombre?.trim()) {
      rowErrors.push({ row: rowNum, field: "nombre", message: "Nombre requerido" });
    }
    if (!row.apellidoPaterno?.trim()) {
      rowErrors.push({ row: rowNum, field: "apellidoPaterno", message: "Apellido paterno requerido" });
    }
    if (!row.email?.trim()) {
      rowErrors.push({ row: rowNum, field: "email", message: "Email requerido" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      rowErrors.push({ row: rowNum, field: "email", message: "Email inválido" });
    }
    if (!row.telefono?.trim()) {
      rowErrors.push({ row: rowNum, field: "telefono", message: "Teléfono requerido" });
    }
    if (!row.departamento?.trim()) {
      rowErrors.push({ row: rowNum, field: "departamento", message: "Departamento requerido" });
    }
    if (!row.puesto?.trim()) {
      rowErrors.push({ row: rowNum, field: "puesto", message: "Puesto requerido" });
    }
    if (!row.salarioBrutoMensual?.trim()) {
      rowErrors.push({ row: rowNum, field: "salarioBrutoMensual", message: "Salario requerido" });
    } else if (isNaN(parseFloat(row.salarioBrutoMensual))) {
      rowErrors.push({ row: rowNum, field: "salarioBrutoMensual", message: "Salario debe ser un número" });
    }
    if (!row.fechaIngreso?.trim()) {
      rowErrors.push({ row: rowNum, field: "fechaIngreso", message: "Fecha de ingreso requerida" });
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.fechaIngreso)) {
      rowErrors.push({ row: rowNum, field: "fechaIngreso", message: "Fecha debe estar en formato YYYY-MM-DD" });
    }

    return rowErrors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const headerMap: Record<string, string> = {
          'numero_empleado': 'numeroEmpleado',
          'numero empleado': 'numeroEmpleado',
          'apellido_paterno': 'apellidoPaterno',
          'apellido paterno': 'apellidoPaterno',
          'apellido_materno': 'apellidoMaterno',
          'apellido materno': 'apellidoMaterno',
          'salario_bruto_mensual': 'salarioBrutoMensual',
          'salario bruto mensual': 'salarioBrutoMensual',
          'salario': 'salarioBrutoMensual',
          'fecha_ingreso': 'fechaIngreso',
          'fecha de ingreso': 'fechaIngreso',
          'telefono': 'telefono',
          'teléfono': 'telefono',
          'correo': 'email',
        };

        const normalized = header.toLowerCase().trim();
        return headerMap[normalized] || header;
      },
      complete: (results) => {
        const data = results.data as CSVRow[];
        
        const allErrors: ValidationError[] = [];
        data.forEach((row, index) => {
          const rowErrors = validateRow(row, index);
          allErrors.push(...rowErrors);
        });

        setCsvData(data);
        setErrors(allErrors);

        if (allErrors.length === 0) {
          toast({
            title: "CSV validado",
            description: `${data.length} empleado(s) listos para importar`,
          });
        } else {
          toast({
            title: "Errores de validación",
            description: `Se encontraron ${allErrors.length} error(es). Revisa los detalles.`,
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        toast({
          title: "Error al leer archivo",
          description: error.message,
          variant: "destructive",
        });
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const bulkCreateMutation = useMutation({
    mutationFn: async (employees: CSVRow[]) => {
      const transformedEmployees = employees.map((emp) => {
        return {
          numeroEmpleado: emp.numeroEmpleado.trim(),
          nombre: emp.nombre.trim(),
          apellidoPaterno: emp.apellidoPaterno.trim(),
          apellidoMaterno: emp.apellidoMaterno?.trim() || null,
          email: emp.email.trim(),
          telefono: emp.telefono.trim(),
          departamento: emp.departamento.trim(),
          puesto: emp.puesto.trim(),
          salarioBrutoMensual: emp.salarioBrutoMensual.trim(),
          fechaIngreso: emp.fechaIngreso.trim(),
          rfc: emp.rfc?.trim() || null,
          curp: emp.curp?.trim() || null,
          nss: emp.nss?.trim() || null,
          estatus: "activo",
        };
      });

      const response = await apiRequest("POST", "/api/employees/bulk", transformedEmployees);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Empleados importados",
        description: `Se importaron ${data.created} empleado(s) exitosamente`,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error al importar",
        description: error.message || "Error al importar empleados",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (errors.length > 0) {
      toast({
        title: "No se puede importar",
        description: "Corrige los errores antes de importar",
        variant: "destructive",
      });
      return;
    }

    bulkCreateMutation.mutate(csvData);
  };

  const handleClose = () => {
    setCsvData([]);
    setErrors([]);
    setFileName("");
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = [
      "numeroEmpleado,nombre,apellidoPaterno,apellidoMaterno,email,telefono,departamento,puesto,salarioBrutoMensual,fechaIngreso,rfc,curp,nss",
      "EMP001,Juan,Pérez,Martínez,juan.perez@example.com,5512345678,Ventas,Gerente,25000,2024-01-15,PEXJ900215AB1,PEXJ900215HDFRNS01,12345678901",
      "EMP002,María,García,López,maria.garcia@example.com,5598765432,IT,Desarrollador,30000,2024-02-01,GACM850101CD2,GACM850101MDFRNS02,98765432109",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_empleados.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const getErrorsForRow = (rowIndex: number) => {
    return errors.filter(e => e.row === rowIndex + 2);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Empleados desde CSV</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con la información de los empleados. Asegúrate de que el formato sea correcto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
              data-testid="input-csv-file"
            />
            <label htmlFor="csv-upload">
              <Button asChild variant="outline" data-testid="button-select-csv">
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar CSV
                </span>
              </Button>
            </label>

            <Button
              variant="ghost"
              onClick={downloadTemplate}
              data-testid="button-download-template"
            >
              <FileText className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>

            {fileName && (
              <Badge variant="secondary" className="gap-2">
                <FileText className="h-3 w-3" />
                {fileName}
              </Badge>
            )}
          </div>

          {csvData.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Formato del CSV:</strong> El archivo debe contener las siguientes columnas mínimas:
                numeroEmpleado, nombre, apellidoPaterno, email, telefono, departamento, puesto, salarioBrutoMensual, fechaIngreso.
                <br />
                Opcionales: apellidoMaterno, rfc, curp, nss.
              </AlertDescription>
            </Alert>
          )}

          {csvData.length > 0 && (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {errors.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {csvData.length} fila(s) detectadas
                  </span>
                </div>
                {errors.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {errors.length} error(es) de validación encontrados
                  </p>
                )}
              </div>
              {errors.length === 0 && (
                <Button
                  onClick={handleImport}
                  disabled={bulkCreateMutation.isPending}
                  data-testid="button-import-csv"
                >
                  {bulkCreateMutation.isPending ? "Importando..." : "Importar Empleados"}
                </Button>
              )}
            </div>
          )}

          {csvData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Num. Emp</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Puesto</TableHead>
                      <TableHead>Salario</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((row, index) => {
                      const rowErrors = getErrorsForRow(index);
                      const hasErrors = rowErrors.length > 0;
                      
                      return (
                        <TableRow
                          key={index}
                          className={hasErrors ? "bg-destructive/10" : ""}
                          data-testid={`row-csv-${index}`}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.numeroEmpleado}</TableCell>
                          <TableCell>{row.nombre} {row.apellidoPaterno}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.departamento}</TableCell>
                          <TableCell>{row.puesto}</TableCell>
                          <TableCell>${row.salarioBrutoMensual}</TableCell>
                          <TableCell>
                            {hasErrors ? (
                              <div className="flex items-center gap-2">
                                <X className="h-4 w-4 text-destructive" />
                                <span className="text-xs text-destructive">
                                  {rowErrors.length} error(es)
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-xs text-muted-foreground">Válido</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Detalles de errores:</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {errors.map((error, index) => (
                  <Alert key={index} variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">
                      <strong>Fila {error.row}</strong> - {error.field}: {error.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
