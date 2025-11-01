import { EmployeeTable } from '../EmployeeTable';

export default function EmployeeTableExample() {
  const mockEmployees = [
    {
      id: "1",
      firstName: "María",
      lastName: "García",
      rfc: "GACM850101AB1",
      department: "Ventas",
      position: "Gerente",
      status: "active",
    },
    {
      id: "2",
      firstName: "Juan",
      lastName: "Pérez",
      rfc: "PEXJ900215CD2",
      department: "IT",
      position: "Desarrollador",
      status: "active",
    },
  ];

  return (
    <div className="p-6">
      <EmployeeTable
        employees={mockEmployees}
        onView={(id) => console.log('View employee:', id)}
        onEdit={(id) => console.log('Edit employee:', id)}
        onDelete={(id) => console.log('Delete employee:', id)}
      />
    </div>
  );
}
