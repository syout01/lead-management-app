import { NextRequest, NextResponse } from "next/server";
import { addDocumentView, updateViewDuration, fetchDocumentByTrackingId } from "@/lib/use-store";

// POST: 閲覧記録を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingId, userAgent } = body;

    if (!trackingId) {
      return NextResponse.json({ error: "trackingId is required" }, { status: 400 });
    }

    const doc = await fetchDocumentByTrackingId(trackingId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";

    const view = await addDocumentView({
      documentId: doc.id,
      duration: 0,
      ipAddress: ip,
      userAgent: userAgent || "",
    });

    return NextResponse.json({ viewId: view.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: 閲覧時間を更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { viewId, duration } = body;

    if (!viewId || typeof duration !== "number") {
      return NextResponse.json({ error: "viewId and duration are required" }, { status: 400 });
    }

    await updateViewDuration(viewId, duration);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
