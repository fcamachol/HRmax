import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Phone,
  Mail,
  Users,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { cn } from "@/lib/utils";

interface Employee {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  puesto: string;
  departamento: string;
  email: string;
  telefonoExtension?: string;
  fotoUrl?: string;
  isOnline?: boolean;
}

interface Department {
  id: number;
  nombre: string;
  empleadosCount: number;
}

export default function PortalDirectorio() {
  const { clienteId } = usePortalAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("todos");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ["/api/portal/directorio/departamentos"],
    queryFn: async () => {
      const res = await fetch("/api/portal/directorio/departamentos", {
        credentials: "include",
      });
      if (!res.ok) {
        // Return sample departments if API doesn't exist
        return [
          { id: 1, nombre: "Recursos Humanos", empleadosCount: 5 },
          { id: 2, nombre: "TI & Sistemas", empleadosCount: 8 },
          { id: 3, nombre: "Ventas", empleadosCount: 12 },
          { id: 4, nombre: "Finanzas", empleadosCount: 6 },
          { id: 5, nombre: "Operaciones", empleadosCount: 15 },
        ] as Department[];
      }
      return res.json() as Promise<Department[]>;
    },
  });

  // Fetch employees
  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ["/api/portal/directorio", selectedDepartment, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDepartment !== "todos") {
        params.append("departamento", selectedDepartment);
      }
      if (searchQuery) {
        params.append("buscar", searchQuery);
      }
      const res = await fetch(`/api/portal/directorio?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json() as Promise<Employee[]>;
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const getInitials = (employee: Employee) => {
    return `${employee.nombre.charAt(0)}${employee.apellidoPaterno.charAt(0)}`.toUpperCase();
  };

  const getFullName = (employee: Employee) => {
    return `${employee.nombre} ${employee.apellidoPaterno} ${employee.apellidoMaterno || ""}`.trim();
  };

  const handleCall = (extension: string) => {
    window.location.href = `tel:${extension}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <PortalMobileLayout title="Directorio">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-[#f6f6f8] min-h-screen">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 bg-[#f6f6f8] border-b border-gray-200/50">
            {/* Search Bar */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, puesto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-none shadow-sm h-12 rounded-xl text-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#135bec]"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedDepartment("todos")}
                className={cn(
                  "flex h-8 shrink-0 items-center justify-center px-4 rounded-full text-sm font-medium transition-all active:scale-95",
                  selectedDepartment === "todos"
                    ? "bg-[#135bec] text-white shadow-md shadow-[#135bec]/20"
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                )}
              >
                Todos
              </button>
              {departments?.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id.toString())}
                  className={cn(
                    "flex h-8 shrink-0 items-center justify-center px-4 rounded-full text-sm font-medium transition-all active:scale-95",
                    selectedDepartment === dept.id.toString()
                      ? "bg-[#135bec] text-white shadow-md shadow-[#135bec]/20"
                      : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {dept.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Employee List */}
          <div className="p-4 space-y-3 pb-24">
            {isLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100"
                  >
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="ml-4 flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </>
            ) : employees && employees.length > 0 ? (
              employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-colors active:scale-[0.99]"
                >
                  {/* Avatar */}
                  <div
                    className="relative shrink-0 cursor-pointer"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <Avatar className="h-14 w-14 ring-2 ring-gray-100">
                      <AvatarImage src={employee.fotoUrl} alt={getFullName(employee)} />
                      <AvatarFallback className="bg-gradient-to-br from-[#135bec] to-blue-400 text-white font-bold text-sm">
                        {getInitials(employee)}
                      </AvatarFallback>
                    </Avatar>
                    {employee.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div
                    className="ml-4 flex-1 min-w-0 cursor-pointer"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <p className="text-gray-900 text-base font-bold leading-tight truncate">
                      {getFullName(employee)}
                    </p>
                    <p className="text-[#135bec] text-xs font-semibold mt-0.5 truncate">
                      {employee.puesto}
                    </p>
                    <p className="text-gray-500 text-xs font-normal truncate">
                      {employee.departamento}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 ml-2">
                    {employee.email && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmail(employee.email);
                        }}
                        className="flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:bg-[#135bec]/10 hover:text-[#135bec] transition-colors"
                      >
                        <Mail className="h-5 w-5" />
                      </button>
                    )}
                    {employee.telefonoExtension && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(employee.telefonoExtension!);
                        }}
                        className="flex items-center justify-center w-9 h-9 rounded-full text-white bg-[#135bec] shadow-lg shadow-[#135bec]/30 hover:bg-blue-700 transition-colors"
                      >
                        <Phone className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No se encontraron empleados</h3>
                <p className="text-sm text-gray-500 mt-2">
                  {searchQuery
                    ? "Intenta con otro término de búsqueda"
                    : "No hay empleados en este departamento"}
                </p>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* Employee Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title="Contacto"
        height="auto"
      >
        {selectedEmployee && (
          <div className="p-4">
            {/* Profile Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                  <AvatarImage
                    src={selectedEmployee.fotoUrl}
                    alt={getFullName(selectedEmployee)}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#135bec] to-blue-400 text-white text-xl font-bold">
                    {getInitials(selectedEmployee)}
                  </AvatarFallback>
                </Avatar>
                {selectedEmployee.isOnline && (
                  <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mt-3">
                {getFullName(selectedEmployee)}
              </h3>
              <p className="text-sm text-[#135bec] font-semibold">{selectedEmployee.puesto}</p>
              <p className="text-xs text-gray-500">{selectedEmployee.departamento}</p>
            </div>

            {/* Contact Actions */}
            <div className="space-y-3">
              {selectedEmployee.email && (
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start gap-4 rounded-xl border-gray-200"
                  onClick={() => handleEmail(selectedEmployee.email)}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-[#135bec]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEmployee.email}
                    </p>
                  </div>
                </Button>
              )}

              {selectedEmployee.telefonoExtension && (
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start gap-4 rounded-xl border-gray-200"
                  onClick={() => handleCall(selectedEmployee.telefonoExtension!)}
                >
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Teléfono / Extensión</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEmployee.telefonoExtension}
                    </p>
                  </div>
                </Button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </PortalMobileLayout>
  );
}
