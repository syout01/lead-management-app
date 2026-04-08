"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  ArrowRight,
  Filter,
  Download,
  Upload,
} from "lucide-react";
import { fetchLeads } from "@/lib/use-store";
import {
  Lead,
  LeadStatus,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
} from "@/lib/types";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { CSVImportDialog } from "@/components/csv-import-dialog";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">読み込み中...</div>}>
      <LeadsPageContent />
    </Suspense>
  );
}

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const loadLeads = async () => {
    const data = await fetchLeads();
    setLeads(data);
  };

  useEffect(() => {
    loadLeads();
    if (searchParams.get("new") === "true") {
      setDialogOpen(true);
    }
  }, [searchParams]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      search === "" ||
      lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(search.toLowerCase()) ||
      lead.assignee.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaved = () => {
    loadLeads();
    setEditingLead(null);
    toast.success(editingLead ? "リードを更新しました" : "リードを追加しました");
  };

  const handleExport = () => {
    downloadCSV(`leads_${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("CSVをエクスポートしました");
  };

  const handleImported = () => {
    loadLeads();
    toast.success("CSVインポートが完了しました");
  };

  return (
    <div className="p-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">リード管理</h1>
          <p className="text-gray-500 text-sm mt-1">
            全{filteredLeads.length}件のリード
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            インポート
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            エクスポート
          </Button>
          <Button
            onClick={() => {
              setEditingLead(null);
              setDialogOpen(true);
            }}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            リード追加
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="企業名・担当者名・自社担当で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-48">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span>
                    {statusFilter === "all"
                      ? "すべてのステータス"
                      : LEAD_STATUS_LABELS[statusFilter as LeadStatus]}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* リード一覧テーブル */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">企業名</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>ソース</TableHead>
                <TableHead>自社担当</TableHead>
                <TableHead>次回アクション</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-gray-400"
                  >
                    リードが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="hover:text-blue-600"
                      >
                        {lead.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{lead.contactName}</p>
                        <p className="text-xs text-gray-400">
                          {lead.contactTitle}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${LEAD_STATUS_COLORS[lead.status]} text-xs`}
                        variant="secondary"
                      >
                        {LEAD_STATUS_LABELS[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {lead.source}
                    </TableCell>
                    <TableCell className="text-sm">{lead.assignee}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{lead.nextAction || "-"}</p>
                        {lead.nextActionDate && (
                          <p className="text-xs text-gray-400">
                            {lead.nextActionDate}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/leads/${lead.id}`}>
                        <ArrowRight className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 追加/編集ダイアログ */}
      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editingLead}
        onSaved={handleSaved}
      />

      {/* CSVインポートダイアログ */}
      <CSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImported={handleImported}
      />
    </div>
  );
}
