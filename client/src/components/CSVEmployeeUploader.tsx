import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2, X, Building2, ChevronRight, ChevronLeft, Plus, Search, RefreshCw } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCliente } from "@/contexts/ClienteContext";

interface CSVRow {
  // Campos requeridos (5)
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  fechaIngreso: string;
  
  // Campos opcionales
  numeroEmpleado?: string;
  telefono?: string;
  email?: string;
  puesto?: string;
  departamento?: string;
  salarioNetoMensual?: string;
  salarioBrutoMensual?: string;
  
  // Información personal
  genero?: string;
  fechaNacimiento?: string;
  rfc?: string;
  nss?: string;
  estadoCivil?: string;
  
  // Dirección
  calle?: string;
  numeroExterior?: string;
  numeroInterior?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  codigoPostal?: string;
  
  // Contacto adicional
  correo?: string;
  contactoEmergencia?: string;
  parentescoEmergencia?: string;
  telefonoEmergencia?: string;
  
  // Información bancaria
  banco?: string;
  clabe?: string;
  sucursal?: string;
  cuenta?: string;
  formaPago?: string;
  periodicidadPago?: string;
  
  // Contrato
  tipoCalculoSalario?: string;
  tipoContrato?: string;
  fechaAltaImss?: string;
  fechaTerminacion?: string;
  reconoceAntiguedad?: string;
  fechaAntiguedad?: string;
  
  // Trabajo
  modalidadTrabajo?: string;
  lugarTrabajo?: string;
  funciones?: string;
  diasLaborales?: string;
  horario?: string;
  tipoJornada?: string;
  tiempoParaAlimentos?: string;
  diasDescanso?: string;
  
  // Salario y prestaciones
  esquemaPago?: string;
  salarioDiarioReal?: string;
  salarioDiarioNominal?: string;
  salarioDiarioExento?: string;
  sbc?: string;
  sdi?: string;
  tablaImss?: string;
  
  // Vacaciones y aguinaldo
  diasVacacionesAnuales?: string;
  diasVacacionesDisponibles?: string;
  diasVacacionesUsados?: string;
  diasAguinaldoAdicionales?: string;
  diasVacacionesAdicionales?: string;
  
  // Créditos
  creditoInfonavit?: string;
  numeroFonacot?: string;
  
  // Estado y organización
  estatus?: string;
  clienteProyecto?: string;
  observacionesInternas?: string;
  timezone?: string;
  jefeDirectoId?: string;
  documentoContratoId?: string;
  puestoId?: string;
  
  // Otros
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
  currentValue?: string;
}

interface PuestoMatch {
  csvPuesto: string;
  matchedPuestoId: string | null;
  matchedPuestoName: string | null;
  isNew: boolean;
}

interface Empresa {
  id: string;
  nombreComercial: string;
  razonSocial: string;
}

interface RegistroPatronal {
  id: string;
  empresaId: string;
  numeroRegistroPatronal: string;
  descripcion?: string;
}

