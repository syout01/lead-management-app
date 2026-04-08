"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { importLeadsFromCSV, ImportResult } from "@/lib/csv";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function CSVImportDialog({
  open,
  onOpenChange,
  onImported,
}: CSVImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const importResult = importLeadsFromCSV(text);
      setResult(importResult);
      if (importResult.success > 0) {
        onImported();
      }
    } catch {
      setResult({ success: 0, errors: ["ファイルの読み込みに失敗しました"] });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClose = () => {
    setFileName(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>CSVインポート</DialogTitle>
          <DialogDescription>
            スプレッドシートからエクスポートしたCSVファイルを取り込みます
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            {/* ドロップゾーン */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">
                {loading
                  ? "読み込み中..."
                  : fileName
                  ? fileName
                  : "CSVファイルをドロップ、またはクリックして選択"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                .csv ファイルに対応
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />

            {/* CSVフォーマット */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">
                  CSVフォーマット
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                1行目: 企業名, 担当者名, 役職, メール, 電話番号, ステータス,
                リードソース, 自社担当, 次回アクション, 次回アクション日, アポ日,
                メモ
              </p>
            </div>
          </>
        ) : (
          /* 結果表示 */
          <div className="space-y-4">
            {result.success > 0 && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {result.success}件のリードをインポートしました
                  </p>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    エラー ({result.errors.length}件)
                  </span>
                </div>
                <ul className="text-xs text-red-600 space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>... 他{result.errors.length - 5}件</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>閉じる</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
