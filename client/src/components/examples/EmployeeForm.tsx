import { EmployeeForm } from '../EmployeeForm';

export default function EmployeeFormExample() {
  return (
    <div className="p-6 max-w-4xl">
      <EmployeeForm
        onSuccess={() => console.log('Form submitted successfully')}
      />
    </div>
  );
}
