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

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  rfc: string;
  department: string;
  position: string;
  status: string;
}

interface EmployeeTableProps {
  employees: Employee[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function EmployeeTable({ employees, onView, onEdit, onDelete }: EmployeeTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "on leave":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Activo";
      case "inactive":
        return "Inactivo";
      case "on leave":
        return "En Licencia";
      default:
        return status;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
                    {getInitials(employee.firstName, employee.lastName)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium" data-testid={`text-employee-name-${employee.id}`}>
                {employee.firstName} {employee.lastName}
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm uppercase tracking-wide">
                  {employee.rfc}
                </span>
              </TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(employee.status)} data-testid={`badge-status-${employee.id}`}>
                  {getStatusLabel(employee.status)}
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
