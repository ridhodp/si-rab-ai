export type UserRole = "superadmin" | "satker" | "verifikator";

export type MenuAccessLevel = "view" | "edit" | "both";

export type AccessPermission = "E" | "V" | "NONE";

export type StandardMenuKey = "menu_dashboard" | "menu_users" | "menu_acuan" | "menu_checklist" | "menu_master_ro" | "menu_rab_list" | "menu_verification";

export type ActiveMenuKey = StandardMenuKey | "admin_users" | "admin_regulations" | "satker_list" | "satker_form" | "verifikator_review" | "verifikator_checklist" | "menu_master_ro" | "menu_dashboard";

// Matriks Hak Akses Berdasarkan Tabel Peran (Excel: E = Edit, V = View, NONE = Tidak ada akses)
export const ROLE_PERMISSIONS_MATRIX: Record<StandardMenuKey, Record<UserRole, AccessPermission>> = {
  menu_dashboard: { superadmin: "E", verifikator: "E", satker: "E" },
  menu_users: { superadmin: "E", verifikator: "NONE", satker: "NONE" },
  menu_acuan: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_checklist: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_master_ro: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_rab_list: { superadmin: "E", verifikator: "NONE", satker: "E" },
  menu_verification: { superadmin: "E", verifikator: "E", satker: "V" },
};

export interface UserAccount {
  id: string; // 8 character ID (e.g. 19850115 / ADM88001)
  name: string;
  unit: string;
  roles: UserRole[]; // Can have 1, 2, or 3 roles
  activeRole: UserRole;
  password: string;
  isActive: boolean;
  createdAt: string;
  phone?: string;
  menuAccess?: MenuAccessLevel; // "view" | "edit" | "both" (default: "both")
}

export interface HierarchyItem {
  id?: string;
  program: string;
  unitEselon1: string;
  kegiatan: string;
  unitEselon2: string;
  prioritasCheck: string;
  kro: string;
  ro: string;
}

export interface ChecklistCriterion {
  id: number;
  text: string;
  status: "passed" | "failed"; // AI status
  notes: string; // AI findings notes
  category?: string;
  verifierStatus: "Lolos" | "Ditolak"; // Verifier override per row
  verifierNotes: string; // Verifier notes per row
}

export interface MasterCriterion {
  id: number;
  text: string;
  description: string;
  isActive: boolean;
}

export interface RegulationDocument {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  dateInserted?: string; // Tanggal Dimasukkan
  uploadedBy: string;
  isActive: boolean;
  targetYear?: string;
  description?: string;
  extractedRulesSummary?: string;
  pdfDataUrl?: string;
}

export interface SubmissionAuditEntry {
  action: "CREATE" | "UPDATE" | "DELETE";
  performedBy: string; // ID / NIP & Name
  timestamp: string;
  details?: string;
}

export interface SubmissionData {
  id: string;
  ticketNumber: string;
  satkerUserId: string; // 8 characters
  satkerUserName: string;
  satkerUnit: string;
  submittedAt: string;
  program: string;
  kegiatan: string;
  kro: string;
  ro: string;
  unitEselon1: string;
  unitEselon2: string;
  prioritas: string;
  rabFileName: string;
  rabFileSize: string;
  pdfDataUrl?: string;
  activeRegulationTitle?: string;

  // Kategori RAB (dropdown tunggal, diisi dari form Satker)
  kategori1?: string;
  kategoriDeskripsi?: string;
  kategori2?: string;
  kategori3?: string;

  // User Logging / Audit Trail
  createdBy?: string;
  updatedBy?: string;
  auditTrail?: SubmissionAuditEntry[];

  // Related Reference Documents
  referenceDocuments?: string[];

  // AI LLM Analysis Result for RAB
  aiStatus: "LOLOS" | "TIDAK LOLOS";
  aiScore: number;
  aiReason: string;
  aiRecommendation: string;
  criteriaResults: ChecklistCriterion[];

  // Verifikator Review
  verificationStatus: "Menunggu" | "Diterima" | "Ditolak";
  verifikatorNotes: string;
  verifiedBy?: string;
  verifiedByNip?: string;
  verifiedAt?: string;
  digitalSignatureHash?: string;
}
