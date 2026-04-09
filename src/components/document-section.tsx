"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Link2,
  Plus,
  Eye,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import {
  TrackedDocument,
  DocumentView,
  DocumentWithStats,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/types";
import {
  fetchDocumentsByLead,
  fetchDocumentViews,
  removeDocument,
} from "@/lib/use-store";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { toast } from "sonner";

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

interface DocumentSectionProps {
  leadId: string;
}

export function DocumentSection({ leadId }: DocumentSectionProps) {
  const [documents, setDocuments] = useState<DocumentWithStats[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [expandedViews, setExpandedViews] = useState<DocumentView[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadDocuments = async () => {
    const docs = await fetchDocumentsByLead(leadId);
    const withStats: DocumentWithStats[] = await Promise.all(
      docs.map(async (doc) => {
        const views = await fetchDocumentViews(doc.id);
        return {
          ...doc,
          viewCount: views.length,
          lastViewedAt: views.length > 0 ? views[0].viewedAt : null,
          totalDuration: views.reduce((sum, v) => sum + v.duration, 0),
        };
      })
    );
    setDocuments(withStats);
  };

  useEffect(() => {
    loadDocuments();
  }, [leadId]);

  const handleCopyUrl = async (trackingId: string, docId: string) => {
    const url = `${window.location.origin}/view/${trackingId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(docId);
    toast.success("トラッキングURLをコピーしました");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExpand = async (docId: string) => {
    if (expandedDoc === docId) {
      setExpandedDoc(null);
      return;
    }
    const views = await fetchDocumentViews(docId);
    setExpandedViews(views);
    setExpandedDoc(docId);
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("この資料を削除しますか？")) return;
    await removeDocument(docId);
    await loadDocuments();
    toast.success("資料を削除しました");
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              共有ドキュメント
              <Badge variant="secondary" className="ml-1 text-xs">{documents.length}件</Badge>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              まだ資料がありません。「追加」から資料を登録してトラッキングURLを発行できます。
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg overflow-hidden">
                  {/* Document row */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className={`p-1.5 rounded ${doc.type === "pdf" ? "bg-red-50" : "bg-blue-50"} mt-0.5`}>
                          {doc.type === "pdf" ? (
                            <FileText className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5 text-blue-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {DOCUMENT_TYPE_LABELS[doc.type]}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Eye className="w-3 h-3" />
                              {doc.viewCount}回
                            </span>
                            {doc.totalDuration > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatDuration(doc.totalDuration)}
                              </span>
                            )}
                            {doc.lastViewedAt && (
                              <span className="text-xs text-gray-400">
                                最終: {timeAgo(doc.lastViewedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleCopyUrl(doc.trackingId, doc.id)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="トラッキングURLをコピー"
                        >
                          {copiedId === doc.id ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleExpand(doc.id)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="閲覧履歴を表示"
                        >
                          {expandedDoc === doc.id ? (
                            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded view events */}
                  {expandedDoc === doc.id && (
                    <div className="border-t bg-gray-50 p-3">
                      {expandedViews.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">閲覧履歴はまだありません</p>
                      ) : (
                        <div className="space-y-2">
                          {expandedViews.map((view) => (
                            <div key={view.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Eye className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-600">
                                  {new Date(view.viewedAt).toLocaleString("ja-JP")}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-500">
                                <span>{formatDuration(view.duration)}</span>
                                <span className="truncate max-w-24">{view.userAgent.split("/")[0] || "-"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        leadId={leadId}
        onSaved={loadDocuments}
      />
    </>
  );
}
