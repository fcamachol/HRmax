import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({ title, value, icon: Icon, change, changeType = "neutral" }: StatCardProps) {
  const changeColor = {
    positive: "text-green-600 dark:text-green-500",
    negative: "text-red-600 dark:text-red-500",
    neutral: "text-muted-foreground",
  }[changeType];

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {change && (
          <p className={`text-xs ${changeColor}`} data-testid="text-stat-change">
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
