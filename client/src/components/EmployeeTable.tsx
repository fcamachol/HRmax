import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Employee } from "@shared/schema";

interface EmployeeTableProps {
  employees: Employee[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function EmployeeTable({ employees, onView, onEdit, onDelete }: EmployeeTableProps) {
  const getStatusVariant = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "activo":
        return "default";
      case "inactivo":
        return "secondary";
      case "licencia":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "activo":
        return "Activo";
      case "inactivo":
        return "Inactivo";
      case "licencia":
        return "En Licencia";
      default:
        return status || "N/A";
    }
  };

  const getInitials = (nombre: string, apellidoPaterno: string) => {
    return `${nombre.charAt(0)}${apellidoPaterno.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>RFC</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Puesto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(employee.nombre, employee.apellidoPaterno)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium" data-testid={`text-employee-name-${employee.id}`}>
                {employee.nombre} {employee.apellidoPaterno} {employee.apellidoMaterno || ""}
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm uppercase tracking-wide">
                  {employee.rfc || "N/A"}
                </span>
              </TableCell>
              <TableCell>{employee.departamento}</TableCell>
              <TableCell>{employee.puesto}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(employee.estatus)} data-testid={`badge-status-${employee.id}`}>
                  {getStatusLabel(employee.estatus)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-actions-${employee.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(employee.id)} data-testid={`button-view-${employee.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(employee.id)} data-testid={`button-edit-${employee.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(employee.id)}
                      className="text-destructive"
                      data-testid={`button-delete-${employee.id}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
