// ========================================
// ローカルストレージベースのデータストア
// Phase 1ではSupabaseの代わりにlocalStorageで動作
// ========================================

import { Company, Lead, Activity, LeadStatus, ActivityType } from "./types";

const STORAGE_KEYS = {
  companies: "lm_companies",
  leads: "lm_leads",
  activities: "lm_activities",
};

// ========================================
// ユーティリティ
// ========================================
function generateId(): string {
  return crypto.randomUUID();
}

function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ========================================
// 企業（Company）操作
// ========================================
export function getCompanies(): Company[] {
  return getFromStorage<Company>(STORAGE_KEYS.companies);
}

export function getCompany(id: string): Company | undefined {
  return getCompanies().find((c) => c.id === id);
}

export function createCompany(data: Omit<Company, "id" | "createdAt">): Company {
  const companies = getCompanies();
  const company: Company = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  companies.push(company);
  saveToStorage(STORAGE_KEYS.companies, companies);
  return company;
}

export function updateCompany(id: string, data: Partial<Company>): Company | undefined {
  const companies = getCompanies();
  const index = companies.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  companies[index] = { ...companies[index], ...data };
  saveToStorage(STORAGE_KEYS.companies, companies);
  return companies[index];
}

export function deleteCompany(id: string): boolean {
  const companies = getCompanies();
  const filtered = companies.filter((c) => c.id !== id);
  if (filtered.length === companies.length) return false;
  saveToStorage(STORAGE_KEYS.companies, filtered);
  // 関連するリードも削除
  const leads = getLeads().filter((l) => l.companyId !== id);
  saveToStorage(STORAGE_KEYS.leads, leads);
  return true;
}

// ========================================
// リード（Lead）操作
// ========================================
export function getLeads(): Lead[] {
  return getFromStorage<Lead>(STORAGE_KEYS.leads);
}

export function getLead(id: string): Lead | undefined {
  return getLeads().find((l) => l.id === id);
}

export function getLeadsByCompany(companyId: string): Lead[] {
  return getLeads().filter((l) => l.companyId === companyId);
}

export function getLeadsByStatus(status: LeadStatus): Lead[] {
  return getLeads().filter((l) => l.status === status);
}

export function getTodayLeads(): Lead[] {
  const today = new Date().toISOString().split("T")[0];
  return getLeads().filter(
    (l) => l.nextActionDate && l.nextActionDate <= today && l.status !== "lost" && l.status !== "appointment"
  );
}

export function createLead(data: Omit<Lead, "id" | "createdAt" | "updatedAt">): Lead {
  const leads = getLeads();
  const now = new Date().toISOString();
  const lead: Lead = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  leads.push(lead);
  saveToStorage(STORAGE_KEYS.leads, leads);
  return lead;
}

export function updateLead(id: string, data: Partial<Lead>): Lead | undefined {
  const leads = getLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return undefined;
  leads[index] = { ...leads[index], ...data, updatedAt: new Date().toISOString() };
  saveToStorage(STORAGE_KEYS.leads, leads);
  return leads[index];
}

export function deleteLead(id: string): boolean {
  const leads = getLeads();
  const filtered = leads.filter((l) => l.id !== id);
  if (filtered.length === leads.length) return false;
  saveToStorage(STORAGE_KEYS.leads, filtered);
  // 関連するアクティビティも削除
  const activities = getActivities().filter((a) => a.leadId !== id);
  saveToStorage(STORAGE_KEYS.activities, activities);
  return true;
}

// ========================================
// 対応履歴（Activity）操作
// ========================================
export function getActivities(): Activity[] {
  return getFromStorage<Activity>(STORAGE_KEYS.activities);
}

