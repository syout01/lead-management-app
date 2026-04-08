// ========================================
// CSV インポート/エクスポート
// ========================================

import { Lead, LeadStatus, LEAD_STATUS_LABELS } from "./types";
import { getLeads, createLead, getCompanies, createCompany } from "./store";

// ========================================
// エクスポート
// ========================================
const CSV_HEADERS = [
  "企業名",
  "担当者名",
  "役職",
  "メール",
  "電話番号",
  "ステータス",
  "リードソース",
  "自社担当",
  "次回アクション",
  "次回アクション日",
  "アポ日",
  "メモ",
  "作成日",
];

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportLeadsToCSV(): string {
  const leads = getLeads();
  const rows = leads.map((lead) => [
    lead.companyName,
    lead.contactName,
    lead.contactTitle,
    lead.contactEmail,
    lead.contactPhone,
    LEAD_STATUS_LABELS[lead.status],
    lead.source,
    lead.assignee,
    lead.nextAction,
    lead.nextActionDate,
    lead.appointmentDate,
    lead.note,
    lead.createdAt.split("T")[0],
  ]);

  const csvContent = [
    CSV_HEADERS.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  return "\uFEFF" + csvContent; // BOM付きUTF-8
}

export function downloadCSV(filename: string = "leads.csv"): void {
  const csv = exportLeadsToCSV();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ========================================
// インポート
// ========================================
const STATUS_REVERSE: Record<string, LeadStatus> = {};
Object.entries(LEAD_STATUS_LABELS).forEach(([key, label]) => {
  STATUS_REVERSE[label] = key as LeadStatus;
});

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export interface ImportResult {
  success: number;
  errors: string[];
}

export function importLeadsFromCSV(csvText: string): ImportResult {
  const lines = csvText
    .replace(/^\uFEFF/, "") // BOM除去
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    return { success: 0, errors: ["CSVにデータがありません"] };
  }

  // ヘッダー行をスキップ
  const dataLines = lines.slice(1);
  let success = 0;
  const errors: string[] = [];

  dataLines.forEach((line, index) => {
    try {
      const fields = parseCSVLine(line);
      const companyName = fields[0] || "";
      const contactName = fields[1] || "";

      if (!companyName || !contactName) {
        errors.push(`行${index + 2}: 企業名または担当者名が空です`);
        return;
      }

      // 企業を検索・作成
      const companies = getCompanies();
      let company = companies.find((c) => c.name === companyName);
      if (!company) {
        company = createCompany({
          name: companyName,
          industry: "",
          employeeCount: "",
          phone: fields[4] || "",
          website: "",
          address: "",
        });
      }

      const statusText = fields[5] || "";
      const status: LeadStatus = STATUS_REVERSE[statusText] || "new";

      createLead({
        companyId: company.id,
        companyName,
        contactName,
        contactTitle: fields[2] || "",
        contactEmail: fields[3] || "",
        contactPhone: fields[4] || "",
        status,
        source: fields[6] || "",
        assignee: fields[7] || "",
        nextAction: fields[8] || "",
        nextActionDate: fields[9] || "",
        appointmentDate: fields[10] || "",
        note: fields[11] || "",
      });

      success++;
    } catch {
      errors.push(`行${index + 2}: パースエラー`);
    }
  });

  return { success, errors };
}
