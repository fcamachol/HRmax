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
import { useCliente } from "@/contexts/ClienteContext";

interface CSVRow {
  // Campos requeridos
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  telefono: string;
  email: string;
  puesto: string;
  departamento: string;
  salarioBrutoMensual: string;
  fechaIngreso: string;
  empresa: string; // Nombre de la empresa (se resuelve a empresaId en el backend)
  
  // Campos opcionales - Información personal
  apellidoMaterno?: string;
  genero?: string;
  fechaNacimiento?: string;
  curp?: string;
  rfc?: string;
  nss?: string;
  estadoCivil?: string;
  
  // Campos opcionales - Dirección
  calle?: string;
  numeroExterior?: string;
  numeroInterior?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  codigoPostal?: string;
  
  // Campos opcionales - Contacto adicional
  correo?: string;
  contactoEmergencia?: string;
  parentescoEmergencia?: string;
  telefonoEmergencia?: string;
  
  // Campos opcionales - Información bancaria
  banco?: string;
  clabe?: string;
  sucursal?: string;
  cuenta?: string;
  formaPago?: string;
  periodicidadPago?: string;
  
  // Campos opcionales - Contrato
  tipoCalculoSalario?: string;
  tipoContrato?: string;
  fechaAltaImss?: string;
  fechaTerminacion?: string;
  reconoceAntiguedad?: string;
  fechaAntiguedad?: string;
  
  // Campos opcionales - Trabajo
  modalidadTrabajo?: string;
  lugarTrabajo?: string;
  funciones?: string;
  diasLaborales?: string;
  horario?: string;
  tipoJornada?: string;
  tiempoParaAlimentos?: string;
  diasDescanso?: string;
  
  // Campos opcionales - Salario y prestaciones
  esquemaPago?: string;
  salarioDiarioReal?: string;
  salarioDiarioNominal?: string;
  salarioDiarioExento?: string;
  sbc?: string;
  sdi?: string;
  tablaImss?: string;
  
  // Campos opcionales - Vacaciones y aguinaldo
  diasVacacionesAnuales?: string;
  diasVacacionesDisponibles?: string;
  diasVacacionesUsados?: string;
  diasAguinaldoAdicionales?: string;
  diasVacacionesAdicionales?: string;
  
  // Campos opcionales - Créditos
  creditoInfonavit?: string;
  numeroFonacot?: string;
  
  // Campos opcionales - Estado y organización
  estatus?: string;
  clienteProyecto?: string;
  observacionesInternas?: string;
  timezone?: string;
  jefeDirectoId?: string;
  registroPatronalId?: string;
  documentoContratoId?: string;
  puestoId?: string;
  
