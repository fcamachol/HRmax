import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

interface AttendanceRecord {
  date: Date;
  status: "present" | "absent" | "late" | "vacation";
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
}

export function AttendanceCalendar({ records }: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getStatusBadge = (status: string) => {
    const config = {
      present: { label: "Presente", variant: "default" as const },
      absent: { label: "Ausente", variant: "destructive" as const },
      late: { label: "Tarde", variant: "secondary" as const },
      vacation: { label: "Vacaciones", variant: "outline" as const },
    };
    return config[status as keyof typeof config] || config.present;
  };

  const selectedRecord = records.find(
    (r) => r.date.toDateString() === selectedDate?.toDateString()
  );

  const modifiers = {
    present: records.filter(r => r.status === 'present').map(r => r.date),
    absent: records.filter(r => r.status === 'absent').map(r => r.date),
    late: records.filter(r => r.status === 'late').map(r => r.date),
    vacation: records.filter(r => r.status === 'vacation').map(r => r.date),
  };

  const modifiersStyles = {
    present: { backgroundColor: 'hsl(var(--primary))', color: 'white' },
    absent: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
    late: { backgroundColor: 'hsl(var(--secondary))' },
    vacation: { backgroundColor: 'hsl(var(--accent))' },
  };

  return (
    <Card data-testid="card-attendance-calendar">
      <CardHeader>
        <CardTitle>Calendario de Asistencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border"
        />
        {selectedRecord && (
          <div className="flex items-center justify-between p-4 rounded-md border">
            <span className="text-sm font-medium">
              {selectedDate?.toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <Badge variant={getStatusBadge(selectedRecord.status).variant} data-testid="badge-attendance-status">
              {getStatusBadge(selectedRecord.status).label}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
