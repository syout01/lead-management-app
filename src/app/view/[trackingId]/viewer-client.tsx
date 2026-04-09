"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchDocumentByTrackingId } from "@/lib/use-store";
import { TrackedDocument } from "@/lib/types";
import { FileText, ExternalLink, Loader2 } from "lucide-react";

export default function ViewerClient() {
  const params = useParams();
  const trackingId = params.trackingId as string;
  const [doc, setDoc] = useState<TrackedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewIdRef = useRef<string | null>(null);
  const elapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTracking = useCallback(async (document: TrackedDocument) => {
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: document.trackingId,
          userAgent: navigator.userAgent,
        }),
      });
      const data = await res.json();
      if (data.viewId) {
        viewIdRef.current = data.viewId;
      }
    } catch {
      // tracking failure is non-critical
    }

    // Start heartbeat
    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !globalThis.document.hidden;
    };
    globalThis.document.addEventListener("visibilitychange", handleVisibility);

    intervalRef.current = setInterval(async () => {
      if (isVisible) elapsedRef.current += 10;
      if (viewIdRef.current && elapsedRef.current > 0) {
        try {
          await fetch("/api/track", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              viewId: viewIdRef.current,
              duration: elapsedRef.current,
            }),
          });
        } catch {
          // ignore
        }
      }
    }, 10000);

    // Send final beacon on unload
    const handleUnload = () => {
      if (viewIdRef.current) {
        navigator.sendBeacon(
          "/api/track",
          JSON.stringify({
            viewId: viewIdRef.current,
            duration: elapsedRef.current,
          })
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      globalThis.document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function load() {
      try {
        const found = await fetchDocumentByTrackingId(trackingId);
        if (!found) {
          setError("ドキュメントが見つかりません");
          setLoading(false);
          return;
        }
        setDoc(found);
        setLoading(false);

        // Start tracking
        cleanup = await startTracking(found);

        // URL type: redirect after brief delay
        if (found.type === "url" && found.externalUrl) {
          setTimeout(() => {
            window.location.href = found.externalUrl;
          }, 1500);
        }
      } catch {
        setError("読み込みに失敗しました");
        setLoading(false);
      }
    }

    load();
    return () => {
      if (cleanup) cleanup();
    };
  }, [trackingId, startTracking]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{error || "ドキュメントが見つかりません"}</p>
        </div>
      </div>
    );
  }

  // URL redirect view
  if (doc.type === "url") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <ExternalLink className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">{doc.title}</p>
          <p className="text-gray-500 text-sm mb-4">リダイレクト中...</p>
          <a
            href={doc.externalUrl}
            className="text-blue-600 hover:underline text-sm"
          >
            自動で遷移しない場合はこちら
          </a>
        </div>
      </div>
    );
  }

  // PDF viewer
  const pdfSrc = doc.fileData
    ? doc.fileData // base64 data URL (localStorage)
    : doc.filePath; // Supabase Storage URL

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <h1 className="text-sm font-medium text-gray-800 truncate">{doc.title}</h1>
      </div>

      {/* PDF Embed */}
      <div className="flex-1">
        {pdfSrc ? (
          <iframe
            src={pdfSrc}
            className="w-full h-[calc(100vh-52px)]"
            title={doc.title}
          />
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-52px)]">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">PDFのプレビューは利用できません</p>
              <p className="text-gray-400 text-sm mt-1">デモモードではPDFファイルは保存されません</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
