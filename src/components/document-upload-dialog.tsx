"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentType } from "@/lib/types";
import { addDocument } from "@/lib/use-store";
import { useAuth } from "@/lib/auth-context";
import { FileText, Link2, Upload } from "lucide-react";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onSaved: () => void;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  leadId,
  onSaved,
}: DocumentUploadDialogProps) {
  const { user } = useAuth();
  const [type, setType] = useState<DocumentType>("pdf");
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [fileData, setFileData] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("ファイルサイズは5MB以下にしてください");
      return;
    }

    setFileName(file.name);
    if (!title) setTitle(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (type === "url" && !externalUrl.trim()) return;

    setSubmitting(true);
    try {
      await addDocument(
        {
          leadId,
          title: title.trim(),
          type,
          filePath: "",
          fileData: type === "pdf" ? fileData : "",
          externalUrl: type === "url" ? externalUrl.trim() : "",
          createdBy: user?.user_metadata?.display_name || "自分",
        },
        user?.id
      );

      // Reset form
      setTitle("");
      setExternalUrl("");
      setFileData("");
      setFileName("");
      setType("pdf");
      onSaved();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>資料を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* タイプ選択 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("pdf")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                type === "pdf"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => setType("url")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                type === "url"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Link2 className="w-4 h-4" />
              外部URL
            </button>
          </div>

          {/* タイトル */}
          <div>
            <Label htmlFor="doc-title">タイトル</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: サービス概要資料"
              required
            />
          </div>

          {/* PDF: ファイル選択 */}
          {type === "pdf" && (
            <div>
              <Label>PDFファイル</Label>
              <div className="mt-1.5 border-2 border-dashed rounded-lg p-4 text-center">
                {fileName ? (
                  <div className="flex items-center gap-2 justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">{fileName}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">PDFをアップロード（5MB以下）</p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  style={{ position: "relative" }}
                />
              </div>
            </div>
          )}

          {/* URL: URL入力 */}
          {type === "url" && (
            <div>
              <Label htmlFor="external-url">URL</Label>
              <Input
                id="external-url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://docs.google.com/..."
                required={type === "url"}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "追加中..." : "追加してトラッキングURL発行"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
