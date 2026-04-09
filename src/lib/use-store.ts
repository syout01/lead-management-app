// ========================================
// 統合データフック
// Supabase設定済み → Supabase使用
// 未設定 → localStorage使用（フォールバック）
// ========================================

import { isSupabaseConfigured } from "./supabase";
import * as local from "./store";
import * as db from "./supabase-store";
import { Company, Lead, Activity, LeadStatus, TrackedDocument, DocumentView, RecentView } from "./types";

// ========================================
// 企業
// ========================================
export async function fetchCompanies(): Promise<Company[]> {
  if (isSupabaseConfigured) return db.getCompaniesDB();
  local.seedDemoData();
  return local.getCompanies();
}

export async function fetchCompany(id: string): Promise<Company | null | undefined> {
  if (isSupabaseConfigured) return db.getCompanyDB(id);
  return local.getCompany(id);
}

export async function addCompany(
  data: Omit<Company, "id" | "createdAt">,
  userId?: string
): Promise<Company> {
  if (isSupabaseConfigured && userId) return db.createCompanyDB(data, userId);
  return local.createCompany(data);
}

export async function removeCompany(id: string): Promise<void> {
  if (isSupabaseConfigured) return db.deleteCompanyDB(id);
  local.deleteCompany(id);
}

// ========================================
// リード
// ========================================
export async function fetchLeads(): Promise<Lead[]> {
  if (isSupabaseConfigured) return db.getLeadsDB();
  local.seedDemoData();
  return local.getLeads();
}

export async function fetchLead(id: string): Promise<Lead | null | undefined> {
  if (isSupabaseConfigured) return db.getLeadDB(id);
  return local.getLead(id);
}

export async function fetchTodayLeads(): Promise<Lead[]> {
  if (isSupabaseConfigured) return db.getTodayLeadsDB();
  local.seedDemoData();
  return local.getTodayLeads();
}

export async function addLead(
  data: Omit<Lead, "id" | "createdAt" | "updatedAt">,
  userId?: string
): Promise<Lead> {
  if (isSupabaseConfigured && userId) return db.createLeadDB(data, userId);
  return local.createLead(data);
}

export async function editLead(
  id: string,
  updates: Partial<Lead>
): Promise<Lead | undefined> {
  if (isSupabaseConfigured) return db.updateLeadDB(id, updates);
  return local.updateLead(id, updates);
}

export async function removeLead(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    await db.deleteLeadDB(id);
    return;
  }
  local.deleteLead(id);
}

// ========================================
// 対応履歴
// ========================================
export async function fetchActivitiesByLead(leadId: string): Promise<Activity[]> {
  if (isSupabaseConfigured) return db.getActivitiesByLeadDB(leadId);
  return local.getActivitiesByLead(leadId);
}

export async function fetchAllActivities(): Promise<Activity[]> {
  if (isSupabaseConfigured) return db.getAllActivitiesDB();
  return local.getActivities();
}

export async function addActivity(
  data: Omit<Activity, "id" | "createdAt">,
  userId?: string
): Promise<Activity> {
  if (isSupabaseConfigured && userId) return db.createActivityDB(data, userId);
  return local.createActivity(data);
}

// ========================================
// 統計
// ========================================
export async function fetchStats() {
  if (isSupabaseConfigured) return db.getStatsDB();
  local.seedDemoData();
  return local.getStats();
}

// ========================================
// ドキュメント
// ========================================
export async function fetchDocumentsByLead(leadId: string): Promise<TrackedDocument[]> {
  if (isSupabaseConfigured) return db.getDocumentsByLeadDB(leadId);
  return local.getDocumentsByLead(leadId);
}

export async function fetchDocumentByTrackingId(trackingId: string): Promise<TrackedDocument | null | undefined> {
  if (isSupabaseConfigured) return db.getDocumentByTrackingIdDB(trackingId);
  return local.getDocumentByTrackingId(trackingId);
}

function generateTrackingId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 10; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}

export async function addDocument(
  data: Omit<TrackedDocument, "id" | "createdAt" | "trackingId">,
  userId?: string
): Promise<TrackedDocument> {
  const trackingId = generateTrackingId();
  if (isSupabaseConfigured && userId) return db.createDocumentDB(data, trackingId, userId);
  return local.createDocument(data);
}

export async function removeDocument(id: string): Promise<void> {
  if (isSupabaseConfigured) return db.deleteDocumentDB(id);
  local.deleteDocument(id);
}

// ========================================
// ドキュメント閲覧履歴
// ========================================
export async function fetchDocumentViews(documentId: string): Promise<DocumentView[]> {
  if (isSupabaseConfigured) return db.getDocumentViewsDB(documentId);
  return local.getDocumentViewsByDoc(documentId);
}

export async function addDocumentView(
  data: Omit<DocumentView, "id" | "viewedAt">
): Promise<DocumentView> {
  if (isSupabaseConfigured) return db.createDocumentViewDB(data);
  return local.createDocumentView(data);
}

export async function updateViewDuration(id: string, duration: number): Promise<void> {
  if (isSupabaseConfigured) return db.updateDocumentViewDurationDB(id, duration);
  local.updateDocumentViewDuration(id, duration);
}

export async function fetchRecentViews(limit?: number): Promise<RecentView[]> {
  if (isSupabaseConfigured) return db.getRecentDocumentViewsDB(limit);
  return local.getRecentDocumentViews(limit);
}

// ========================================
// CSV用（企業の検索/作成）
// ========================================
export async function findOrCreateCompany(
  name: string,
  phone: string,
  userId?: string
): Promise<Company> {
  const companies = await fetchCompanies();
  const found = companies.find((c) => c.name === name);
  if (found) return found;
  return addCompany(
    { name, industry: "", employeeCount: "", phone, website: "", address: "" },
    userId
  );
}
