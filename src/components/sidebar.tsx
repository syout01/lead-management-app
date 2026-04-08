"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Plus,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/leads", label: "リード管理", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isConfigured, signOut } = useAuth();

  return (
    <aside className="w-60 border-r bg-white flex flex-col h-screen sticky top-0">
      {/* ロゴ */}
      <div className="p-5 border-b">
        <h1 className="text-lg font-bold text-gray-900">LeadFlow</h1>
        <p className="text-xs text-gray-500 mt-0.5">リード管理ツール</p>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="p-3 border-t space-y-2">
        <Link
          href="/leads?new=true"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          リード追加
        </Link>

        {isConfigured && user && (
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 truncate">
                {user.user_metadata?.display_name || user.email}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="ログアウト"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
