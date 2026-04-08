"use client";

import { getActivities } from "@/lib/store";

interface DayData {
  label: string;
  calls: number;
  emails: number;
  meetings: number;
}

export function WeeklyActivityChart() {
  const activities = getActivities();
  const today = new Date();

  // 過去7日分のデータを作成
  const days: DayData[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayLabel = date.toLocaleDateString("ja-JP", { weekday: "short", month: "numeric", day: "numeric" });

    const dayActivities = activities.filter(
      (a) => a.createdAt.split("T")[0] === dateStr
    );

    days.push({
      label: dayLabel,
      calls: dayActivities.filter((a) => a.type === "call").length,
      emails: dayActivities.filter((a) => a.type === "email").length,
      meetings: dayActivities.filter((a) => a.type === "meeting").length,
    });
  }

  const maxValue = Math.max(
    ...days.map((d) => d.calls + d.emails + d.meetings),
    1
  );

  return (
    <div>
      <div className="flex items-end gap-2 h-32">
        {days.map((day, index) => {
          const total = day.calls + day.emails + day.meetings;
          const height = total > 0 ? (total / maxValue) * 100 : 0;
          const isToday = index === days.length - 1;

          return (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
              {/* バー */}
              <div className="w-full flex flex-col justify-end h-24">
                {total > 0 ? (
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday ? "bg-blue-500" : "bg-blue-200"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`架電: ${day.calls}, メール: ${day.emails}, 商談: ${day.meetings}`}
                  />
                ) : (
                  <div className="w-full h-1 bg-gray-100 rounded" />
                )}
              </div>
              {/* ラベル */}
              <span
                className={`text-xs ${
                  isToday ? "text-blue-600 font-semibold" : "text-gray-400"
                }`}
              >
                {day.label.split("(")[0]}
              </span>
              {/* 数値 */}
              <span className="text-xs font-medium">{total || ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
