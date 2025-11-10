import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Employee {
  id: string;
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  puesto: string;
  departamento: string;
  estatus: string;
}

interface EmployeeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  testId?: string;
}

export function EmployeeCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar empleado...",
  testId = "combobox-empleado",
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: open,
  });

  const selectedEmployee = employees.find((emp) => emp.id === value);

  const getEmployeeDisplay = (emp: Employee) => {
    const apellidos = emp.apellidoMaterno
      ? `${emp.apellidoPaterno} ${emp.apellidoMaterno}`
      : emp.apellidoPaterno;
    return `${emp.nombre} ${apellidos}`;
  };

  const getEmployeeSearchText = (emp: Employee) => {
    return `${getEmployeeDisplay(emp)} ${emp.numeroEmpleado} ${emp.puesto}`.toLowerCase();
  };

  // Filter only active employees
  const activeEmployees = employees.filter((emp) => emp.estatus === "activo");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          data-testid={testId}
        >
          {selectedEmployee ? (
            <div className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">{getEmployeeDisplay(selectedEmployee)}</span>
              <span className="text-xs text-muted-foreground">({selectedEmployee.numeroEmpleado})</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command
          filter={(value, search) => {
            const employee = activeEmployees.find((emp) => emp.id === value);
            if (!employee) return 0;
            const searchText = getEmployeeSearchText(employee);
            return searchText.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Buscar empleado..." data-testid={`${testId}-search`} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Cargando empleados..." : "No se encontraron empleados."}
            </CommandEmpty>
            <CommandGroup>
              {activeEmployees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={employee.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  data-testid={`${testId}-option-${employee.id}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === employee.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{getEmployeeDisplay(employee)}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {employee.numeroEmpleado}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {employee.puesto} - {employee.departamento}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
