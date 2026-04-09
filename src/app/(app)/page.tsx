"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Phone,
  Mail,
  CalendarCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { fetchStats, fetchTodayLeads, fetchAllActivities, fetchRecentViews } from "@/lib/use-store";
import { Lead, Activity, RecentView, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/types";
import { StatusBarChart } from "@/components/status-bar-chart";
import { RecentViewsCard } from "@/components/recent-views-card";

interface Stats {
  totalLeads: number;
  newLeads: number;
  contactingLeads: number;
  contactedLeads: number;
  appointmentLeads: number;
  nurturingLeads: number;
  lostLeads: number;
  todayTasks: number;
  todayCalls: number;
  todayEmails: number;
}

function WeeklyActivityChartAsync({ activities }: { activities: Activity[] }) {
  const today = new Date();
  const days: { label: string; total: number; isToday: boolean }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayLabel = date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
    const total = activities.filter((a) => a.createdAt.split("T")[0] === dateStr).length;
    days.push({ label: dayLabel, total, isToday: i === 0 });
  }

  const maxValue = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {days.map((day) => {
        const height = day.total > 0 ? (day.total / maxValue) * 100 : 0;
        return (
          <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end h-24">
              {day.total > 0 ? (
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${day.isToday ? "bg-blue-500" : "bg-blue-200"}`}
                  style={{ height: `${height}%` }}
                />
              ) : (
                <div className="w-full h-1 bg-gray-100 rounded" />
              )}
            </div>
            <span className={`text-xs ${day.isToday ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
              {day.label}
            </span>
            <span className="text-xs font-medium">{day.total || ""}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayLeads, setTodayLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [s, tl, acts, rv] = await Promise.all([
        fetchStats(),
        fetchTodayLeads(),
        fetchAllActivities(),
        fetchRecentViews(5),
      ]);
      setStats(s);
      setTodayLeads(tl);
      setRecentViews(rv);
      setActivities(acts);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !stats) {
    return (
      <div className="p-4 sm:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
          </div>
          <div className="h-48 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "総リード数", value: stats.totalLeads, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "新規", value: stats.newLeads, icon: AlertCircle, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "アプローチ中", value: stats.contactingLeads, icon: Phone, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "アポ獲得", value: stats.appointmentLeads, icon: CalendarCheck, color: "text-green-600", bg: "bg-green-50" },
  ];

  const conversionRate = stats.totalLeads > 0
    ? Math.round((stats.appointmentLeads / stats.totalLeads) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((card) => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              パイプライン
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBarChart
              data={{
                new: stats.newLeads,
                contacting: stats.contactingLeads,
                contacted: stats.contactedLeads,
                appointment: stats.appointmentLeads,
                nurturing: stats.nurturingLeads,
                lost: stats.lostLeads,
              }}
              total={stats.totalLeads}
            />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex flex-col items-center justify-center h-full">
            <p className="text-sm text-gray-500 mb-1">商談化率</p>
            <p className="text-4xl font-bold text-green-600">{conversionRate}%</p>
            <p className="text-xs text-gray-400 mt-1">{stats.appointmentLeads}/{stats.totalLeads}件</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              週間アクティビティ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyActivityChartAsync activities={activities} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                今日のタスク
                <Badge variant="secondary" className="ml-1">{todayLeads.length}件</Badge>
              </CardTitle>
              <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                すべて見る <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayLeads.length === 0 ? (
              <div className="text-center py-8">
                <CalendarCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">今日のタスクはありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayLeads.map((lead) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{lead.companyName}</span>
                        <Badge className={`text-xs ${LEAD_STATUS_COLORS[lead.status]}`} variant="secondary">{LEAD_STATUS_LABELS[lead.status]}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{lead.contactName} | {lead.nextAction}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近の閲覧 */}
      <div className="mb-6">
        <RecentViewsCard views={recentViews} />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">今日の活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-4 h-4 text-green-500" />
              <div><p className="text-xs text-gray-500">架電</p><p className="text-xl font-bold">{stats.todayCalls}</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-blue-500" />
              <div><p className="text-xs text-gray-500">メール</p><p className="text-xl font-bold">{stats.todayEmails}</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Target className="w-4 h-4 text-orange-500" />
              <div><p className="text-xs text-gray-500">本日タスク</p><p className="text-xl font-bold">{stats.todayTasks}</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CalendarCheck className="w-4 h-4 text-green-500" />
              <div><p className="text-xs text-gray-500">アポ合計</p><p className="text-xl font-bold">{stats.appointmentLeads}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
