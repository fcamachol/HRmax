import { EmployeeForm } from '../EmployeeForm';

export default function EmployeeFormExample() {
  return (
    <div className="p-6 max-w-4xl">
      <EmployeeForm
        onSubmit={(data) => console.log('Form submitted:', data)}
      />
    </div>
  );
}
