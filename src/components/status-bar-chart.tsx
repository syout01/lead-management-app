"use client";

import { LEAD_STATUS_LABELS, LeadStatus } from "@/lib/types";

interface StatusBarChartProps {
  data: Record<string, number>;
  total: number;
}

const BAR_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacting: "bg-yellow-500",
  contacted: "bg-purple-500",
  appointment: "bg-green-500",
  nurturing: "bg-orange-500",
  lost: "bg-gray-400",
};

export function StatusBarChart({ data, total }: StatusBarChartProps) {
  if (total === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">データがありません</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* 横積みバー */}
      <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
        {Object.entries(data).map(([status, count]) => {
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={status}
              className={`${BAR_COLORS[status]} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${LEAD_STATUS_LABELS[status as LeadStatus]}: ${count}件 (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(data).map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${BAR_COLORS[status]}`} />
            <span className="text-xs text-gray-600">
              {LEAD_STATUS_LABELS[status as LeadStatus]}
            </span>
            <span className="text-xs font-semibold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
