// ========================================
// Supabase版データストア
// localStorageの代わりにSupabaseを使用
// ========================================

import { supabase } from "./supabase";
import { Company, Lead, Activity, LeadStatus, ActivityType, TrackedDocument, DocumentView, DocumentType, RecentView } from "./types";

// ========================================
// 企業（Company）操作
// ========================================
export async function getCompaniesDB(): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCompany);
}

export async function getCompanyDB(id: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapCompany(data);
}

export async function createCompanyDB(
  company: Omit<Company, "id" | "createdAt">,
  userId: string
): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: company.name,
      industry: company.industry,
      employee_count: company.employeeCount,
      phone: company.phone,
      website: company.website,
      address: company.address,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCompany(data);
}

export async function deleteCompanyDB(id: string): Promise<void> {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

// ========================================
// リード（Lead）操作
// ========================================
export async function getLeadsDB(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapLead);
}

export async function getLeadDB(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapLead(data);
}

export async function getLeadsByStatusDB(status: LeadStatus): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapLead);
}

export async function getTodayLeadsDB(): Promise<Lead[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .lte("next_action_date", today)
    .not("status", "in", '("lost","appointment")')
    .order("next_action_date", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapLead);
}

export async function createLeadDB(
  lead: Omit<Lead, "id" | "createdAt" | "updatedAt">,
  userId: string
): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      company_id: lead.companyId,
      company_name: lead.companyName,
      contact_name: lead.contactName,
      contact_title: lead.contactTitle,
      contact_email: lead.contactEmail,
      contact_phone: lead.contactPhone,
      status: lead.status,
      source: lead.source,
      assignee: lead.assignee,
      next_action: lead.nextAction,
      next_action_date: lead.nextActionDate || null,
      appointment_date: lead.appointmentDate || null,
      note: lead.note,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapLead(data);
}

export async function updateLeadDB(
  id: string,
  updates: Partial<Lead>
): Promise<Lead> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
  if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
  if (updates.contactTitle !== undefined) dbUpdates.contact_title = updates.contactTitle;
  if (updates.contactEmail !== undefined) dbUpdates.contact_email = updates.contactEmail;
  if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.source !== undefined) dbUpdates.source = updates.source;
  if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
  if (updates.nextAction !== undefined) dbUpdates.next_action = updates.nextAction;
  if (updates.nextActionDate !== undefined) dbUpdates.next_action_date = updates.nextActionDate || null;
  if (updates.appointmentDate !== undefined) dbUpdates.appointment_date = updates.appointmentDate || null;
  if (updates.note !== undefined) dbUpdates.note = updates.note;

  const { data, error } = await supabase
    .from("leads")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapLead(data);
}

export async function deleteLeadDB(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}

// ========================================
// 対応履歴（Activity）操作
// ========================================
export async function getActivitiesByLeadDB(leadId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapActivity);
}

export async function getAllActivitiesDB(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapActivity);
}

export async function createActivityDB(
  activity: Omit<Activity, "id" | "createdAt">,
  userId: string
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      lead_id: activity.leadId,
      type: activity.type,
      content: activity.content,
      result: activity.result,
      created_by: userId,
      created_by_name: activity.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return mapActivity(data);
}

// ========================================
// 統計
// ========================================
export async function getStatsDB() {
  const leads = await getLeadsDB();
  const today = new Date().toISOString().split("T")[0];
  const allActivities = await getAllActivitiesDB();
  const todayActivities = allActivities.filter(
    (a) => a.createdAt.split("T")[0] === today
  );
  const todayLeads = leads.filter(
    (l) => l.nextActionDate && l.nextActionDate <= today && l.status !== "lost" && l.status !== "appointment"
  );

  return {
    totalLeads: leads.length,
    newLeads: leads.filter((l) => l.status === "new").length,
    contactingLeads: leads.filter((l) => l.status === "contacting").length,
    contactedLeads: leads.filter((l) => l.status === "contacted").length,
    appointmentLeads: leads.filter((l) => l.status === "appointment").length,
    nurturingLeads: leads.filter((l) => l.status === "nurturing").length,
    lostLeads: leads.filter((l) => l.status === "lost").length,
    todayTasks: todayLeads.length,
    todayCalls: todayActivities.filter((a) => a.type === "call").length,
    todayEmails: todayActivities.filter((a) => a.type === "email").length,
  };
}

