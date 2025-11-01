import { StatCard } from '../StatCard';
import { Users } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="p-6">
      <StatCard
        title="Total Empleados"
        value={156}
        icon={Users}
        change="+12% vs mes anterior"
        changeType="positive"
      />
    </div>
  );
}
