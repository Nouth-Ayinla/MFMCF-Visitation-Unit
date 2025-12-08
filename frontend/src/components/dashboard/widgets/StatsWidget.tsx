import { LucideIcon } from "lucide-react";

interface StatsWidgetProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  description?: string;
}

export const StatsWidget = ({ icon: Icon, value, label, description }: StatsWidgetProps) => {
  return (
    <div className="flex items-start gap-4">
      <div className="rounded-lg bg-primary/10 p-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm font-medium text-foreground mt-1">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};