interface CSVEmployeeUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export function CSVEmployeeUploader({ open, onOpenChange }: CSVEmployeeUploaderProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [selectedRegistroPatronalId, setSelectedRegistroPatronalId] = useState<string>("");
  const [puestoMatches, setPuestoMatches] = useState<PuestoMatch[]>([]);
  const [newPuestoNames, setNewPuestoNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedCliente } = useCliente();

  // Fetch all empresas (filter by cliente on backend via storage)
  const { data: allEmpresas = [] } = useQuery<Empresa[]>({
    queryKey: ['/api/empresas'],
    enabled: open,
  });
  
  // Filter empresas by selected cliente on client-side
  const empresas = selectedCliente?.id 
    ? allEmpresas.filter((e: any) => e.clienteId === selectedCliente.id)
    : [];

  // Fetch all registros patronales and filter by selected empresa
  const { data: allRegistrosPatronales = [] } = useQuery<RegistroPatronal[]>({
    queryKey: ['/api/registros-patronales'],
    enabled: open,
  });
  
  // Filter registros by selected empresa
  const registrosPatronales = selectedEmpresaId
    ? allRegistrosPatronales.filter((rp: RegistroPatronal) => rp.empresaId === selectedEmpresaId)
    : [];

  // Fetch all puestos
  const { data: allPuestos = [] } = useQuery<{ id: string; nombrePuesto: string; clienteId?: string }[]>({
    queryKey: ['/api/puestos'],
    enabled: open,
  });
  
  // Filter and map puestos
  const existingPuestos = (selectedCliente?.id 
    ? allPuestos.filter((p: any) => !p.clienteId || p.clienteId === selectedCliente.id)
    : allPuestos
  ).map(p => ({ id: p.id, nombre: p.nombrePuesto }));

  const validateRow = (row: CSVRow, index: number): ValidationError[] => {
    const rowErrors: ValidationError[] = [];
    const rowNum = index + 2;

    // Solo 5 campos requeridos
    if (!row.nombre?.trim()) {
      rowErrors.push({ row: rowNum, field: "nombre", message: "Nombre requerido" });
    }
    if (!row.apellidoPaterno?.trim()) {
      rowErrors.push({ row: rowNum, field: "apellidoPaterno", message: "Apellido paterno requerido" });
    }
    if (!row.apellidoMaterno?.trim()) {
      rowErrors.push({ row: rowNum, field: "apellidoMaterno", message: "Apellido materno requerido" });
    }
    if (!row.curp?.trim()) {
      rowErrors.push({ row: rowNum, field: "curp", message: "CURP requerido" });
    } else if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(row.curp.toUpperCase())) {
      rowErrors.push({ row: rowNum, field: "curp", message: "CURP inválido (debe tener 18 caracteres)" });
    }
    if (!row.fechaIngreso?.trim()) {
      rowErrors.push({ row: rowNum, field: "fechaIngreso", message: "Fecha de ingreso requerida" });
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.fechaIngreso)) {
      rowErrors.push({ row: rowNum, field: "fechaIngreso", message: "Fecha debe estar en formato YYYY-MM-DD" });
    }

    // Validaciones opcionales
    if (row.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      rowErrors.push({ row: rowNum, field: "email", message: "Email inválido" });
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
          'salario_neto_mensual': 'salarioNetoMensual',
          'salario neto mensual': 'salarioNetoMensual',
          'salario_neto': 'salarioNetoMensual',
          'salario neto': 'salarioNetoMensual',
          'salario': 'salarioNetoMensual',
          'salario_bruto_mensual': 'salarioBrutoMensual',
          'salario bruto mensual': 'salarioBrutoMensual',
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

        // Extract unique puestos
        const puestoSet = new Set<string>();
        data.forEach(row => {
          if (row.puesto?.trim()) puestoSet.add(row.puesto.trim());
        });
        const uniquePuestos = Array.from(puestoSet);
        const matches: PuestoMatch[] = uniquePuestos.map(csvPuesto => {
          const exactMatch = existingPuestos.find(p => 
            p.nombre.toLowerCase() === csvPuesto.toLowerCase()
          );
          return {
            csvPuesto,
            matchedPuestoId: exactMatch?.id || null,
            matchedPuestoName: exactMatch?.nombre || null,
            isNew: !exactMatch,
          };
        });
        setPuestoMatches(matches);

        if (allErrors.length === 0) {
          toast({
            title: "CSV validado",
            description: `${data.length} empleado(s) listos para revisar`,
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
      const transformedEmployees = employees.map((emp, index) => {
        const employeeData: any = {
          // Campos requeridos
          nombre: emp.nombre.trim(),
          apellidoPaterno: emp.apellidoPaterno.trim(),
          apellidoMaterno: emp.apellidoMaterno?.trim() || "",
          curp: emp.curp.trim().toUpperCase(),
          fechaIngreso: emp.fechaIngreso.trim(),
          // Empresa y registro patronal from wizard
          empresaId: selectedEmpresaId,
          registroPatronalId: selectedRegistroPatronalId || undefined,
        };

        // Numero de empleado (autogenerate if not provided)
        if (emp.numeroEmpleado?.trim()) {
          employeeData.numeroEmpleado = emp.numeroEmpleado.trim();
        }

        // Agregar campos opcionales si están presentes
        if (emp.telefono) employeeData.telefono = emp.telefono.trim();
        if (emp.email) employeeData.email = emp.email.trim();
        if (emp.genero) employeeData.genero = emp.genero.trim();
        if (emp.fechaNacimiento) employeeData.fechaNacimiento = emp.fechaNacimiento.trim();
        if (emp.rfc) employeeData.rfc = emp.rfc.trim();
        if (emp.nss) employeeData.nss = emp.nss.trim();
        if (emp.estadoCivil) employeeData.estadoCivil = emp.estadoCivil.trim();
        
        // Salario
        if (emp.salarioNetoMensual) employeeData.salarioNetoMensual = emp.salarioNetoMensual.trim();
        if (emp.salarioBrutoMensual) employeeData.salarioBrutoMensual = emp.salarioBrutoMensual.trim();
        
        // Puesto - resolve from matches
        if (emp.puesto?.trim()) {
          const match = puestoMatches.find(m => m.csvPuesto === emp.puesto?.trim());
          if (match?.matchedPuestoId) {
            employeeData.puestoId = match.matchedPuestoId;
          }
          employeeData.puesto = emp.puesto.trim();
        }
        if (emp.departamento) employeeData.departamento = emp.departamento.trim();
        
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
        
        // Vacaciones
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
        if (emp.documentoContratoId) employeeData.documentoContratoId = emp.documentoContratoId.trim();
        
        // Otros
        if (emp.esquemaContratacion) employeeData.esquemaContratacion = emp.esquemaContratacion.trim();
        if (emp.lugarNacimiento) employeeData.lugarNacimiento = emp.lugarNacimiento.trim();
        if (emp.entidadNacimiento) employeeData.entidadNacimiento = emp.entidadNacimiento.trim();
        if (emp.nacionalidad) employeeData.nacionalidad = emp.nacionalidad.trim();
        if (emp.escolaridad) employeeData.escolaridad = emp.escolaridad.trim();
        if (emp.periodoPrueba) employeeData.periodoPrueba = emp.periodoPrueba.toLowerCase() === 'true' || emp.periodoPrueba === '1';
        if (emp.duracionPrueba) employeeData.duracionPrueba = emp.duracionPrueba.trim();
        if (emp.diaPago) employeeData.diaPago = emp.diaPago.trim();
        if (emp.driveId) employeeData.driveId = emp.driveId.trim();

        return employeeData;
      });

      // Create new puestos first if needed
      const newPuestos = puestoMatches.filter(m => m.isNew && !m.matchedPuestoId);
      if (newPuestos.length > 0) {
        await apiRequest("POST", "/api/puestos/bulk", {
          puestos: newPuestos.map(p => ({ nombre: p.csvPuesto })),
          clienteId: selectedCliente?.id,
          empresaId: selectedEmpresaId,
        });
      }

      const response = await apiRequest("POST", "/api/employees/bulk", {
        employees: transformedEmployees,
        clienteId: selectedCliente?.id,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${data.created || csvData.length} empleado(s) correctamente`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error en la importación",
        description: error.message,
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
    setStep(1);
    setSelectedEmpresaId("");
    setSelectedRegistroPatronalId("");
    setPuestoMatches([]);
    setNewPuestoNames([]);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const headers = [
      // Campos requeridos (5)
      "nombre", "apellidoPaterno", "apellidoMaterno", "curp", "fechaIngreso",
      // Campos opcionales frecuentes
      "numeroEmpleado", "telefono", "email", "puesto", "departamento", "salarioNetoMensual",
      // Información personal
      "genero", "fechaNacimiento", "rfc", "nss", "estadoCivil",
      // Dirección
      "calle", "numeroExterior", "numeroInterior", "colonia", "municipio", "estado", "codigoPostal",
      // Contacto emergencia
      "contactoEmergencia", "parentescoEmergencia", "telefonoEmergencia",
      // Banco
      "banco", "clabe", "cuenta", "formaPago", "periodicidadPago",
      // Contrato
      "tipoContrato", "fechaAltaImss",
      // Trabajo
      "modalidadTrabajo", "horario", "tipoJornada"
    ];

    const row1 = [
      "Juan", "Pérez", "Martínez", "PEXJ900215HDFRNS01", "2024-01-15",
      "", "5512345678", "juan.perez@example.com", "Gerente", "Ventas", "20000",
      "M", "1990-02-15", "PEXJ900215AB1", "12345678901", "casado",
      "Insurgentes Sur", "1234", "5A", "Del Valle", "Benito Juárez", "Ciudad de México", "03100",
      "María García", "esposa", "5598765432",
      "Banamex", "012180001234567890", "0123456789", "transferencia", "quincenal",
      "indeterminado", "2024-01-15",
      "presencial", "09:00-18:00", "diurna"
    ];

    const row2 = [
      "María", "García", "López", "GACM850101MDFRNS02", "2024-02-01",
      "", "5598765432", "maria.garcia@example.com", "Desarrollador", "IT", "25000",
      "F", "1985-01-01", "GACM850101CD2", "98765432109", "soltera",
      "Reforma", "567", "", "Juárez", "Cuauhtémoc", "Ciudad de México", "06600",
      "Pedro López", "padre", "5587654321",
      "BBVA", "012180009876543210", "9876543210", "transferencia", "quincenal",
      "indeterminado", "2024-02-01",
      "hibrido", "10:00-19:00", "diurna"
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
    link.download = "plantilla_empleados.csv";
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Plantilla descargada",
      description: "La plantilla CSV ha sido descargada exitosamente",
    });
  };

  const getErrorsForRow = (rowIndex: number) => {
    return errors.filter(e => e.row === rowIndex + 2);
  };

  const selectedEmpresa = empresas.find(e => e.id === selectedEmpresaId);
  const selectedRegistroPatronal = registrosPatronales.find(r => r.id === selectedRegistroPatronalId);

  const canProceedToStep2 = selectedEmpresaId !== "";
  const canProceedToStep3 = csvData.length > 0 && errors.length === 0;
  const hasPuestosToMatch = puestoMatches.length > 0;
  const canProceedToStep4 = !hasPuestosToMatch || puestoMatches.every(m => m.matchedPuestoId || m.isNew);

  const handlePuestoMatch = (csvPuesto: string, puestoId: string | null) => {
    setPuestoMatches(prev => prev.map(m => {
      if (m.csvPuesto === csvPuesto) {
        const matchedPuesto = existingPuestos.find(p => p.id === puestoId);
        return {
          ...m,
          matchedPuestoId: puestoId,
          matchedPuestoName: matchedPuesto?.nombre || null,
          isNew: puestoId === null,
        };
      }
      return m;
    }));
  };

  const handleCreateNewPuesto = (csvPuesto: string) => {
    setPuestoMatches(prev => prev.map(m => {
      if (m.csvPuesto === csvPuesto) {
        return {
          ...m,
          matchedPuestoId: null,
          matchedPuestoName: csvPuesto,
          isNew: true,
        };
      }
      return m;
    }));
  };

  // Function to update a specific field in a row and re-validate
  const handleFieldUpdate = (rowIndex: number, field: keyof CSVRow, value: string) => {
    setCsvData(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return updated;
    });
  };

  // Re-validate data when csvData changes
  const revalidateData = () => {
    const allErrors: ValidationError[] = [];
    csvData.forEach((row, index) => {
      const rowErrors = validateRow(row, index);
      allErrors.push(...rowErrors);
    });
    setErrors(allErrors);
  };

  // Get field label in Spanish
  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      nombre: "Nombre",
      apellidoPaterno: "Apellido Paterno",
      apellidoMaterno: "Apellido Materno",
      curp: "CURP",
      fechaIngreso: "Fecha de Ingreso",
      rfc: "RFC",
      nss: "NSS",
      email: "Email",
    };
    return labels[field] || field;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Empleados desde CSV</DialogTitle>
          <DialogDescription>
            {step === 1 && "Paso 1 de 4: Selecciona la empresa y registro patronal"}
            {step === 2 && "Paso 2 de 4: Sube el archivo CSV con los datos de empleados"}
            {step === 3 && "Paso 3 de 4: Revisa y empareja los puestos"}
            {step === 4 && "Paso 4 de 4: Confirma e importa"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Empresa + Registro Patronal */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa *</Label>
              <Select value={selectedEmpresaId} onValueChange={(value) => {
                setSelectedEmpresaId(value);
                setSelectedRegistroPatronalId("");
              }}>
                <SelectTrigger data-testid="select-empresa">
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No hay empresas disponibles para el cliente seleccionado
                    </div>
                  ) : (
                    empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nombreComercial || empresa.razonSocial}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Todos los empleados importados se asignarán a esta empresa
              </p>
            </div>

            {selectedEmpresaId && (
              <div className="space-y-2">
                <Label htmlFor="registroPatronal">Registro Patronal (opcional)</Label>
                <Select value={selectedRegistroPatronalId} onValueChange={setSelectedRegistroPatronalId}>
                  <SelectTrigger data-testid="select-registro-patronal">
                    <SelectValue placeholder="Selecciona un registro patronal" />
                  </SelectTrigger>
                  <SelectContent>
                    {registrosPatronales.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No hay registros patronales para esta empresa
                      </div>
                    ) : (
                      registrosPatronales.map((rp) => (
                        <SelectItem key={rp.id} value={rp.id}>
                          {rp.numeroRegistroPatronal} {rp.descripcion ? `- ${rp.descripcion}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  El registro patronal IMSS para estos empleados
                </p>
              </div>
            )}

            {selectedEmpresa && (
              <Alert>
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Empresa seleccionada:</strong> {selectedEmpresa.nombreComercial || selectedEmpresa.razonSocial}
                  {selectedRegistroPatronal && (
                    <><br /><strong>Registro Patronal:</strong> {selectedRegistroPatronal.numeroRegistroPatronal}</>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 2: Upload CSV */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-csv-file"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-select-csv"
              >
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar archivo CSV
              </Button>
              <Button
                variant="ghost"
                onClick={downloadTemplate}
                data-testid="button-download-template"
              >
                <FileText className="mr-2 h-4 w-4" />
                Descargar plantilla
              </Button>
              {fileName && (
                <Badge variant="secondary">
                  <FileText className="mr-1 h-3 w-3" />
                  {fileName}
                </Badge>
              )}
            </div>

            {csvData.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Campos requeridos (5):</strong> nombre, apellidoPaterno, apellidoMaterno, curp, fechaIngreso
                  <br />
                  <strong>Campos opcionales:</strong> numeroEmpleado (se autogenera), telefono, email, puesto, departamento, salarioNetoMensual, etc.
                </AlertDescription>
              </Alert>
            )}

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Se encontraron {errors.length} error(es) de validación. Corrige el archivo y vuelve a subirlo.
                </AlertDescription>
              </Alert>
            )}

            {csvData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {errors.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {csvData.length} empleado(s) encontrados
                  </span>
                </div>

                {/* Show errors with editable fields */}
                {errors.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">
                          Se encontraron {errors.length} error(es) en {new Set(errors.map(e => e.row)).size} fila(s)
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={revalidateData}
                        data-testid="button-revalidate"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Validar cambios
                      </Button>
                    </div>
                    <ScrollArea className="h-[250px] border border-destructive/30 rounded-md bg-destructive/5 p-4">
                      <div className="space-y-4">
                        {Array.from(new Set(errors.map(e => e.row))).sort((a, b) => a - b).map(rowNum => {
                          const rowErrors = errors.filter(e => e.row === rowNum);
                          const rowIndex = rowNum - 2;
                          const rowData = csvData[rowIndex];
                          return (
                            <div key={rowNum} className="border border-destructive/30 rounded-lg p-4 bg-background">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="destructive">
                                  Fila {rowNum}
                                </Badge>
                                {rowData && (
                                  <span className="text-sm text-muted-foreground">
                                    {rowData.nombre || "Sin nombre"} {rowData.apellidoPaterno || ""}
                                  </span>
                                )}
                              </div>
                              <div className="grid gap-3">
                                {rowErrors.map((error, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm font-medium text-destructive">
                                        {getFieldLabel(error.field)}
                                      </Label>
                                      <span className="text-xs text-muted-foreground">
                                        — {error.message}
                                      </span>
                                    </div>
                                    <Input
                                      value={rowData?.[error.field as keyof CSVRow] || ""}
                                      onChange={(e) => handleFieldUpdate(rowIndex, error.field as keyof CSVRow, e.target.value)}
                                      placeholder={`Ingresa ${getFieldLabel(error.field).toLowerCase()}`}
                                      className="border-destructive/50 focus:border-destructive"
                                      data-testid={`input-fix-${error.field}-${rowNum}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <p className="text-sm text-muted-foreground">
                      Edita los campos con error arriba y haz clic en "Validar cambios" para continuar.
                    </p>
                  </div>
                )}

                <ScrollArea className="h-[250px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Apellidos</TableHead>
                        <TableHead>CURP</TableHead>
                        <TableHead>Fecha Ingreso</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 50).map((row, index) => {
                        const rowErrors = getErrorsForRow(index);
                        return (
                          <TableRow
                            key={index}
                            className={rowErrors.length > 0 ? "bg-destructive/10" : ""}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className={rowErrors.some(e => e.field === 'nombre') ? "text-destructive font-medium" : ""}>
                              {row.nombre || <span className="text-destructive italic">vacío</span>}
                            </TableCell>
                            <TableCell className={rowErrors.some(e => e.field === 'apellidoPaterno' || e.field === 'apellidoMaterno') ? "text-destructive font-medium" : ""}>
                              {row.apellidoPaterno || <span className="text-destructive italic">vacío</span>} {row.apellidoMaterno}
                            </TableCell>
                            <TableCell className={`font-mono text-xs ${rowErrors.some(e => e.field === 'curp') ? "text-destructive font-medium" : ""}`}>
                              {row.curp || <span className="text-destructive italic">vacío</span>}
                            </TableCell>
                            <TableCell className={rowErrors.some(e => e.field === 'fechaIngreso') ? "text-destructive font-medium" : ""}>
                              {row.fechaIngreso || <span className="text-destructive italic">vacío</span>}
                            </TableCell>
                            <TableCell>
                              {rowErrors.length > 0 ? (
                                <Badge variant="destructive">
                                  {rowErrors.length} error(es)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {csvData.length > 50 && (
                  <p className="text-sm text-muted-foreground">
                    Mostrando 50 de {csvData.length} empleados
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Match Puestos */}
        {step === 3 && (
          <div className="space-y-4">
            {hasPuestosToMatch ? (
              <>
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertDescription>
                    Se encontraron {puestoMatches.length} puesto(s) en el CSV. Empareja cada uno con un puesto existente o crea uno nuevo.
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {puestoMatches.map((match) => (
                      <div key={match.csvPuesto} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">Puesto en CSV</Label>
                          <p className="font-medium">{match.csvPuesto}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 space-y-2">
                          <Label className="text-sm text-muted-foreground">Emparejar con</Label>
                          <Select
                            value={match.matchedPuestoId || ""}
                            onValueChange={(value) => handlePuestoMatch(match.csvPuesto, value || null)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un puesto" />
                            </SelectTrigger>
                            <SelectContent>
                              {existingPuestos.map((puesto) => (
                                <SelectItem key={puesto.id} value={puesto.id}>
                                  {puesto.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateNewPuesto(match.csvPuesto)}
                          className={match.isNew ? "border-green-500 text-green-600" : ""}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Crear nuevo
                        </Button>
                        {match.isNew && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Se creará
                          </Badge>
                        )}
                        {match.matchedPuestoId && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Emparejado
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  No se encontraron puestos en el CSV. Los empleados se importarán sin puesto asignado.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 4: Preview and Import */}
        {step === 4 && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <strong>Resumen de importación:</strong>
                <br />
                <strong>Empresa:</strong> {selectedEmpresa?.nombreComercial || selectedEmpresa?.razonSocial}
                {selectedRegistroPatronal && (
                  <><br /><strong>Registro Patronal:</strong> {selectedRegistroPatronal.numeroRegistroPatronal}</>
                )}
                <br />
                <strong>Empleados a importar:</strong> {csvData.length}
                {puestoMatches.filter(m => m.isNew).length > 0 && (
                  <><br /><strong>Nuevos puestos a crear:</strong> {puestoMatches.filter(m => m.isNew).length}</>
                )}
              </AlertDescription>
            </Alert>

            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>CURP</TableHead>
                    <TableHead>Puesto</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 100).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.nombre} {row.apellidoPaterno} {row.apellidoMaterno}</TableCell>
                      <TableCell className="font-mono text-xs">{row.curp}</TableCell>
                      <TableCell>{row.puesto || "-"}</TableCell>
                      <TableCell>{row.fechaIngreso}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            {csvData.length > 100 && (
              <p className="text-sm text-muted-foreground">
                Mostrando 100 de {csvData.length} empleados
              </p>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep((step - 1) as WizardStep) : handleClose()}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {step === 1 ? "Cancelar" : "Anterior"}
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep((step + 1) as WizardStep)}
              disabled={
                (step === 1 && !canProceedToStep2) ||
                (step === 2 && !canProceedToStep3) ||
                (step === 3 && !canProceedToStep4)
              }
              data-testid="button-next-step"
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={bulkCreateMutation.isPending}
              data-testid="button-import"
            >
              {bulkCreateMutation.isPending ? "Importando..." : "Importar empleados"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
