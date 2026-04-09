"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, ArrowRight, FileText } from "lucide-react";
import { RecentView } from "@/lib/types";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}分${sec}秒` : `${min}分`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "たった今";
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}

interface RecentViewsCardProps {
  views: RecentView[];
}

export function RecentViewsCard({ views }: RecentViewsCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-500" />
          最近の閲覧
          {views.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{views.length}件</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {views.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">まだ閲覧データがありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {views.map((view, index) => (
              <Link
                key={`${view.documentId}-${index}`}
                href={`/leads/${view.leadId}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-1.5 rounded bg-indigo-50 mt-0.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {view.leadCompanyName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      「{view.documentTitle}」を閲覧
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{timeAgo(view.viewedAt)}</span>
                      {view.duration > 0 && (
                        <>
                          <span>|</span>
                          <span>{formatDuration(view.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