export function getActivitiesByLead(leadId: string): Activity[] {
  return getActivities()
    .filter((a) => a.leadId === leadId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createActivity(data: Omit<Activity, "id" | "createdAt">): Activity {
  const activities = getActivities();
  const activity: Activity = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  activities.push(activity);
  saveToStorage(STORAGE_KEYS.activities, activities);
  return activity;
}

// ========================================
// 統計
// ========================================
export function getStats() {
  const leads = getLeads();
  const today = new Date().toISOString().split("T")[0];
  const todayActivities = getActivities().filter(
    (a) => a.createdAt.split("T")[0] === today
  );

  return {
    totalLeads: leads.length,
    newLeads: leads.filter((l) => l.status === "new").length,
    contactingLeads: leads.filter((l) => l.status === "contacting").length,
    contactedLeads: leads.filter((l) => l.status === "contacted").length,
    appointmentLeads: leads.filter((l) => l.status === "appointment").length,
    nurturingLeads: leads.filter((l) => l.status === "nurturing").length,
    lostLeads: leads.filter((l) => l.status === "lost").length,
    todayTasks: getTodayLeads().length,
    todayCalls: todayActivities.filter((a) => a.type === "call").length,
    todayEmails: todayActivities.filter((a) => a.type === "email").length,
  };
}

// ========================================
// デモデータ投入
// ========================================
export function seedDemoData(): void {
  if (getCompanies().length > 0) return; // 既にデータがある場合はスキップ

  const companies: Omit<Company, "id" | "createdAt">[] = [
    { name: "株式会社テックイノベーション", industry: "IT・通信", employeeCount: "50-100名", phone: "03-1234-5678", website: "https://techinnovation.co.jp", address: "東京都渋谷区" },
    { name: "グローバルメディア株式会社", industry: "メディア・広告", employeeCount: "100-300名", phone: "03-2345-6789", website: "https://globalmedia.co.jp", address: "東京都港区" },
    { name: "フューチャーロジスティクス株式会社", industry: "物流・運輸", employeeCount: "300-500名", phone: "06-3456-7890", website: "https://futurelogistics.co.jp", address: "大阪府大阪市" },
    { name: "スマートヘルスケア株式会社", industry: "医療・ヘルスケア", employeeCount: "30-50名", phone: "045-4567-8901", website: "https://smarthealthcare.co.jp", address: "神奈川県横浜市" },
    { name: "エコソリューションズ株式会社", industry: "環境・エネルギー", employeeCount: "10-30名", phone: "052-5678-9012", website: "https://ecosolutions.co.jp", address: "愛知県名古屋市" },
    { name: "デジタルマーケティングラボ株式会社", industry: "マーケティング", employeeCount: "10-30名", phone: "03-6789-0123", website: "https://dmlab.co.jp", address: "東京都新宿区" },
  ];

  const createdCompanies = companies.map((c) => createCompany(c));

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const leadsData: Omit<Lead, "id" | "createdAt" | "updatedAt">[] = [
    { companyId: createdCompanies[0].id, companyName: createdCompanies[0].name, contactName: "田中太郎", contactTitle: "営業部長", contactEmail: "tanaka@techinnovation.co.jp", contactPhone: "03-1234-5678", status: "new", source: "Web問合せ", assignee: "山田", nextAction: "初回架電", nextActionDate: fmt(today), appointmentDate: "", note: "DX推進に興味あり" },
    { companyId: createdCompanies[1].id, companyName: createdCompanies[1].name, contactName: "佐藤花子", contactTitle: "マーケティング部 課長", contactEmail: "sato@globalmedia.co.jp", contactPhone: "03-2345-6789", status: "contacting", source: "展示会", assignee: "山田", nextAction: "資料送付後フォロー", nextActionDate: fmt(today), appointmentDate: "", note: "3月の展示会で名刺交換" },
    { companyId: createdCompanies[2].id, companyName: createdCompanies[2].name, contactName: "鈴木一郎", contactTitle: "経営企画室長", contactEmail: "suzuki@futurelogistics.co.jp", contactPhone: "06-3456-7890", status: "contacted", source: "紹介", assignee: "田村", nextAction: "提案書送付", nextActionDate: fmt(tomorrow), appointmentDate: "", note: "物流DXの課題あり。来期予算で検討中" },
    { companyId: createdCompanies[3].id, companyName: createdCompanies[3].name, contactName: "高橋美咲", contactTitle: "代表取締役", contactEmail: "takahashi@smarthealthcare.co.jp", contactPhone: "045-4567-8901", status: "appointment", source: "Web問合せ", assignee: "山田", nextAction: "商談準備", nextActionDate: fmt(tomorrow), appointmentDate: fmt(nextWeek), note: "オンライン商談予定" },
    { companyId: createdCompanies[4].id, companyName: createdCompanies[4].name, contactName: "伊藤健二", contactTitle: "総務部長", contactEmail: "ito@ecosolutions.co.jp", contactPhone: "052-5678-9012", status: "nurturing", source: "セミナー", assignee: "田村", nextAction: "メルマガ配信後フォロー", nextActionDate: fmt(nextWeek), appointmentDate: "", note: "今すぐではないが来期検討予定" },
    { companyId: createdCompanies[5].id, companyName: createdCompanies[5].name, contactName: "渡辺直樹", contactTitle: "CEO", contactEmail: "watanabe@dmlab.co.jp", contactPhone: "03-6789-0123", status: "lost", source: "Web問合せ", assignee: "山田", nextAction: "", nextActionDate: "", appointmentDate: "", note: "競合に決定。半年後に再アプローチ" },
    { companyId: createdCompanies[0].id, companyName: createdCompanies[0].name, contactName: "中村優子", contactTitle: "情報システム部", contactEmail: "nakamura@techinnovation.co.jp", contactPhone: "03-1234-5679", status: "contacting", source: "Web問合せ", assignee: "田村", nextAction: "ヒアリング架電", nextActionDate: fmt(today), appointmentDate: "", note: "田中部長から紹介" },
  ];

  const createdLeads = leadsData.map((l) => createLead(l));

  // 対応履歴のデモデータ
  const activitiesData: Omit<Activity, "id" | "createdAt">[] = [
    { leadId: createdLeads[1].id, type: "call", content: "初回架電。サービス概要を説明", result: "資料送付の了承を得た", createdBy: "山田" },
    { leadId: createdLeads[1].id, type: "email", content: "サービス資料を送付", result: "送付完了", createdBy: "山田" },
    { leadId: createdLeads[2].id, type: "call", content: "紹介元の佐々木さん経由で架電", result: "課題ヒアリング完了。提案書を希望", createdBy: "田村" },
    { leadId: createdLeads[3].id, type: "call", content: "Web問合せ受領後、即架電", result: "アポ獲得。来週オンライン商談", createdBy: "山田" },
    { leadId: createdLeads[4].id, type: "call", content: "セミナー後フォロー架電", result: "来期検討予定。定期的な情報提供を希望", createdBy: "田村" },
    { leadId: createdLeads[5].id, type: "call", content: "提案書送付後フォロー", result: "競合に決定とのこと", createdBy: "山田" },
  ];

  activitiesData.forEach((a) => createActivity(a));
}