// ========================================
// ドキュメント（TrackedDocument）操作
// ========================================
export async function getDocumentsByLeadDB(leadId: string): Promise<TrackedDocument[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDocument);
}

export async function getDocumentByTrackingIdDB(trackingId: string): Promise<TrackedDocument | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("tracking_id", trackingId)
    .single();
  if (error) return null;
  return mapDocument(data);
}

export async function createDocumentDB(
  doc: Omit<TrackedDocument, "id" | "createdAt" | "trackingId">,
  trackingId: string,
  userId: string
): Promise<TrackedDocument> {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      lead_id: doc.leadId,
      title: doc.title,
      type: doc.type,
      file_path: doc.filePath,
      external_url: doc.externalUrl,
      tracking_id: trackingId,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapDocument(data);
}

export async function deleteDocumentDB(id: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

// ========================================
// ドキュメント閲覧履歴（DocumentView）操作
// ========================================
export async function getDocumentViewsDB(documentId: string): Promise<DocumentView[]> {
  const { data, error } = await supabase
    .from("document_views")
    .select("*")
    .eq("document_id", documentId)
    .order("viewed_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDocumentView);
}

export async function createDocumentViewDB(
  view: Omit<DocumentView, "id" | "viewedAt">
): Promise<DocumentView> {
  const { data, error } = await supabase
    .from("document_views")
    .insert({
      document_id: view.documentId,
      duration: view.duration,
      ip_address: view.ipAddress,
      user_agent: view.userAgent,
    })
    .select()
    .single();
  if (error) throw error;
  return mapDocumentView(data);
}

export async function updateDocumentViewDurationDB(id: string, duration: number): Promise<void> {
  const { error } = await supabase
    .from("document_views")
    .update({ duration })
    .eq("id", id);
  if (error) throw error;
}

export async function getRecentDocumentViewsDB(limit: number = 10): Promise<RecentView[]> {
  const { data, error } = await supabase
    .from("document_views")
    .select("*, documents(id, title, lead_id, leads(company_name))")
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    documentId: row.document_id,
    documentTitle: row.documents?.title || "",
    leadId: row.documents?.lead_id || "",
    leadCompanyName: row.documents?.leads?.company_name || "",
    viewedAt: row.viewed_at,
    duration: row.duration,
  })).filter((v: RecentView) => v.leadId !== "");
}

// ========================================
// DBレコード → フロントエンド型のマッピング
// ========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry || "",
    employeeCount: row.employee_count || "",
    phone: row.phone || "",
    website: row.website || "",
    address: row.address || "",
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLead(row: any): Lead {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactTitle: row.contact_title || "",
    contactEmail: row.contact_email || "",
    contactPhone: row.contact_phone || "",
    status: row.status as LeadStatus,
    source: row.source || "",
    assignee: row.assignee || "",
    nextAction: row.next_action || "",
    nextActionDate: row.next_action_date || "",
    appointmentDate: row.appointment_date || "",
    note: row.note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapActivity(row: any): Activity {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type as ActivityType,
    content: row.content,
    result: row.result || "",
    createdAt: row.created_at,
    createdBy: row.created_by_name || "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDocument(row: any): TrackedDocument {
  return {
    id: row.id,
    leadId: row.lead_id,
    title: row.title,
    type: row.type as DocumentType,
    filePath: row.file_path || "",
    fileData: "",
    externalUrl: row.external_url || "",
    trackingId: row.tracking_id,
    createdBy: row.created_by || "",
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDocumentView(row: any): DocumentView {
  return {
    id: row.id,
    documentId: row.document_id,
    viewedAt: row.viewed_at,
    duration: row.duration || 0,
    ipAddress: row.ip_address || "",
    userAgent: row.user_agent || "",
  };
}
