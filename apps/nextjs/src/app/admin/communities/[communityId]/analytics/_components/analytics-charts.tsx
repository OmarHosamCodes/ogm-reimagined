"use client";

interface AnalyticsChartsProps {
  communityId: string;
}

export function AnalyticsCharts({ communityId }: AnalyticsChartsProps) {
  // This component can be extended with chart libraries like recharts or chart.js
  // For now, it serves as a placeholder

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Activity Over Time</h2>
      <div className="flex h-64 items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">
          Charts coming soon. Consider integrating recharts or similar.
        </p>
      </div>
    </div>
  );
}
