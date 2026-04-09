"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Clock,
  Edit,
  Trash2,
  MessageSquare,
} from "lucide-react";
import {
  fetchLead,
  editLead,
  removeLead,
  fetchActivitiesByLead,
} from "@/lib/use-store";
import {
  Lead,
  Activity,
  LeadStatus,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/types";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { ActivityForm } from "@/components/activity-form";
import { DocumentSection } from "@/components/document-section";
import { toast } from "sonner";

export default function LeadDetailClient() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const loadData = async () => {
    const id = params.id as string;
    const foundLead = await fetchLead(id);
    if (foundLead) {
      setLead(foundLead);
      const acts = await fetchActivitiesByLead(id);
      setActivities(acts);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    if (!lead) return;
    await editLead(lead.id, { status: newStatus as LeadStatus });
    await loadData();
    toast.success(`ステータスを「${LEAD_STATUS_LABELS[newStatus as LeadStatus]}」に変更しました`);
  };

  const handleDelete = async () => {
    if (!lead) return;
    if (window.confirm("このリードを削除しますか？")) {
      await removeLead(lead.id);
      toast.success("リードを削除しました");
      router.push("/leads");
    }
  };

  const handleActivitySaved = () => {
    loadData();
    toast.success("対応履歴を記録しました");
  };

  const handleLeadSaved = () => {
    loadData();
    toast.success("リード情報を更新しました");
  };

  if (!lead) {
    return (
      <div className="p-8 text-gray-500">
        <p>読み込み中...</p>
        <Link href="/leads" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          リード一覧に戻る
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP") + " " + d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lead.companyName}</h1>
            <p className="text-sm text-gray-500">{lead.contactName} / {lead.contactTitle || "役職未設定"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="gap-1">
            <Edit className="w-3 h-3" />編集
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="w-3 h-3" />削除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">ステータス：</span>
                <Select value={lead.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-48">
                    <Badge className={`${LEAD_STATUS_COLORS[lead.status]} text-xs`} variant="secondary">
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 共有ドキュメント */}
          <DocumentSection leadId={lead.id} />

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />対応を記録
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityForm leadId={lead.id} onSaved={handleActivitySaved} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />対応履歴
                <Badge variant="secondary" className="ml-1 text-xs">{activities.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">対応履歴はまだありません</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            activity.type === "call" ? "bg-green-100 text-green-700"
                            : activity.type === "email" ? "bg-blue-100 text-blue-700"
                            : activity.type === "meeting" ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                          }`}>
                            {ACTIVITY_TYPE_LABELS[activity.type].charAt(0)}
                          </div>
                          {index < activities.length - 1 && <div className="w-px h-full bg-gray-200 mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">{ACTIVITY_TYPE_LABELS[activity.type]}</Badge>
                            <span className="text-xs text-gray-400">{formatDateTime(activity.createdAt)}</span>
                            <span className="text-xs text-gray-400">by {activity.createdBy}</span>
                          </div>
                          <p className="text-sm text-gray-700">{activity.content}</p>
                          {activity.result && <p className="text-sm text-gray-500 mt-1">→ {activity.result}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600">連絡先</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div><p className="font-medium">{lead.contactName}</p><p className="text-gray-500 text-xs">{lead.contactTitle}</p></div>
              </div>
              {lead.contactEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${lead.contactEmail}`} className="text-blue-600 hover:underline truncate">{lead.contactEmail}</a>
                </div>
              )}
              {lead.contactPhone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${lead.contactPhone}`} className="text-blue-600 hover:underline">{lead.contactPhone}</a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{lead.companyName}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600">詳細情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">リードソース</span><span className="font-medium">{lead.source || "-"}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-gray-500">自社担当</span><span className="font-medium">{lead.assignee || "-"}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-gray-500">次回アクション</span><span className="font-medium">{lead.nextAction || "-"}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-gray-500">次回アクション日</span><span className="font-medium">{formatDate(lead.nextActionDate)}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-gray-500">アポ日</span><span className="font-medium">{formatDate(lead.appointmentDate)}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-gray-500">作成日</span><span className="font-medium">{formatDate(lead.createdAt)}</span></div>
            </CardContent>
          </Card>

          {lead.note && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600">メモ</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.note}</p></CardContent>
            </Card>
          )}
        </div>
      </div>

      <LeadFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} lead={lead} onSaved={handleLeadSaved} />
    </div>
  );
}