  // Campos opcionales - Otros
  esquemaContratacion?: string;
  lugarNacimiento?: string;
  entidadNacimiento?: string;
  nacionalidad?: string;
  escolaridad?: string;
  periodoPrueba?: string;
  duracionPrueba?: string;
  diaPago?: string;
  driveId?: string;
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
  const { selectedCliente } = useCliente();

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
    if (!row.empresa?.trim()) {
      rowErrors.push({ row: rowNum, field: "empresa", message: "Empresa requerida (nombre comercial o razón social)" });
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
          // Campos principales
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
          'fecha_nacimiento': 'fechaNacimiento',
          'fecha nacimiento': 'fechaNacimiento',
          'fecha de nacimiento': 'fechaNacimiento',
          'telefono': 'telefono',
          'teléfono': 'telefono',
          'correo': 'email',
          'estado_civil': 'estadoCivil',
          'estado civil': 'estadoCivil',
          
          // Empresa (nombre, no ID)
          'nombre_empresa': 'empresa',
          'nombre empresa': 'empresa',
          'razon_social': 'empresa',
          'razón social': 'empresa',
          'razon social': 'empresa',
          
          // Dirección
          'numero_exterior': 'numeroExterior',
          'numero exterior': 'numeroExterior',
          'numero_interior': 'numeroInterior',
          'numero interior': 'numeroInterior',
          'codigo_postal': 'codigoPostal',
          'código postal': 'codigoPostal',
          'codigo postal': 'codigoPostal',
          
          // Contacto emergencia
          'contacto_emergencia': 'contactoEmergencia',
          'contacto emergencia': 'contactoEmergencia',
          'parentesco_emergencia': 'parentescoEmergencia',
          'parentesco emergencia': 'parentescoEmergencia',
          'telefono_emergencia': 'telefonoEmergencia',
          'teléfono emergencia': 'telefonoEmergencia',
          
          // Banco
          'forma_pago': 'formaPago',
          'forma pago': 'formaPago',
          'periodicidad_pago': 'periodicidadPago',
          'periodicidad pago': 'periodicidadPago',
          
          // Contrato
          'tipo_calculo_salario': 'tipoCalculoSalario',
          'tipo calculo salario': 'tipoCalculoSalario',
          'tipo_contrato': 'tipoContrato',
          'tipo contrato': 'tipoContrato',
          'fecha_alta_imss': 'fechaAltaImss',
          'fecha alta imss': 'fechaAltaImss',
          'fecha_terminacion': 'fechaTerminacion',
          'fecha terminacion': 'fechaTerminacion',
          'fecha terminación': 'fechaTerminacion',
          'reconoce_antiguedad': 'reconoceAntiguedad',
          'reconoce antiguedad': 'reconoceAntiguedad',
          'reconoce antigüedad': 'reconoceAntiguedad',
          'fecha_antiguedad': 'fechaAntiguedad',
          'fecha antiguedad': 'fechaAntiguedad',
          'fecha antigüedad': 'fechaAntiguedad',
          
          // Trabajo
          'modalidad_trabajo': 'modalidadTrabajo',
          'modalidad trabajo': 'modalidadTrabajo',
          'lugar_trabajo': 'lugarTrabajo',
          'lugar trabajo': 'lugarTrabajo',
          'dias_laborales': 'diasLaborales',
          'días laborales': 'diasLaborales',
          'dias laborales': 'diasLaborales',
          'tipo_jornada': 'tipoJornada',
          'tipo jornada': 'tipoJornada',
          'tiempo_para_alimentos': 'tiempoParaAlimentos',
          'tiempo para alimentos': 'tiempoParaAlimentos',
          'dias_descanso': 'diasDescanso',
          'días descanso': 'diasDescanso',
          'dias descanso': 'diasDescanso',
          
          // Salario
          'esquema_pago': 'esquemaPago',
          'esquema pago': 'esquemaPago',
          'salario_diario_real': 'salarioDiarioReal',
          'salario diario real': 'salarioDiarioReal',
          'salario_diario_nominal': 'salarioDiarioNominal',
          'salario diario nominal': 'salarioDiarioNominal',
          'salario_diario_exento': 'salarioDiarioExento',
          'salario diario exento': 'salarioDiarioExento',
          'tabla_imss': 'tablaImss',
          'tabla imss': 'tablaImss',
          
          // Vacaciones
          'dias_vacaciones_anuales': 'diasVacacionesAnuales',
          'días vacaciones anuales': 'diasVacacionesAnuales',
          'dias vacaciones anuales': 'diasVacacionesAnuales',
          'dias_vacaciones_disponibles': 'diasVacacionesDisponibles',
          'días vacaciones disponibles': 'diasVacacionesDisponibles',
          'dias vacaciones disponibles': 'diasVacacionesDisponibles',
          'dias_vacaciones_usados': 'diasVacacionesUsados',
          'días vacaciones usados': 'diasVacacionesUsados',
          'dias vacaciones usados': 'diasVacacionesUsados',
          'dias_aguinaldo_adicionales': 'diasAguinaldoAdicionales',
          'días aguinaldo adicionales': 'diasAguinaldoAdicionales',
          'dias aguinaldo adicionales': 'diasAguinaldoAdicionales',
          'dias_vacaciones_adicionales': 'diasVacacionesAdicionales',
          'días vacaciones adicionales': 'diasVacacionesAdicionales',
          'dias vacaciones adicionales': 'diasVacacionesAdicionales',
          
          // Créditos
          'credito_infonavit': 'creditoInfonavit',
          'crédito infonavit': 'creditoInfonavit',
          'credito infonavit': 'creditoInfonavit',
          'numero_fonacot': 'numeroFonacot',
          'número fonacot': 'numeroFonacot',
          'numero fonacot': 'numeroFonacot',
          
          // Organización
          'cliente_proyecto': 'clienteProyecto',
          'cliente proyecto': 'clienteProyecto',
          'observaciones_internas': 'observacionesInternas',
          'observaciones internas': 'observacionesInternas',
          'jefe_directo_id': 'jefeDirectoId',
          'jefe directo id': 'jefeDirectoId',
          'registro_patronal_id': 'registroPatronalId',
          'registro patronal id': 'registroPatronalId',
          'documento_contrato_id': 'documentoContratoId',
          'documento contrato id': 'documentoContratoId',
          'puesto_id': 'puestoId',
          'puesto id': 'puestoId',
          
          // Otros
          'esquema_contratacion': 'esquemaContratacion',
          'esquema contratación': 'esquemaContratacion',
          'esquema contratacion': 'esquemaContratacion',
          'lugar_nacimiento': 'lugarNacimiento',
          'lugar nacimiento': 'lugarNacimiento',
          'entidad_nacimiento': 'entidadNacimiento',
          'entidad nacimiento': 'entidadNacimiento',
          'periodo_prueba': 'periodoPrueba',
          'periodo prueba': 'periodoPrueba',
          'duracion_prueba': 'duracionPrueba',
          'duración prueba': 'duracionPrueba',
          'duracion prueba': 'duracionPrueba',
          'dia_pago': 'diaPago',
          'día pago': 'diaPago',
          'dia pago': 'diaPago',
          'drive_id': 'driveId',
          'drive id': 'driveId',
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
        const employeeData: any = {
          // Campos requeridos
          numeroEmpleado: emp.numeroEmpleado.trim(),
          nombre: emp.nombre.trim(),
          apellidoPaterno: emp.apellidoPaterno.trim(),
          email: emp.email.trim(),
          telefono: emp.telefono.trim(),
          departamento: emp.departamento.trim(),
          puesto: emp.puesto.trim(),
          salarioBrutoMensual: emp.salarioBrutoMensual.trim(),
          fechaIngreso: emp.fechaIngreso.trim(),
        };

        // Agregar todos los campos opcionales si están presentes
        if (emp.apellidoMaterno) employeeData.apellidoMaterno = emp.apellidoMaterno.trim();
        if (emp.genero) employeeData.genero = emp.genero.trim();
        if (emp.fechaNacimiento) employeeData.fechaNacimiento = emp.fechaNacimiento.trim();
        if (emp.curp) employeeData.curp = emp.curp.trim();
        if (emp.rfc) employeeData.rfc = emp.rfc.trim();
        if (emp.nss) employeeData.nss = emp.nss.trim();
        if (emp.estadoCivil) employeeData.estadoCivil = emp.estadoCivil.trim();
        
        // Dirección
        if (emp.calle) employeeData.calle = emp.calle.trim();
        if (emp.numeroExterior) employeeData.numeroExterior = emp.numeroExterior.trim();
        if (emp.numeroInterior) employeeData.numeroInterior = emp.numeroInterior.trim();
        if (emp.colonia) employeeData.colonia = emp.colonia.trim();
        if (emp.municipio) employeeData.municipio = emp.municipio.trim();
        if (emp.estado) employeeData.estado = emp.estado.trim();
        if (emp.codigoPostal) employeeData.codigoPostal = emp.codigoPostal.trim();
        
        // Contacto adicional
        if (emp.correo) employeeData.correo = emp.correo.trim();
        if (emp.contactoEmergencia) employeeData.contactoEmergencia = emp.contactoEmergencia.trim();
        if (emp.parentescoEmergencia) employeeData.parentescoEmergencia = emp.parentescoEmergencia.trim();
        if (emp.telefonoEmergencia) employeeData.telefonoEmergencia = emp.telefonoEmergencia.trim();
        
        // Información bancaria
        if (emp.banco) employeeData.banco = emp.banco.trim();
        if (emp.clabe) employeeData.clabe = emp.clabe.trim();
        if (emp.sucursal) employeeData.sucursal = emp.sucursal.trim();
        if (emp.cuenta) employeeData.cuenta = emp.cuenta.trim();
        if (emp.formaPago) employeeData.formaPago = emp.formaPago.trim();
        if (emp.periodicidadPago) employeeData.periodicidadPago = emp.periodicidadPago.trim();
        
        // Contrato
        if (emp.tipoCalculoSalario) employeeData.tipoCalculoSalario = emp.tipoCalculoSalario.trim();
        if (emp.tipoContrato) employeeData.tipoContrato = emp.tipoContrato.trim();
        if (emp.fechaAltaImss) employeeData.fechaAltaImss = emp.fechaAltaImss.trim();
        if (emp.fechaTerminacion) employeeData.fechaTerminacion = emp.fechaTerminacion.trim();
        if (emp.reconoceAntiguedad) employeeData.reconoceAntiguedad = emp.reconoceAntiguedad.toLowerCase() === 'true' || emp.reconoceAntiguedad === '1';
        if (emp.fechaAntiguedad) employeeData.fechaAntiguedad = emp.fechaAntiguedad.trim();
        
        // Trabajo
        if (emp.modalidadTrabajo) employeeData.modalidadTrabajo = emp.modalidadTrabajo.trim();
        if (emp.lugarTrabajo) employeeData.lugarTrabajo = emp.lugarTrabajo.trim();
        if (emp.funciones) employeeData.funciones = emp.funciones.trim();
        if (emp.diasLaborales) employeeData.diasLaborales = emp.diasLaborales.trim();
        if (emp.horario) employeeData.horario = emp.horario.trim();
        if (emp.tipoJornada) employeeData.tipoJornada = emp.tipoJornada.trim();
        if (emp.tiempoParaAlimentos) employeeData.tiempoParaAlimentos = emp.tiempoParaAlimentos.trim();
        if (emp.diasDescanso) employeeData.diasDescanso = emp.diasDescanso.trim();
        
        // Salario y prestaciones
        if (emp.esquemaPago) employeeData.esquemaPago = emp.esquemaPago.trim();
        if (emp.salarioDiarioReal) employeeData.salarioDiarioReal = emp.salarioDiarioReal.trim();
        if (emp.salarioDiarioNominal) employeeData.salarioDiarioNominal = emp.salarioDiarioNominal.trim();
        if (emp.salarioDiarioExento) employeeData.salarioDiarioExento = emp.salarioDiarioExento.trim();
        if (emp.sbc) employeeData.sbc = emp.sbc.trim();
        if (emp.sdi) employeeData.sdi = emp.sdi.trim();
        if (emp.tablaImss) employeeData.tablaImss = emp.tablaImss.trim();
        
        // Vacaciones y aguinaldo
        if (emp.diasVacacionesAnuales) employeeData.diasVacacionesAnuales = parseInt(emp.diasVacacionesAnuales);
        if (emp.diasVacacionesDisponibles) employeeData.diasVacacionesDisponibles = parseInt(emp.diasVacacionesDisponibles);
        if (emp.diasVacacionesUsados) employeeData.diasVacacionesUsados = parseInt(emp.diasVacacionesUsados);
        if (emp.diasAguinaldoAdicionales) employeeData.diasAguinaldoAdicionales = parseInt(emp.diasAguinaldoAdicionales);
        if (emp.diasVacacionesAdicionales) employeeData.diasVacacionesAdicionales = parseInt(emp.diasVacacionesAdicionales);
        
        // Créditos
        if (emp.creditoInfonavit) employeeData.creditoInfonavit = emp.creditoInfonavit.trim();
        if (emp.numeroFonacot) employeeData.numeroFonacot = emp.numeroFonacot.trim();
        
        // Estado y organización
        if (emp.estatus) employeeData.estatus = emp.estatus.trim();
        if (emp.clienteProyecto) employeeData.clienteProyecto = emp.clienteProyecto.trim();
        if (emp.observacionesInternas) employeeData.observacionesInternas = emp.observacionesInternas.trim();
        if (emp.timezone) employeeData.timezone = emp.timezone.trim();
        if (emp.jefeDirectoId) employeeData.jefeDirectoId = emp.jefeDirectoId.trim();
        if (emp.registroPatronalId) employeeData.registroPatronalId = parseInt(emp.registroPatronalId);
        if (emp.documentoContratoId) employeeData.documentoContratoId = emp.documentoContratoId.trim();
        if (emp.puestoId) employeeData.puestoId = emp.puestoId.trim();
        
        // Empresa (se resuelve a empresaId en el backend)
        if (emp.empresa) employeeData.empresa = emp.empresa.trim();
        
        // Otros
        if (emp.esquemaContratacion) employeeData.esquemaContratacion = emp.esquemaContratacion.trim();
        if (emp.lugarNacimiento) employeeData.lugarNacimiento = emp.lugarNacimiento.trim();
        if (emp.entidadNacimiento) employeeData.entidadNacimiento = emp.entidadNacimiento.trim();
        if (emp.nacionalidad) employeeData.nacionalidad = emp.nacionalidad.trim();
        if (emp.escolaridad) employeeData.escolaridad = emp.escolaridad.trim();
        if (emp.periodoPrueba) employeeData.periodoPrueba = emp.periodoPrueba.toLowerCase() === 'true' || emp.periodoPrueba === '1';
        if (emp.duracionPrueba) employeeData.duracionPrueba = parseInt(emp.duracionPrueba);
        if (emp.diaPago) employeeData.diaPago = emp.diaPago.trim();
        if (emp.driveId) employeeData.driveId = emp.driveId.trim();

        return employeeData;
      });

      const response = await apiRequest("POST", "/api/employees/bulk", {
        employees: transformedEmployees,
        clienteId: selectedCliente?.id,
        resolveReferences: true
      });
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
    if (!selectedCliente) {
      toast({
        title: "Selecciona un cliente",
        description: "Debes seleccionar un cliente en el menú lateral antes de importar",
        variant: "destructive",
      });
      return;
    }
    
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
    console.log("📥 Iniciando descarga de plantilla CSV...");
    
    // Encabezados de todas las columnas - campos esenciales para importación
    const headers = [
      // Campos requeridos (10) - OBLIGATORIOS
      "numeroEmpleado", "nombre", "apellidoPaterno", "telefono", "email", "puesto", "departamento", "salarioBrutoMensual", "fechaIngreso", "empresa",
      // Información personal (7)
      "apellidoMaterno", "genero", "fechaNacimiento", "curp", "rfc", "nss", "estadoCivil",
      // Dirección (7)
      "calle", "numeroExterior", "numeroInterior", "colonia", "municipio", "estado", "codigoPostal",
      // Contacto adicional (4)
      "correo", "contactoEmergencia", "parentescoEmergencia", "telefonoEmergencia",
      // Información bancaria (6)
      "banco", "clabe", "sucursal", "formaPago", "periodicidadPago", "cuenta",
      // Contrato (6)
      "tipoCalculoSalario", "tipoContrato", "fechaAltaImss", "fechaTerminacion", "reconoceAntiguedad", "fechaAntiguedad",
      // Trabajo (8)
      "modalidadTrabajo", "lugarTrabajo", "funciones", "diasLaborales", "horario", "tipoJornada", "tiempoParaAlimentos", "diasDescanso",
      // Salario y prestaciones (7)
      "esquemaPago", "salarioDiarioReal", "salarioDiarioNominal", "salarioDiarioExento", "sbc", "sdi", "tablaImss",
      // Vacaciones y aguinaldo (5)
      "diasVacacionesAnuales", "diasVacacionesDisponibles", "diasVacacionesUsados", "diasAguinaldoAdicionales", "diasVacacionesAdicionales",
      // Créditos (2)
      "creditoInfonavit", "numeroFonacot",
      // Estado y organización (8)
      "estatus", "clienteProyecto", "observacionesInternas", "timezone", "jefeDirectoId", "registroPatronalId", "documentoContratoId", "puestoId",
      // Otros (9)
      "esquemaContratacion", "lugarNacimiento", "entidadNacimiento", "nacionalidad", "escolaridad", "periodoPrueba", "duracionPrueba", "diaPago", "driveId"
    ];

    console.log(`📋 Plantilla generada con ${headers.length} campos`);

    // Dos filas de ejemplo con datos completos
    const row1 = [
      // Campos requeridos
      "EMP001", "Juan", "Pérez", "5512345678", "juan.perez@example.com", "Gerente", "Ventas", "25000", "2024-01-15", "Mi Empresa SA de CV",
      // Información personal
      "Martínez", "M", "1990-02-15", "PEXJ900215HDFRNS01", "PEXJ900215AB1", "12345678901", "casado",
      // Dirección
      "Insurgentes Sur", "1234", "5A", "Del Valle", "Benito Juárez", "Ciudad de México", "03100",
      // Contacto adicional
      "", "María García", "esposa", "5598765432",
      // Información bancaria
      "Banamex", "012180001234567890", "001", "transferencia", "quincenal", "0123456789",
      // Contrato
      "diario", "indeterminado", "2024-01-15", "", "false", "",
      // Trabajo
      "presencial", "Oficina Central", "Gestión de ventas y equipo", "lunes_viernes", "09:00-18:00", "diurna", "30_minutos", "sabado_domingo",
      // Salario y prestaciones
      "tradicional", "833.33", "833.33", "", "833.33", "833.33", "fija",
      // Vacaciones
      "12", "12", "0", "0", "0",
      // Créditos
      "", "",
      // Estado y organización
      "activo", "", "", "America/Mexico_City", "", "", "", "",
      // Otros
      "", "Ciudad de México", "Ciudad de México", "mexicana", "licenciatura", "false", "", "", ""
    ];

    const row2 = [
      // Campos requeridos
      "EMP002", "María", "García", "5598765432", "maria.garcia@example.com", "Desarrollador", "IT", "30000", "2024-02-01", "Mi Empresa SA de CV",
      // Información personal
      "López", "F", "1985-01-01", "GACM850101MDFRNS02", "GACM850101CD2", "98765432109", "soltera",
      // Dirección
      "Reforma", "567", "", "Juárez", "Cuauhtémoc", "Ciudad de México", "06600",
      // Contacto adicional
      "", "Pedro López", "padre", "5587654321",
      // Información bancaria
      "BBVA", "012180009876543210", "002", "transferencia", "quincenal", "9876543210",
      // Contrato
      "diario", "indeterminado", "2024-02-01", "", "false", "",
      // Trabajo
      "hibrido", "Oficina Central", "Desarrollo de software", "lunes_viernes", "10:00-19:00", "diurna", "30_minutos", "sabado_domingo",
      // Salario y prestaciones
      "tradicional", "1000", "1000", "", "1000", "1000", "fija",
      // Vacaciones
      "12", "12", "0", "0", "0",
      // Créditos
      "", "",
      // Estado y organización
      "activo", "", "", "America/Mexico_City", "", "", "", "",
      // Otros
      "", "Guadalajara", "Jalisco", "mexicana", "maestria", "false", "", "", ""
    ];

    const template = [
      headers.join(","),
      row1.join(","),
      row2.join(",")
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_empleados_completa.csv";
    link.click();
    URL.revokeObjectURL(url);
    
    console.log(`✅ Descarga de plantilla CSV completada: plantilla_empleados_completa.csv con ${headers.length} campos`);
    
    toast({
      title: "Plantilla descargada",
      description: `La plantilla CSV con ${headers.length} campos ha sido descargada exitosamente`,
    });
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
            Sube un archivo CSV con la información de los empleados. La plantilla incluye 78 campos disponibles del sistema (excluye campos autogenerados y complejos JSONB).
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
              Descargar Plantilla Completa
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
                <strong>Formato del CSV:</strong> La plantilla incluye 78 campos disponibles del sistema.
                <br />
                <strong>Campos requeridos:</strong> numeroEmpleado, nombre, apellidoPaterno, email, telefono, departamento, puesto, salarioBrutoMensual, fechaIngreso.
                <br />
                <strong>Campos opcionales:</strong> Todos los demás campos son opcionales y pueden dejarse vacíos.
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
