// ========================================
// リード管理アプリ 型定義
// ========================================

// リードのステータス
export type LeadStatus =
  | "new"           // 新規
  | "contacting"    // アプローチ中
  | "contacted"     // 接触済み
  | "appointment"   // アポ獲得
  | "nurturing"     // ナーチャリング
  | "lost";         // 失注

// リードのステータスラベル（日本語）
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "新規",
  contacting: "アプローチ中",
  contacted: "接触済み",
  appointment: "アポ獲得",
  nurturing: "ナーチャリング",
  lost: "失注",
};

// リードのステータスカラー
export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacting: "bg-yellow-100 text-yellow-800",
  contacted: "bg-purple-100 text-purple-800",
  appointment: "bg-green-100 text-green-800",
  nurturing: "bg-orange-100 text-orange-800",
  lost: "bg-gray-100 text-gray-500",
};

// 対応種別
export type ActivityType = "call" | "email" | "meeting" | "other";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: "架電",
  email: "メール",
  meeting: "商談",
  other: "その他",
};

// 企業情報（リスト管理）
export interface Company {
  id: string;
  name: string;             // 企業名
  industry: string;         // 業界
  employeeCount: string;    // 従業員規模
  phone: string;            // 電話番号
  website: string;          // Webサイト
  address: string;          // 住所
  createdAt: string;
}

// リード情報
export interface Lead {
  id: string;
  companyId: string;
  companyName: string;      // 企業名（表示用）
  contactName: string;      // 担当者名
  contactTitle: string;     // 担当者役職
  contactEmail: string;     // メール
  contactPhone: string;     // 電話番号
  status: LeadStatus;
  source: string;           // リードソース（Web問合せ、展示会など）
  assignee: string;         // 担当者（自社）
  nextAction: string;       // 次回アクション
  nextActionDate: string;   // 次回アクション日
  appointmentDate: string;  // アポ日時
  note: string;             // メモ
  createdAt: string;
  updatedAt: string;
}

// 対応履歴
export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  content: string;          // 対応内容
  result: string;           // 結果
  createdAt: string;
  createdBy: string;        // 記録者
}
