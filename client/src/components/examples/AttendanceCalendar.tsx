import { AttendanceCalendar } from '../AttendanceCalendar';

export default function AttendanceCalendarExample() {
  const today = new Date();
  const mockRecords = [
    { date: new Date(today.getFullYear(), today.getMonth(), 1), status: 'present' as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 2), status: 'present' as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 3), status: 'late' as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 4), status: 'present' as const },
    { date: new Date(today.getFullYear(), today.getMonth(), 5), status: 'vacation' as const },
  ];

  return (
    <div className="p-6 max-w-md">
      <AttendanceCalendar records={mockRecords} />
    </div>
  );
}
