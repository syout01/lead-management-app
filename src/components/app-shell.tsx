"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Sidebar } from "./sidebar";
import { ReactNode } from "react";

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isConfigured } = useAuth();

  // 認証ページではサイドバーを表示しない
  const isAuthPage = pathname === "/auth";

  // Supabase設定済み & 未ログイン & 認証ページでない → 認証ページへリダイレクト
  if (isConfigured && !loading && !user && !isAuthPage) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
    return <div className="p-8 text-gray-500">リダイレクト中...</div>;
  }

  if (isAuthPage) {
    return <div className="flex-1">{children}</div>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">{children}</main>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}
