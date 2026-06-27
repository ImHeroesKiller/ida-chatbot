"use client";

import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

export function SimpleBarChart({
  days,
  modelKeys,
  className,
}: {
  days: Array<{
    label: string;
    byModel: Record<string, number>;
    total: number;
  }>;
  modelKeys: string[];
  className?: string;
}) {
  const maxTotal = Math.max(...days.map((day) => day.total), 1);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-52 items-end gap-2 border-b border-border pb-2">
        {days.map((day) => (
          <div
            key={day.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              {day.total === 0 ? (
                <div className="h-1 w-full rounded-full bg-muted" />
              ) : (
                modelKeys.map((modelKey, index) => {
                  const value = day.byModel[modelKey] ?? 0;
                  if (!value) return null;

                  const height = Math.max((value / maxTotal) * 100, 8);

                  return (
                    <div
                      key={modelKey}
                      title={`${modelKey}: ${value}`}
                      className={cn(
                        "w-full min-w-[4px] max-w-3 rounded-t",
                        CHART_COLORS[index % CHART_COLORS.length],
                      )}
                      style={{ height: `${height}%` }}
                    />
                  );
                })
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{day.label}</span>
            <span className="text-[10px] font-medium">{day.total}</span>
          </div>
        ))}
      </div>

      {modelKeys.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {modelKeys.map((modelKey, index) => (
            <span key={modelKey} className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  CHART_COLORS[index % CHART_COLORS.length],
                )}
              />
              {modelKey.split(":").slice(1).join(":") || modelKey}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}