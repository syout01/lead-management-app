"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Target,
  FileText,
  BarChart3,
  Clock,
  Eye,
  Zap,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  X,
  Check,
  Users,
  Send,
} from "lucide-react";

export default function LandingPage() {
  const [formData, setFormData] = useState({ company: "", name: "", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.name || !formData.email) return;
    setSubmitting(true);
    setError("");

    try {
      if (isSupabaseConfigured) {
        // 1. signupsテーブルに登録情報を保存
        await supabase.from("signups").insert({
          company: formData.company,
          name: formData.name,
          email: formData.email,
        });

        // 2. Supabase Authでアカウントを自動作成
        const tempPassword = crypto.randomUUID().slice(0, 12);
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            data: {
              display_name: formData.name,
              company: formData.company,
            },
          },
        });

        if (signUpError) {
          // 既にアカウントがある場合は無視
          if (!signUpError.message.includes("already registered")) {
            setError("登録に失敗しました。もう一度お試しください。");
            return;
          }
        }
      } else {
        // localStorageに保存（デモ用）
        const signups = JSON.parse(localStorage.getItem("lm_signups") || "[]");
        signups.push({ ...formData, createdAt: new Date().toISOString() });
        localStorage.setItem("lm_signups", JSON.stringify(signups));
      }

      setSubmitted(true);
    } catch {
      setError("登録に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ナビ */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">LeadFlow</span>
          </div>
          <a
            href="#signup"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            無料で始める
          </a>
        </div>
      </nav>

      {/* ========== ヒーローセクション ========== */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            完全無料で今すぐ使える
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            スプレッドシートでの<br className="hidden sm:block" />
            リード管理、もう限界では？
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            LeadFlowは、インサイドセールス現場のために作られた
            シンプルなリード管理ツール。資料の閲覧トラッキング付きで、
            最適なタイミングでアプローチできます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#signup"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              無料で始める
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl text-base font-semibold hover:bg-gray-200 transition-colors"
            >
              デモを体験
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 課題提起 ========== */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            こんな課題、ありませんか？
          </h2>
          <p className="text-gray-500 text-center mb-12">
            インサイドセールスの現場で毎日起きている問題
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "リスト管理に時間がかかりすぎる",
                desc: "スプレッドシートの更新や共有が手間。忙しいと誰も見なくなり、重複架電や対応漏れが発生。",
                color: "text-orange-500",
                bg: "bg-orange-50",
              },
              {
                icon: Eye,
                title: "資料を送った後が見えない",
                desc: "「資料送りました」の後、見てるのか見てないのかわからない。フォローのタイミングを逃す。",
                color: "text-purple-500",
                bg: "bg-purple-50",
              },
              {
                icon: BarChart3,
                title: "活動の成果が可視化できない",
                desc: "架電数やアポ率を手動で集計。どの行動が商談に繋がったか分析できず、改善が進まない。",
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 機能紹介 ========== */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            LeadFlowでできること
          </h2>
          <p className="text-gray-500 text-center mb-12">
            必要な機能だけ。シンプルだから、現場で使われる。
          </p>
          <div className="space-y-16">
            {[
              {
                icon: Target,
                label: "リード管理",
                title: "リードの状態が一目でわかる",
                desc: "新規→アプローチ中→アポ獲得まで、ワンクリックでステータス更新。「今日誰に連絡すべきか」が自動で表示されます。CSVインポートでスプレッドシートからの移行も簡単。",
                color: "bg-blue-600",
              },
              {
                icon: FileText,
                label: "資料トラッキング",
                title: "「いつ・何秒見たか」がわかる",
                desc: "PDFや外部URLにトラッキングURLを発行。リードが資料を開くと、閲覧日時・滞在時間を自動記録。資料を見た直後の「ホットな瞬間」にアプローチできます。",
                color: "bg-indigo-600",
              },
              {
                icon: BarChart3,
                label: "ダッシュボード",
                title: "チームの活動を即座に把握",
                desc: "パイプラインの状況、今日のタスク、商談化率、最近の閲覧状況をリアルタイムで可視化。日報作成の手間もゼロに。",
                color: "bg-green-600",
              },
            ].map((item, i) => (
              <div key={i} className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center`}>
                <div className="flex-1">
                  <div className={`inline-flex items-center gap-2 ${item.color} text-white px-3 py-1 rounded-full text-xs font-medium mb-4`}>
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex-1 w-full">
                  <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center min-h-48">
                    <item.icon className="w-20 h-20 text-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 比較セクション ========== */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            他のツールとの違い
          </h2>
          <p className="text-gray-500 text-center mb-12">
            「ちょうどいい」を目指しました
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-500 w-40"></th>
                    <th className="p-4 font-medium text-gray-400">スプレッドシート</th>
                    <th className="p-4 font-medium text-gray-400">Salesforce等</th>
                    <th className="p-4 font-bold text-blue-600 bg-blue-50/50">LeadFlow</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "月額費用", vals: ["無料", "¥3,000〜/人", "無料"] },
                    { label: "導入の手軽さ", vals: ["easy", "hard", "easy"] },
                    { label: "リード管理", vals: ["partial", "yes", "yes"] },
                    { label: "資料トラッキング", vals: ["no", "no", "yes"] },
                    { label: "閲覧通知", vals: ["no", "no", "yes"] },
                    { label: "チーム共有", vals: ["partial", "yes", "yes"] },
                    { label: "学習コスト", vals: ["low", "high", "low"] },
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-4 font-medium text-gray-700">{row.label}</td>
                      {row.vals.map((val, j) => (
                        <td key={j} className={`p-4 text-center ${j === 2 ? "bg-blue-50/50 font-medium" : ""}`}>
                          {val === "yes" ? <Check className="w-5 h-5 text-green-500 mx-auto" /> :
                           val === "no" ? <X className="w-5 h-5 text-gray-300 mx-auto" /> :
                           val === "easy" ? <span className="text-green-600">簡単</span> :
                           val === "hard" ? <span className="text-red-500">複雑</span> :
                           val === "partial" ? <span className="text-yellow-600">△</span> :
                           val === "low" ? <span className="text-green-600">低い</span> :
                           val === "high" ? <span className="text-red-500">高い</span> :
                           <span className={j === 2 ? "text-blue-600 font-bold" : ""}>{val}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 導入の流れ ========== */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            3ステップで始められます
          </h2>
          <p className="text-gray-500 text-center mb-12">
            面倒な設定は一切なし
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "無料登録", desc: "会社名・お名前・メールアドレスを入力するだけ。クレジットカードは不要です。", icon: Users },
              { step: "02", title: "リストをインポート", desc: "既存のスプレッドシートをCSVでアップロード。データがそのまま移行できます。", icon: FileText },
              { step: "03", title: "運用開始", desc: "すぐにリード管理と資料トラッキングが使えます。チームメンバーの招待も可能。", icon: Zap },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-blue-600 mb-2">STEP {item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA / 申し込みフォーム ========== */}
      <section id="signup" className="py-20 px-4 sm:px-6 bg-gradient-to-b from-blue-600 to-blue-700">
        <div className="max-w-lg mx-auto">
          {submitted ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">ありがとうございます！</h3>
              <p className="text-gray-500 mb-6">
                登録が完了しました。今すぐLeadFlowをお使いいただけます。
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                ダッシュボードを開く
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  無料で始める
                </h2>
                <p className="text-blue-100">
                  クレジットカード不要。30秒で登録完了。
                </p>
              </div>
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">会社名</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="株式会社○○"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">お名前</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="山田太郎"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="yamada@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "送信中..." : (
                    <>
                      <Send className="w-4 h-4" />
                      無料で始める
                    </>
                  )}
                </button>
                {error && (
                  <p className="text-sm text-red-600 text-center">{error}</p>
                )}
                <p className="text-xs text-gray-400 text-center">
                  登録後すぐにご利用いただけます。料金は一切かかりません。
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ========== フッター ========== */}
      <footer className="py-8 px-4 sm:px-6 border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">LeadFlow</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} LeadFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
