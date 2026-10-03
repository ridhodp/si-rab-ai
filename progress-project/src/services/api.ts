/**
 * API Service Layer - Semua komunikasi dengan backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Types
export interface User {
  id: string;
  name: string;
  unit: string;
  roles: string[];
  activeRole: string;
  isActive: boolean;
  phone?: string;
  createdAt?: string;
  menuAccess?: string;
}

export interface Regulation {
  id: string;
  title: string;
  category: string;
  description?: string;
  fileName: string;
  fileSize?: string;
  isActive: boolean;
  targetYear?: string;
  extractedRulesSummary?: string;
  createdAt?: string;
  uploadDate?: string;
  uploadedBy?: string;
}

export interface Submission {
  id: string;
  ticketNumber: string;
  satkerUserId: string;
  program: string;
  kegiatan: string;
  kro: string;
  ro: string;
  unitEselon1: string;
  unitEselon2: string;
  prioritas: string;
  rabFileName: string;
  rabFileSize?: string;
  regulationId?: string;
  regulationTitle?: string;
  aiStatus: string;
  aiScore: number;
  aiReason?: string;
  aiRecommendation?: string;
  kategori1?: string;
  kategoriDeskripsi?: string;
  aiCriteriaResults: Array<{
    id: number;
    status: string;
    notes: string;
    category?: string;
    verifierStatus?: "Lolos" | "Ditolak";
    verifierNotes?: string;
  }>;
  verificationStatus: string;
  verifikatorNotes?: string;
  verifiedById?: string;
  verifiedAt?: string;
  digitalSignatureHash?: string;
  createdAt?: string;
}

export interface MasterRo {
  id: string;
  program: string;
  unitEselon1: string;
  kegiatan: string;
  unitEselon2: string;
  prioritasCheck?: string;
  kro: string;
  ro: string;
}

export interface Criterion {
  id: number;
  text: string;
  description?: string;
  category?: string;
  isActive: boolean;
}

import type {
  ChecklistCriterion,
  HierarchyItem,
  RegulationDocument,
  SubmissionData,
  UserAccount,
  UserRole,
} from "../types";

// Helper
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export const authApi = {
  login: (id: string, password: string) =>
    apiFetch<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ id, password }),
    }),
  register: (payload: { id: string; name: string; unit: string; password: string; role: string; phone?: string }) =>
    apiFetch<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// Users
export const usersApi = {
  getAll: () => apiFetch<User[]>("/api/users"),
  create: (user: Partial<User> & { password: string }) =>
    apiFetch<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),
  update: (id: string, user: Partial<User>) =>
    apiFetch<User>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    }),
  delete: (id: string) =>
    apiFetch<{ status: string }>(`/api/users/${id}`, {
      method: "DELETE",
    }),
};

// Regulations
export const regulationsApi = {
  getAll: () => apiFetch<Regulation[]>("/api/regulations"),
  upload: (formData: FormData) =>
    apiFetch<Regulation>("/api/regulations/upload", {
      method: "POST",
      body: formData,
    }),
  create: (regulation: Partial<Regulation>) =>
    apiFetch<Regulation>("/api/regulations/upload", {
      method: "POST",
      body: JSON.stringify(regulation),
    }),
  update: (id: string, regulation: Partial<Regulation>) =>
    apiFetch<Regulation>(`/api/regulations/${id}`, {
      method: "PUT",
      body: JSON.stringify(regulation),
    }),
  toggle: (id: string) =>
    apiFetch<Regulation>(`/api/regulations/${id}/toggle`, {
      method: "PUT",
    }),
  delete: (id: string) =>
    apiFetch<{ status: string }>(`/api/regulations/${id}`, {
      method: "DELETE",
    }),
};

// Submissions
export const submissionsApi = {
  getAll: () => apiFetch<Submission[]>("/api/submissions"),
  upload: (formData: FormData) =>
    apiFetch<Submission>("/api/submissions/upload-and-check", {
      method: "POST",
      body: formData,
    }),
  verify: (id: string, payload: { criteriaResults: unknown; verificationStatus: string; verifikatorNotes: string; verifierId: string }) =>
    apiFetch<{ status: string }>(`/api/submissions/${id}/verify`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

// Master RO
export const masterRoApi = {
  getAll: () => apiFetch<MasterRo[]>("/api/master-ro"),
  create: (item: Partial<MasterRo>) =>
    apiFetch<MasterRo>("/api/master-ro", {
      method: "POST",
      body: JSON.stringify(item),
    }),
  update: (id: string, item: Partial<MasterRo>) =>
    apiFetch<MasterRo>(`/api/master-ro/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),
  delete: (id: string) =>
    apiFetch<{ status: string }>(`/api/master-ro/${id}`, {
      method: "DELETE",
    }),
};

// Criteria
export const criteriaApi = {
  getAll: () => apiFetch<Criterion[]>("/api/criteria"),
  create: (criterion: Partial<Criterion>) =>
    apiFetch<Criterion>("/api/criteria", {
      method: "POST",
      body: JSON.stringify(criterion),
    }),
  update: (id: number, criterion: Partial<Criterion>) =>
    apiFetch<Criterion>(`/api/criteria/${id}`, {
      method: "PUT",
      body: JSON.stringify(criterion),
    }),
  delete: (id: number) =>
    apiFetch<{ status: string }>(`/api/criteria/${id}`, {
      method: "DELETE",
    }),
};

// ======================================================================
// MAPPER: bentuk respons API -> bentuk internal aplikasi
// Backend memakai field minimal (tanpa field turunan/UI), sedangkan
// komponen lokal memerlukan field tambahan. Mapper ini melengkapinya
// dengan nilai default agar data dari DB tetap bisa dirender.
// ======================================================================
export const toUserAccount = (u: User): UserAccount => ({
  id: u.id,
  name: u.name,
  unit: u.unit,
  roles: (u.roles?.length ? u.roles : [u.activeRole]) as UserRole[],
  activeRole: (u.activeRole || u.roles?.[0] || "satker") as UserRole,
  password: "", // Backend menyimpan password_hash, tidak pernah dikirim ke client
  isActive: u.isActive ?? true,
  createdAt: u.createdAt || "",
  phone: u.phone,
  menuAccess: (u.menuAccess as UserAccount["menuAccess"]) || undefined,
});

export const toRegulationDocument = (r: Regulation): RegulationDocument => ({
  id: r.id,
  title: r.title,
  category: r.category || "",
  fileName: r.fileName || "",
  fileSize: r.fileSize || "-",
  uploadDate: r.uploadDate || r.createdAt || "",
  uploadedBy: r.uploadedBy || "-",
  isActive: r.isActive ?? true,
  targetYear: r.targetYear,
  description: r.description,
  extractedRulesSummary: r.extractedRulesSummary,
});

export const toChecklistCriteria = (rows: Submission["aiCriteriaResults"] | undefined): ChecklistCriterion[] =>
  (rows || []).map((row) => ({
    id: row.id,
    text: "",
    status: row.status === "LOLOS" || row.status === "passed" ? "passed" : "failed",
    notes: row.notes || "",
    category: row.category,
    verifierStatus: row.verifierStatus || "Lolos",
    verifierNotes: row.verifierNotes || "",
  }));

export const toSubmissionData = (s: Submission, users: UserAccount[] = []): SubmissionData => {
  const owner = users.find((u) => u.id === s.satkerUserId);
  return {
    id: s.id,
    ticketNumber: s.ticketNumber || "",
    satkerUserId: s.satkerUserId,
    satkerUserName: owner?.name || "-",
    satkerUnit: owner?.unit || "-",
    submittedAt: s.createdAt || "",
    program: s.program,
    kegiatan: s.kegiatan,
    kro: s.kro,
    ro: s.ro,
    unitEselon1: s.unitEselon1,
    unitEselon2: s.unitEselon2,
    prioritas: s.prioritas,
    rabFileName: s.rabFileName || "",
    rabFileSize: s.rabFileSize || "-",
    activeRegulationTitle: s.regulationTitle,
    kategori1: s.kategori1,
    kategoriDeskripsi: s.kategoriDeskripsi,
    aiStatus: (s.aiStatus === "TIDAK LOLOS" ? "TIDAK LOLOS" : "LOLOS") as "LOLOS" | "TIDAK LOLOS",
    aiScore: s.aiScore ?? 0,
    aiReason: s.aiReason || "",
    aiRecommendation: s.aiRecommendation || "",
    criteriaResults: toChecklistCriteria(s.aiCriteriaResults),
    verificationStatus: (s.verificationStatus || "Menunggu") as "Menunggu" | "Diterima" | "Ditolak",
    verifikatorNotes: s.verifikatorNotes || "",
    verifiedBy: s.verifiedById,
    verifiedAt: s.verifiedAt,
    digitalSignatureHash: s.digitalSignatureHash,
  };
};

export const toHierarchyItem = (m: MasterRo): HierarchyItem => ({
  id: m.id,
  program: m.program,
  unitEselon1: m.unitEselon1,
  kegiatan: m.kegiatan,
  unitEselon2: m.unitEselon2,
  prioritasCheck: m.prioritasCheck || "",
  kro: m.kro,
  ro: m.ro,
});
