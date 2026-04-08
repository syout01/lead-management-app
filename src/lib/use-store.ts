// ========================================
// 統合データフック
// Supabase設定済み → Supabase使用
// 未設定 → localStorage使用（フォールバック）
// ========================================

import { isSupabaseConfigured } from "./supabase";
import * as local from "./store";
import * as db from "./supabase-store";
import { Company, Lead, Activity, LeadStatus } from "./types";

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
