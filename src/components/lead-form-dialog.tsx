"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead, LeadStatus, LEAD_STATUS_LABELS } from "@/lib/types";
import { addLead, editLead, findOrCreateCompany } from "@/lib/use-store";
import { useAuth } from "@/lib/auth-context";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSaved: () => void;
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
}: LeadFormDialogProps) {
  const { user } = useAuth();
  const isEdit = !!lead;

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
    status: "new" as LeadStatus,
    source: "",
    assignee: "",
    nextAction: "",
    nextActionDate: "",
    appointmentDate: "",
    note: "",
  });

  useEffect(() => {
    if (lead) {
      setForm({
        companyName: lead.companyName,
        contactName: lead.contactName,
        contactTitle: lead.contactTitle,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        status: lead.status,
        source: lead.source,
        assignee: lead.assignee,
        nextAction: lead.nextAction,
        nextActionDate: lead.nextActionDate,
        appointmentDate: lead.appointmentDate,
        note: lead.note,
      });
    } else {
      setForm({
        companyName: "",
        contactName: "",
        contactTitle: "",
        contactEmail: "",
        contactPhone: "",
        status: "new",
        source: "",
        assignee: "",
        nextAction: "",
        nextActionDate: "",
        appointmentDate: "",
        note: "",
      });
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && lead) {
      await editLead(lead.id, {
        companyName: form.companyName,
        contactName: form.contactName,
        contactTitle: form.contactTitle,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        status: form.status,
        source: form.source,
        assignee: form.assignee,
        nextAction: form.nextAction,
        nextActionDate: form.nextActionDate,
        appointmentDate: form.appointmentDate,
        note: form.note,
      });
    } else {
      const company = await findOrCreateCompany(form.companyName, form.contactPhone, user?.id);

      await addLead({
        companyId: company.id,
        companyName: form.companyName,
        contactName: form.contactName,
        contactTitle: form.contactTitle,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        status: form.status,
        source: form.source,
        assignee: form.assignee,
        nextAction: form.nextAction,
        nextActionDate: form.nextActionDate,
        appointmentDate: form.appointmentDate,
        note: form.note,
      }, user?.id);
    }

    onSaved();
    onOpenChange(false);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "リードを編集" : "新規リード追加"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* 企業情報 */}
          <div>
            <Label htmlFor="companyName">企業名 *</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="株式会社〇〇"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="contactName">担当者名 *</Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                placeholder="山田太郎"
                required
              />
            </div>
            <div>
              <Label htmlFor="contactTitle">役職</Label>
              <Input
                id="contactTitle"
                value={form.contactTitle}
                onChange={(e) => updateField("contactTitle", e.target.value)}
                placeholder="営業部長"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="contactEmail">メール</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)}
                placeholder="yamada@example.co.jp"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">電話番号</Label>
              <Input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
                placeholder="03-1234-5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="status">ステータス</Label>
              <Select
                value={form.status}
                onValueChange={(v) => v && updateField("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source">リードソース</Label>
              <Input
                id="source"
                value={form.source}
                onChange={(e) => updateField("source", e.target.value)}
                placeholder="Web問合せ / 展示会 / 紹介"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="assignee">担当者（自社）</Label>
              <Input
                id="assignee"
                value={form.assignee}
                onChange={(e) => updateField("assignee", e.target.value)}
                placeholder="山田"
              />
            </div>
            <div>
              <Label htmlFor="nextActionDate">次回アクション日</Label>
              <Input
                id="nextActionDate"
                type="date"
                value={form.nextActionDate}
                onChange={(e) => updateField("nextActionDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nextAction">次回アクション</Label>
            <Input
              id="nextAction"
              value={form.nextAction}
              onChange={(e) => updateField("nextAction", e.target.value)}
              placeholder="初回架電 / 資料送付 / ヒアリング"
            />
          </div>

          <div>
            <Label htmlFor="appointmentDate">アポ日時</Label>
            <Input
              id="appointmentDate"
              type="date"
              value={form.appointmentDate}
              onChange={(e) => updateField("appointmentDate", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="note">メモ</Label>
            <Textarea
              id="note"
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              placeholder="自由にメモを入力"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">
              {isEdit ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
