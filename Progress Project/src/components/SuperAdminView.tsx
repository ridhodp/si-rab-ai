import React, { useState, useEffect } from "react";
import { UserAccount, UserRole, RegulationDocument, MenuAccessLevel, ActiveMenuKey, AccessPermission } from "../types";
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Key,
  Search,
  Check,
  AlertCircle,
  CheckCircle,
  X,
  BookOpen,
  FileText,
  Upload,
  Eye,
  CheckCircle2,
  FileCheck,
  Layers,
  Calendar,
  Info,
  Scale,
  FileSpreadsheet,
  Building2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ShieldCheck,
  FolderArchive,
  RotateCw,
  Sliders,
  Lock,
  Unlock,
} from "lucide-react";
import { PdfPreviewModal } from "./PdfPreviewModal";

export const SATKER_UNIT_GROUPS = [
  {
    group: "Sekretariat Jenderal",
    options: [
      "Biro Perencanaan",
      "Biro Keuangan dan Barang Milik Negara",
      "Biro Umum",
      "Biro Sumber Daya Manusia",
      "Pusat Data dan Sarana Informatika",
      "Sekretariat Komisi Informasi (KI) Pusat",
      "Sekretariat Dewan Pers",
      "Sekretariat Komisi Penyiaran Informasi Indonesia (KPI) Pusat",
    ],
  },
  {
    group: "Inspektorat Jenderal",
    options: ["Inspektorat / Verifikasi Anggaran", "Inspektorat I (Pengawasan Bidang Komunikasi)", "Inspektorat II (Pengawasan Bidang Digital & Infrastruktur)", "Inspektorat Investigasi"],
  },
  {
    group: "Ditjen Komunikasi Publik dan Media",
    options: [
      "Direktorat Komunikasi Publik",
      "Direktorat Informasi Publik",
      "Direktorat Ekosistem Media",
      "Direktorat Kemitraan Komunikasi Lembaga dan Kehumasan",
      "Direktorat Pengelolaan Media Publik",
      "Museum Penerangan (TMII Jakarta)",
      "Monumen Pers Nasional (Solo)",
      "Sekretariat Ditjen Informasi dan Komunikasi Publik",
    ],
  },
  {
    group: "Ditjen Teknologi Pemerintah Digital",
    options: [
      "Direktorat Strategi & Kebijakan Teknologi Pemerintah Digital",
      "Direktorat Infrastruktur Pemerintah Digital",
      "Direktorat Aplikasi Pemerintah Digital",
      "Direktorat Akselerasi Teknologi Pemerintah Digital Daerah",
    ],
  },
  {
    group: "Ditjen Ekosistem Digital",
    options: [
      "Direktorat Pengembangan Ekosistem Digital",
      "Direktorat Kecerdasan Artifisial dan Ekosistem Teknologi Baru",
      "Direktorat Pos dan Penyiaran",
      "Direktorat Layanan Ekosistem Digital",
      "Direktorat Pengendalian Ekosistem Digital",
    ],
  },
  {
    group: "Ditjen Infrastruktur Digital",
    options: ["Direktorat Akselerasi Infrastruktur Digital", "Direktorat Penataan Spektrum Frekuensi Radio, Orbit Satelit, dan Standarisasi"],
  },
  {
    group: "Badan Pengembangan SDM Komunikasi dan Digital",
    options: ["Pusat Pengembangan Literasi Digital", "Pusat Pengembangan Talenta Digital", "Pusat Pengembangan Aparatur Komdigi", "Pusat Pengembangan Ekosistem SDM Komdigi"],
  },
  {
    group: "Badan Aksesibilitas Telekomunikasi dan Informasi (BAKTI)",
    options: ["Direktorat Infrastruktur BAKTI", "Direktorat Layanan TI untuk Masyarakat & Pemerintah", "Direktorat Keuangan BAKTI"],
  },
];

interface SuperAdminViewProps {
  users: UserAccount[];
  currentUser: UserAccount;
  regulations: RegulationDocument[];
  activeMenu?: ActiveMenuKey;
  permission?: AccessPermission;
  onSelectMenu?: (menu: ActiveMenuKey) => void;
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onAddRegulation: (reg: RegulationDocument) => void;
  onUpdateRegulation: (reg: RegulationDocument) => void;
  onDeleteRegulation: (regId: string) => void;
  onToggleRegulationActive: (regId: string) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  users,
  currentUser,
  regulations,
  activeMenu = "admin_users",
  permission = "E",
  onSelectMenu,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddRegulation,
  onUpdateRegulation,
  onDeleteRegulation,
  onToggleRegulationActive,
}) => {
  // Current view derived from activeMenu ("admin_users" / "menu_users" vs "admin_regulations" / "menu_acuan")
  const currentView = activeMenu === "admin_regulations" || activeMenu === "menu_acuan" ? "regulations" : "users";

  const isEditable = permission === "E";

  // Sub Tab for Arsip Regulasi: "ketentuan" vs "peraturan_acuan"
  const [regSubTab, setRegSubTab] = useState<"ketentuan" | "peraturan_acuan">("peraturan_acuan");

  // Search & Filters for Users
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterAccess, setFilterAccess] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Search & Filter for Regulations
  const [regSearchTerm, setRegSearchTerm] = useState("");
  const [regFilterCategory, setRegFilterCategory] = useState<string>("all");
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<RegulationDocument | null>(null);

  // History Indeksing Sync State (Interactive demonstration)
  const [isSyncingIndex, setIsSyncingIndex] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("28 September 2026, 15:30 WIB");

  // PDF Preview State
  const [previewPdfModal, setPreviewPdfModal] = useState<{
    isOpen: boolean;
    fileName: string;
    fileDataUrl?: string;
    title: string;
  }>({
    isOpen: false,
    fileName: "",
    title: "",
  });

  // User Form State
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formRoles, setFormRoles] = useState<UserRole[]>(["satker"]);
  const [formPassword, setFormPassword] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formMenuAccess, setFormMenuAccess] = useState<MenuAccessLevel>("both");
  const [formError, setFormError] = useState<string | null>(null);

  // Regulation Form State
  const [regTitle, setRegTitle] = useState("");
  const [regCategory, setRegCategory] = useState("Standar Biaya Masukan (SBM)");
  const [regTargetYear, setRegTargetYear] = useState("2026");
  const [regDateInserted, setRegDateInserted] = useState(new Date().toISOString().split("T")[0]);
  const [regDescription, setRegDescription] = useState("");
  const [regFileName, setRegFileName] = useState("");
  const [regFileSize, setRegFileSize] = useState("");
  const [regPdfDataUrl, setRegPdfDataUrl] = useState<string | undefined>(undefined);
  const [regIsActive, setRegIsActive] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);

  const activeRegulationsCount = regulations.filter((r) => r.isActive).length;

  // Pop-up Validasi Konfirmasi Buat Akun & Tambah Role
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    user: UserAccount;
  } | null>(null);

  // Section Minimize States
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [isUsersTableCollapsed, setIsUsersTableCollapsed] = useState(false);
  const [isIndexCollapsed, setIsIndexCollapsed] = useState(false);
  const [isRegsTableCollapsed, setIsRegsTableCollapsed] = useState(false);

  // ==================================================================
  // USER CRUD HANDLERS
  // ==================================================================
  const openAddModal = () => {
    setEditingUser(null);
    setFormId("");
    setFormName("");
    setFormUnit("");
    setFormRoles(["satker"]);
    setFormPassword("password123");
    setFormIsActive(true);
    setFormMenuAccess("both");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormId(user.id);
    setFormName(user.name);
    setFormUnit(user.unit);
    setFormRoles([...user.roles]);
    setFormPassword(user.password);
    setFormIsActive(user.isActive);
    setFormMenuAccess(user.menuAccess || "both");
    setFormError(null);
    setIsModalOpen(true);
  };

  const selectSingleRole = (role: UserRole) => {
    setFormRoles([role]);
    setFormError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedId = formId.trim();

    if (!trimmedId) {
      setFormError("ID pengguna tidak boleh kosong.");
      return;
    }

    if (trimmedId.length !== 8) {
      setFormError("ID pengguna wajib tepat 8 karakter.");
      return;
    }

    if (!formName.trim()) {
      setFormError("Nama lengkap pengguna wajib diisi.");
      return;
    }

    if (!formUnit.trim()) {
      setFormError("Satuan Kerja/Unit wajib dipilih.");
      return;
    }

    if (formRoles.length === 0) {
      setFormError("Pilih minimal 1 role untuk akun pengguna ini.");
      return;
    }

    if (!editingUser) {
      const exists = users.some((u) => u.id.toLowerCase() === trimmedId.toLowerCase());
      if (exists) {
        setFormError(`ID Pengguna / NIP "${trimmedId}" sudah terdaftar dalam sistem.`);
        return;
      }
    }

    const targetUser: UserAccount = {
      id: trimmedId,
      name: formName.trim(),
      unit: formUnit.trim(),
      roles: formRoles,
      activeRole: editingUser ? (formRoles.includes(editingUser.activeRole) ? editingUser.activeRole : formRoles[0]) : formRoles[0],
      password: formPassword || (editingUser ? editingUser.password : "password123"),
      isActive: formIsActive,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().split("T")[0],
      menuAccess: formMenuAccess,
    };

    setValidationModal({
      isOpen: true,
      isEdit: !!editingUser,
      user: targetUser,
    });
  };

  const handleConfirmValidationSave = () => {
    if (!validationModal) return;

    if (validationModal.isEdit) {
      onUpdateUser(validationModal.user);
    } else {
      onAddUser(validationModal.user);
    }

    setValidationModal(null);
    setIsModalOpen(false);
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase()) || u.unit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = filterRole === "all" || u.roles.includes(filterRole as UserRole);

    const matchAccess = filterAccess === "all" || (u.menuAccess || "both") === filterAccess;

    return matchSearch && matchRole && matchAccess;
  });

  // ==================================================================
  // REGULATION CRUD HANDLERS
  // ==================================================================
  const openAddRegulationModal = () => {
    setEditingReg(null);
    setRegTitle("");
    setRegCategory("Standar Biaya Masukan (SBM)");
    setRegTargetYear("2026");
    setRegDateInserted(new Date().toISOString().split("T")[0]);
    setRegDescription("");
    setRegFileName("");
    setRegFileSize("");
    setRegPdfDataUrl(undefined);
    setRegIsActive(true);
    setRegError(null);
    setIsRegModalOpen(true);
  };

  const openEditRegulationModal = (reg: RegulationDocument) => {
    setEditingReg(reg);
    setRegTitle(reg.title);
    setRegCategory(reg.category);
    setRegTargetYear(reg.targetYear || "2026");
    setRegDateInserted(reg.dateInserted || reg.uploadDate || new Date().toISOString().split("T")[0]);
    setRegDescription(reg.description || "");
    setRegFileName(reg.fileName);
    setRegFileSize(reg.fileSize);
    setRegPdfDataUrl(reg.pdfDataUrl);
    setRegIsActive(reg.isActive);
    setRegError(null);
    setIsRegModalOpen(true);
  };

  const handleRegulationFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setRegError("Format berkas regulasi harus PDF.");
      return;
    }

    setRegFileName(file.name);
    setRegFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

    if (!regTitle) {
      const autoTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setRegTitle(autoTitle);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setRegPdfDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRegulationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regTitle.trim()) {
      setRegError("Judul peraturan wajib diisi.");
      return;
    }

    if (!editingReg && !regFileName) {
      setRegError("Wajib mengunggah berkas PDF dokumen peraturan acuan.");
      return;
    }

    if (!regCategory.trim()) {
      setRegError("Kategori dokumen wajib diisi.");
      return;
    }

    if (editingReg) {
      const updatedRegulation: RegulationDocument = {
        ...editingReg,
        title: regTitle.trim(),
        category: regCategory.trim(),
        targetYear: regTargetYear.trim() || "2026",
        dateInserted: regDateInserted || editingReg.dateInserted || editingReg.uploadDate,
        description: regDescription.trim() || "Dokumen acuan penetapan standar biaya dan juknis telaah RAB resmi.",
        fileName: regFileName || editingReg.fileName,
        fileSize: regFileSize || editingReg.fileSize,
        pdfDataUrl: regPdfDataUrl || editingReg.pdfDataUrl,
        isActive: regIsActive,
      };
      onUpdateRegulation(updatedRegulation);
    } else {
      const newRegulation: RegulationDocument = {
        id: `REG-${Date.now()}`,
        title: regTitle.trim(),
        category: regCategory.trim(),
        fileName: regFileName,
        fileSize: regFileSize || "1.5 MB",
        uploadDate: new Date().toISOString().split("T")[0],
        dateInserted: regDateInserted || new Date().toISOString().split("T")[0],
        uploadedBy: `${currentUser.id} (${currentUser.name})`,
        isActive: regIsActive,
        targetYear: regTargetYear.trim() || "2026",
        description: regDescription.trim() || "Dokumen acuan penetapan standar biaya dan juknis telaah RAB resmi.",
        pdfDataUrl: regPdfDataUrl,
      };
      onAddRegulation(newRegulation);
    }

    setIsRegModalOpen(false);
  };

  const handleTriggerReindex = () => {
    setIsSyncingIndex(true);
    setTimeout(() => {
      setIsSyncingIndex(false);
      const now = new Date();
      const timeStr = `${now.getDate()} ${now.toLocaleString("id-ID", { month: "long" })} ${now.getFullYear()}, ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`;
      setLastSyncTime(timeStr);
    }, 1000);
  };

  const filteredRegulations = regulations.filter((reg) => {
    const matchSearch =
      reg.title.toLowerCase().includes(regSearchTerm.toLowerCase()) ||
      reg.fileName.toLowerCase().includes(regSearchTerm.toLowerCase()) ||
      (reg.description && reg.description.toLowerCase().includes(regSearchTerm.toLowerCase()));

    const matchCategory = regFilterCategory === "all" || reg.category.toLowerCase().includes(regFilterCategory.toLowerCase());

    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/50 dark:border-cyan-800/50 text-xs font-bold text-cyan-700 dark:text-cyan-300 mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Panel Super Administrator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              {currentView === "users" ? "Management User & Hak Akses" : "Input Acuan & Regulasi AI"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {currentView === "users"
                ? "Kelola akun pengguna, penugasan multi-role, serta atur batasan hak akses menu (Hanya Lihat, Hanya Ubah, atau Keduanya)."
                : "Atur ketentuan normatif serta arsip berkas regulasi acuan resmi (PDF) yang menjadi dasar penelaahan AI terhadap dokumen RAB."}
            </p>
          </div>


        </div>
      </div>

      {/* ================================================================ */}
      {/* 1. MANAJEMEN PENGGUNA */}
      {/* ================================================================ */}
      {currentView === "users" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section 1: Ringkasan Statistik Pengguna & Akun */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500/80 dark:border-cyan-500/80 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm transition-all space-y-6 sm:space-y-7">
            {/* Outline Label Badge */}
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md border bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-cyan-400 select-none">
              <Users className="w-3.5 h-3.5" />
              <span>Statistik Akun Pengguna</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Ringkasan Statistik Akun Pengguna</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title={isStatsCollapsed ? "Perluas Bagian Statistik" : "Minimize Bagian Statistik"}
              >
                <span>{isStatsCollapsed ? "Perluas" : "Minimize"}</span>
                {isStatsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isStatsCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 animate-fadeIn">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold uppercase tracking-wide">Total Pengguna</span>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-2 block">{users.length}</span>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/40 dark:to-cyan-950/20 p-5 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/50 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 block font-semibold uppercase tracking-wide">Akun Satker</span>
                  <span className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-2 block">{users.filter((u) => (u.roles || []).includes("satker")).length}</span>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-950/20 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold uppercase tracking-wide">Akun Verifikator</span>
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-2 block">{users.filter((u) => (u.roles || []).includes("verifikator")).length}</span>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-950/20 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-amber-600 dark:text-amber-400 block font-semibold uppercase tracking-wide">Akses Penuh (Both)</span>
                  <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-2 block">{users.filter((u) => (u.menuAccess || "both") === "both").length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Tabel Daftar Pengguna & Pengaturan Hak Akses Menu */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500/80 dark:border-cyan-500/80 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm transition-all space-y-6 sm:space-y-7">
            {/* Outline Label Badge */}
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md border bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-cyan-400 select-none">
              <Key className="w-3.5 h-3.5" />
              <span>Manajemen Akun &amp; Hak Akses</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Daftar Pengguna &amp; Hak Akses Menu</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Atur hak akses menu setiap akun (Hanya Lihat / Hanya Ubah / Keduanya) dan penugasan role.</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  id="btn-add-new-user"
                  onClick={openAddModal}
                  className="h-10 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-600/30 hover:shadow-lg transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Pengguna</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUsersTableCollapsed(!isUsersTableCollapsed)}
                  className="h-10 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title={isUsersTableCollapsed ? "Perluas Tabel Pengguna" : "Minimize Tabel Pengguna"}
                >
                  <span>{isUsersTableCollapsed ? "Perluas" : "Minimize"}</span>
                  {isUsersTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isUsersTableCollapsed && (
              <div className="space-y-5 animate-fadeIn">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="search-user-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari ID/NIP, nama, atau unit..."
                      className="w-full pl-9 pr-4 h-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter Role:</span>
                    <select
                      id="filter-role-select"
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs cursor-pointer"
                    >
                      <option value="all">Semua Role</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="satker">Satker</option>
                      <option value="verifikator">Verifikator</option>
                    </select>

                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Hak Akses:</span>
                    <select
                      id="filter-access-select"
                      value={filterAccess}
                      onChange={(e) => setFilterAccess(e.target.value)}
                      className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs cursor-pointer"
                    >
                      <option value="all">Semua Akses</option>
                      <option value="both">Keduanya (View &amp; Edit)</option>
                      <option value="view">Hanya Lihat (View)</option>
                      <option value="edit">Hanya Ubah (Edit)</option>
                    </select>
                  </div>
                </div>

                {/* User Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase font-mono tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">ID / NIP</th>
                        <th className="px-4 py-3.5">Nama &amp; Gelar</th>
                        <th className="px-4 py-3.5">Satuan Kerja / Unit</th>
                        <th className="px-4 py-3.5">Role Terdaftar</th>
                        <th className="px-4 py-3.5">Hak Akses Menu</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                            Tidak ada akun yang cocok dengan kata kunci pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const access = user.menuAccess || "both";
                          return (
                            <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-cyan-700 dark:text-cyan-400">{user.id}</span>
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                                {user.name}
                                {user.id === currentUser.id && (
                                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold">Anda</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">{user.unit}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-wrap gap-1">
                                  {user.roles.map((r) => (
                                    <span
                                      key={r}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        r === "superadmin"
                                          ? "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                                          : r === "satker"
                                            ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                      }`}
                                    >
                                      {r === "superadmin" ? "Super Admin" : r === "satker" ? "Satker" : "Verifikator"}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              {/* Hak Akses Menu Column (Role-Based Access Control) */}
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    access === "both"
                                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                      : access === "view"
                                        ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  }`}
                                >
                                  {access === "both" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                  {access === "view" && <Eye className="w-3 h-3 text-sky-600" />}
                                  {access === "edit" && <Edit3 className="w-3 h-3 text-amber-600" />}
                                  <span>{access === "both" ? "View & Edit (Penuh)" : access === "view" ? "Hanya Lihat (View)" : "Hanya Ubah (Edit)"}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    user.isActive ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                                  }`}
                                >
                                  {user.isActive ? "Aktif" : "Non-Aktif"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openEditModal(user)}
                                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors cursor-pointer"
                                    title="Edit Pengguna & Hak Akses"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  {user.id !== currentUser.id && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Yakin ingin menghapus akun "${user.name}" (${user.id})?`)) {
                                          onDeleteUser(user.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Hapus Akun Pengguna"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. ARSIP REGULASI */}
      {/* ================================================================ */}
      {currentView === "regulations" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Sub-Tab Navigation: Ketentuan vs Peraturan Acuan AI */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRegSubTab("ketentuan")}
                className={`h-11 px-5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  regSubTab === "ketentuan"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Ketentuan</span>
              </button>

              <button
                type="button"
                onClick={() => setRegSubTab("peraturan_acuan")}
                className={`h-11 px-5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  regSubTab === "peraturan_acuan"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Peraturan Acuan AI</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    regSubTab === "peraturan_acuan"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  {activeRegulationsCount} Aktif
                </span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* SUB TAB 1: KETENTUAN */}
          {/* ------------------------------------------------------------ */}
          {regSubTab === "ketentuan" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 mb-2">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Kaidah &amp; Standar Regulasi Komdigi</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ketentuan Normatif Penelaahan Dokumen RAB Berbasis AI</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Kumpulan kaidah standar penilaian otomatis yang diterapkan oleh AI dan tim verifikator berdasarkan Peraturan Menteri Keuangan (PMK) Standar Biaya Masukan (SBM) dan Juknis Tata
                    Kelola Anggaran resmi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Card 1: BAS 6 Digit */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white text-sm">
                      <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span>1. Standar Bagan Akun Standar (BAS 6 Digit)</span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                      <li>
                        <strong>521211 (Belanja Bahan):</strong> Hanya untuk bahan konsumsi habis pakai kegiatan operasional.
                      </li>
                      <li>
                        <strong>521213 / 522151 (Honorarium):</strong> Honor narasumber, moderator, dan panitia resmi.
                      </li>
                      <li>
                        <strong>521219 (Konsumsi Rapat):</strong> Snack dan makan rapat dinas dalam kantor.
                      </li>
                      <li>
                        <strong>524111 (Perjalanan Dinas):</strong> Transportasi dan uang harian resmi dalam negeri.
                      </li>
                    </ul>
                  </div>

                  {/* Card 2: Batas Tarif SBM */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white text-sm">
                      <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span>2. Batas Tertinggi Tarif Honorarium &amp; Rapat</span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                      <li>Honor Menteri/Setingkat: Maksimal Rp 1.700.000 / Orang-Jam (OJ).</li>
                      <li>Honor Eselon I / Pakar Utama: Maksimal Rp 1.400.000 / OJ.</li>
                      <li>Honor Eselon II / Pakar Madya: Maksimal Rp 1.000.000 / OJ.</li>
                      <li>Snack Rapat: Maks. Rp 23.000/orang/kali &bull; Makan: Maks. Rp 51.000/orang/kali.</li>
                    </ul>
                  </div>

                  {/* Card 3: Biaya Pendukung */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white text-sm">
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span>3. Pembagian Biaya Utama vs Pendukung</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Biaya pendukung (konsumsi, ATK umum, dokumentasi, kebersihan) wajib dipisahkan dan <strong>tidak boleh melebihi 15%</strong> dari total keseluruhan pagu belanja output kegiatan.
                    </p>
                  </div>

                  {/* Card 4: Ketentuan Perpajakan */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white text-sm">
                      <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>4. Kepatuhan Ketentuan Perpajakan</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Pemotongan PPh Pasal 21 atas honorarium (PNS Gol IV: 15%, PNS Gol III: 5%, Non-PNS ber-NPWP: 5%), serta PPN 12% atas pengadaan BKP/JKP di atas Rp 2.000.000 wajib dicantumkan
                      secara jelas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* SUB TAB 2: PERATURAN ACUAN AI */}
          {/* CATATAN: PEMBAHASAN 1 DIHAPUS SESUAI INSTRUKSI */}
          {/* ------------------------------------------------------------ */}
          {regSubTab === "peraturan_acuan" && (
            <div className="space-y-8 animate-fadeIn">
              {/* VIEW ONLY BANNER (FOR SATKER) */}
              {!isEditable && (
                <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl p-4.5 flex items-start gap-3.5 text-sky-900 dark:text-sky-200 shadow-2xs">
                  <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold uppercase tracking-wider block text-[11px] text-sky-800 dark:text-sky-300">Mode Akses: Hanya Lihat (View Only)</span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                      Sesuai peran <strong>Satker</strong>, Anda memiliki hak akses <strong>View (V)</strong> untuk membaca regulasi acuan AI, ketentuan, dan berkas PDF sebagai standar acuan
                      penyusunan RAB. Unggah peraturan baru, edit, hapus, dan perubahan status hanya dapat dilakukan oleh <strong>Super Admin</strong> dan <strong>ROCAN (verif)</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* FITUR HISTORY INDEKSING: Rangkuman Indeksing Seluruh Regulasi Menjadi 1 Tampilan History */}
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/80 dark:border-emerald-500/80 rounded-2xl p-6 sm:p-7 shadow-sm transition-all space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <RotateCw className={`w-5 h-5 ${isSyncingIndex ? "animate-spin text-emerald-600" : ""}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">History &amp; Rangkuman Indeksing Regulasi AI</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Konsolidasi {regulations.length} Regulasi
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Rangkuman seluruh {regulations.length} regulasi acuan yang telah dikonsolidasikan menjadi 1 basis data pengetahuan AI terpadu (RAG Vector Store).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditable && (
                      <button
                        type="button"
                        disabled={isSyncingIndex}
                        onClick={handleTriggerReindex}
                        className="h-9 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="Sinkronisasi ulang seluruh regulasi ke dalam 1 indeks AI"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isSyncingIndex ? "animate-spin" : ""}`} />
                        <span>{isSyncingIndex ? "Menyinkronkan..." : "Sinkronisasi Ulang Indeks AI"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsIndexCollapsed(!isIndexCollapsed)}
                      className="h-9 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      title={isIndexCollapsed ? "Perluas History Indeksing" : "Minimize History Indeksing"}
                    >
                      <span>{isIndexCollapsed ? "Perluas" : "Minimize"}</span>
                      {isIndexCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isIndexCollapsed && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Consolidated History Single View */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300">ID Snapshot Indeks:</span>
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-cyan-700 dark:text-cyan-300">
                            IDX-RAG-KOMDIGI-V2.6
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Sinkronisasi Terakhir: {lastSyncTime}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Regulasi Dirangkum</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{regulations.length} Dokumen</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Status RAG LLM</span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">100% Siap</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Dimensi Embedding</span>
                          <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono">768 Dimensi</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Model AI Penguji</span>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">Gemini 1.5 Pro</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                        <strong>Rangkuman Pengetahuan Terindeks:</strong> Seluruh {regulations.length} dokumen regulasi di bawah ini telah disatukan menjadi 1 indeks konsolidasi rujukan AI. AI secara
                        otomatis merujuk standar tarif honor narasumber, batas konsumsi rapat, uang harian perjalanan dinas, standar BAS 6-digit, serta batas biaya pendukung 15% saat memeriksa dokumen
                        RAB dari satuan kerja.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION PEMBAHASAN 2: REPOSITORI DOKUMEN REGULASI ACUAN AI */}
              <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 sm:space-y-7 transition-all">
                {/* Outline Label Badge */}
                <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>PEMBAHASAN 2 &bull; REPOSITORI DOKUMEN REGULASI ACUAN AI</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>2. Repositori Berkas Dokumen Regulasi Acuan AI</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Daftar berkas regulasi resmi yang diunggah untuk evaluasi otomatis AI, dengan kontrol status Aktif / Tidak Aktif dan fitur aksi CRUD lengkap.
                    </p>
                  </div>

                  {/* Requirement: "Pada pembahasan 2 dimasukkan button input. Jadi tombol unggah peraturan baru digeser ke sini" */}
                  <div className="flex items-center gap-2.5">
                    {isEditable && (
                      <button
                        id="btn-add-new-regulation-pembahasan2"
                        type="button"
                        onClick={openAddRegulationModal}
                        className="h-10 px-5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-600/30 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Unggah Peraturan Baru (PDF)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsRegsTableCollapsed(!isRegsTableCollapsed)}
                      className="h-10 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      title={isRegsTableCollapsed ? "Perluas Daftar Regulasi" : "Minimize Daftar Regulasi"}
                    >
                      <span>{isRegsTableCollapsed ? "Perluas" : "Minimize"}</span>
                      {isRegsTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isRegsTableCollapsed && (
                  <div className="space-y-5 animate-fadeIn">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="search-regulation-input"
                          type="text"
                          value={regSearchTerm}
                          onChange={(e) => setRegSearchTerm(e.target.value)}
                          placeholder="Cari judul peraturan, nama file, atau kategori..."
                          className="w-full pl-9 pr-4 h-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs"
                        />
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Filter Kategori:</span>
                        <select
                          id="filter-reg-category-select"
                          value={regFilterCategory}
                          onChange={(e) => setRegFilterCategory(e.target.value)}
                          className="h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs cursor-pointer"
                        >
                          <option value="all">Semua Kategori</option>
                          <option value="SBM">Standar Biaya Masukan (SBM)</option>
                          <option value="Juknis">Petunjuk Teknis &amp; BAS</option>
                          <option value="Pedoman">Pedoman</option>
                        </select>
                      </div>
                    </div>

                    {/* Regulation Cards / Table with CRUD Actions & Toggle Aktif / Tidak Aktif */}
                    <div className="grid grid-cols-1 gap-4">
                      {filteredRegulations.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-14 text-center text-slate-400 dark:text-slate-500 transition-colors">
                          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-bold">Belum ada dokumen peraturan yang cocok.</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Klik tombol "Unggah Peraturan Baru (PDF)" di atas untuk menambahkan berkas regulasi acuan.</p>
                        </div>
                      ) : (
                        filteredRegulations.map((reg) => (
                          <div
                            key={reg.id}
                            className={`bg-slate-50/60 dark:bg-slate-800/40 border rounded-2xl p-6 shadow-xs transition-all ${
                              reg.isActive ? "border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-500/20" : "border-slate-200 dark:border-slate-800 opacity-80"
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`p-3.5 rounded-2xl shrink-0 ${
                                    reg.isActive
                                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  <FileText className="w-6 h-6" />
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{reg.title}</span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                                      {reg.category}
                                    </span>
                                    {reg.targetYear && (
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        TA {reg.targetYear}
                                      </span>
                                    )}
                                  </div>

                                  {reg.description && <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-3xl leading-relaxed">{reg.description}</p>}

                                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-mono pt-1">
                                    <span className="flex items-center gap-1.5">
                                      <FileSpreadsheet className="w-3.5 h-3.5" />
                                      {reg.fileName} ({reg.fileSize})
                                    </span>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Tanggal Dimasukkan: {reg.dateInserted || reg.uploadDate}
                                    </span>
                                    <span>&bull;</span>
                                    <span>Pengunggah: {reg.uploadedBy}</span>
                                  </div>
                                </div>
                              </div>

                              {/* CRUD Actions & Toggle Aktif / Tidak Aktif */}
                              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                                {/* Requirement: "pada bagian aktif digunakan AI diubah menjadi 'aktif atau tidak' digunakan AI" */}
                                {isEditable ? (
                                  <button
                                    type="button"
                                    onClick={() => onToggleRegulationActive(reg.id)}
                                    className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                      reg.isActive
                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                                    }`}
                                    title="Ubah status apakah dokumen ini aktif atau tidak digunakan oleh AI"
                                  >
                                    <span className={`w-2.5 h-2.5 rounded-full ${reg.isActive ? "bg-emerald-500 ring-2 ring-emerald-300" : "bg-slate-400"}`} />
                                    <span>{reg.isActive ? "Aktif Digunakan AI" : "Tidak Aktif Digunakan AI"}</span>
                                  </button>
                                ) : (
                                  <span
                                    className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 select-none ${
                                      reg.isActive
                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300"
                                    }`}
                                  >
                                    <span className={`w-2.5 h-2.5 rounded-full ${reg.isActive ? "bg-emerald-500 ring-2 ring-emerald-300" : "bg-slate-400"}`} />
                                    <span>{reg.isActive ? "Aktif Digunakan AI" : "Tidak Aktif"}</span>
                                  </span>
                                )}

                                {/* Action: READ (Pratinjau PDF) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewPdfModal({
                                      isOpen: true,
                                      fileName: reg.fileName,
                                      fileDataUrl: reg.pdfDataUrl,
                                      title: reg.title,
                                    });
                                  }}
                                  className="h-9 px-3 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-cyan-200 dark:border-cyan-800 shadow-2xs cursor-pointer"
                                  title="Pratinjau Dokumen PDF Regulasi (Read)"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                  <span>Lihat PDF</span>
                                </button>

                                {isEditable && (
                                  <>
                                    {/* Action: UPDATE (Edit Dokumen Regulasi) */}
                                    <button
                                      type="button"
                                      onClick={() => openEditRegulationModal(reg)}
                                      className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                                      title="Edit Dokumen Regulasi (Update)"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                      <span>Edit</span>
                                    </button>

                                    {/* Action: DELETE (Hapus Dokumen Regulasi) */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Yakin ingin menghapus dokumen regulasi "${reg.title}"?`)) {
                                          onDeleteRegulation(reg.id);
                                        }
                                      }}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                      title="Hapus Dokumen Regulasi (Delete)"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 1: CRUD USER WITH MENU ACCESS CONTROL */}
      {/* ================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div id="user-crud-dialog" className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                  {editingUser ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingUser ? "Edit Pengguna & Hak Akses" : "Tambah Pengguna Baru"}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi Hak Akses Menu dan Multi-Role Akun</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ID Input with 8 Char Limit */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ID Pengguna / NIP (Tepat 8 Karakter)</label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{formId.length}/8</span>
                </div>
                <input
                  id="modal-input-user-id"
                  type="text"
                  maxLength={8}
                  required
                  disabled={!!editingUser}
                  value={formId}
                  onChange={(e) => setFormId(e.target.value.replace(/\s+/g, ""))}
                  placeholder="Contoh: 19890422 (8 digit)"
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap &amp; Gelar</label>
                <input
                  id="modal-input-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Dewi Lestari, S.E., M.M."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Unit Dropdown */}
              <div>
                <label htmlFor="modal-select-unit" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Satuan Kerja / Unit Eselon <span className="text-rose-500">*</span>
                </label>
                <select
                  id="modal-select-unit"
                  required
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white cursor-pointer transition-colors"
                >
                  <option value="" disabled>
                    -- Pilih Satuan Kerja / Unit Eselon --
                  </option>
                  {formUnit && !SATKER_UNIT_GROUPS.some((g) => g.options.includes(formUnit)) && <option value={formUnit}>{formUnit} (Unit Terdaftar)</option>}
                  {SATKER_UNIT_GROUPS.map((group) => (
                    <optgroup key={group.group} label={group.group} className="font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-850">
                      {group.options.map((unitName) => (
                        <option key={unitName} value={unitName} className="font-normal text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800">
                          {unitName}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Hak Akses Menu: View, Edit, atau Keduanya */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Pengaturan Hak Akses Menu (Role-Based Access Control)</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Tentukan kewenangan akun pada menu: hanya bisa melihat (*view*), mengubah data (*edit*), atau keduanya (*both*).
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormMenuAccess("view")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formMenuAccess === "view"
                        ? "bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <Eye className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                    <div className="text-xs font-bold">Hanya Lihat</div>
                    <div className="text-[10px] text-slate-400">View Only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMenuAccess("edit")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formMenuAccess === "edit"
                        ? "bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <Edit3 className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <div className="text-xs font-bold">Hanya Ubah</div>
                    <div className="text-[10px] text-slate-400">Edit Only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMenuAccess("both")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formMenuAccess === "both"
                        ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <div className="text-xs font-bold">Keduanya</div>
                    <div className="text-[10px] text-slate-400">View &amp; Edit</div>
                  </button>
                </div>
              </div>

              {/* Role: Single Dedicated Role Assignment */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">Role Akun Pengguna</label>
                  <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold">1 Role per Akun</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(["superadmin", "satker", "verifikator"] as UserRole[]).map((r) => {
                    const isChecked = formRoles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => selectSingleRole(r)}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isChecked
                            ? "bg-cyan-50 dark:bg-cyan-950/70 border-cyan-500 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <Shield className={`w-3.5 h-3.5 ${isChecked ? "text-cyan-600" : "text-slate-400"}`} />
                        <span>{r === "superadmin" ? "Super Admin" : r === "satker" ? "Satker" : "Verifikator"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status Akun Aktif:</span>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 border-slate-300 dark:border-slate-700 focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md shadow-cyan-600/30 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL VALIDASI KONFIRMASI BUAT / EDIT USER */}
      {/* ================================================================== */}
      {validationModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
            <div className="px-6 py-4 bg-cyan-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-100" />
                <h3 className="text-sm font-bold tracking-tight">Konfirmasi Simpan Akun Pengguna</h3>
              </div>
              <button onClick={() => setValidationModal(null)} className="p-1 text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">ID / NIP:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded">{validationModal.user.id}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Nama Lengkap:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">{validationModal.user.name}</span>
                </div>
                <div className="flex justify-between items-start pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Satuan Kerja:</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right max-w-xs">{validationModal.user.unit}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Hak Akses Menu:</span>
                  <span className="font-bold text-cyan-700 dark:text-cyan-300">
                    {(validationModal.user.menuAccess || "both") === "both" ? "View & Edit (Penuh)" : validationModal.user.menuAccess === "view" ? "Hanya Lihat (View Only)" : "Hanya Ubah (Edit Only)"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Status Akun:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${validationModal.user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {validationModal.user.isActive ? "Aktif" : "Non-Aktif"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setValidationModal(null)}
                className="h-10 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Kembali Edit
              </button>
              <button
                type="button"
                id="btn-confirm-save-user-validation"
                onClick={handleConfirmValidationSave}
                className="h-10 px-5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md shadow-cyan-600/30 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi &amp; Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 2: FORM UNGGAH / EDIT PERATURAN BARU (PDF) */}
      {/* ================================================================== */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div
            id="regulation-upload-dialog"
            className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                  {editingReg ? <Edit3 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingReg ? "Edit Dokumen Peraturan Acuan AI" : "Unggah Peraturan Baru (PDF)"}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Standar Biaya Masukan &amp; Juknis Resmi Penelaahan AI</p>
                </div>
              </div>
              <button onClick={() => setIsRegModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegulationSubmit} className="p-6 space-y-4">
              {regError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* PDF File Upload Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Berkas Dokumen Peraturan (PDF) {!editingReg && <span className="text-rose-500">*</span>}</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-800/40 transition-colors relative cursor-pointer">
                  <input
                    id="regulation-file-upload-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    required={!editingReg && !regFileName}
                    onChange={handleRegulationFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    {regFileName ? (
                      <div>
                        <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400">{regFileName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Ukuran Berkas: {regFileSize || "Tersimpan"}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Klik atau seret berkas PDF peraturan ke sini</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Mendukung format PDF resmi (Contoh: PMK No. 49/2023)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Lengkap Peraturan / Ketentuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regTitle}
                  onChange={(e) => setRegTitle(e.target.value)}
                  placeholder="Contoh: PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan TA 2026"
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Requirement: "Kategori Dokumen ubah jadi kolom teks bukan drop down" */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Dokumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    placeholder="Contoh: Standar Biaya Masukan (SBM)"
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                {/* Requirement: "tambahkan kolom Tanggal Dimasukkan" */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Dimasukkan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={regDateInserted}
                    onChange={(e) => setRegDateInserted(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Target Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tahun Anggaran</label>
                  <input
                    type="text"
                    value={regTargetYear}
                    onChange={(e) => setRegTargetYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Ringkasan Cakupan</label>
                <textarea
                  rows={3}
                  value={regDescription}
                  onChange={(e) => setRegDescription(e.target.value)}
                  placeholder="Ringkasan cakupan tarif honorarium, konsumsi rapat, perjalanan dinas, standar BAS..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Active Toggle (Aktif / Tidak Aktif digunakan AI) */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="reg-checkbox-active"
                  type="checkbox"
                  checked={regIsActive}
                  onChange={(e) => setRegIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 border-slate-300 dark:border-slate-700 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="reg-checkbox-active" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Aktifkan sebagai rujukan penilaian AI saat ini
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="h-10 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md shadow-cyan-600/30 hover:shadow-lg transition-all cursor-pointer"
                >
                  {editingReg ? "Simpan Perubahan Dokumen" : "Simpan & Unggah Peraturan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      <PdfPreviewModal
        isOpen={previewPdfModal.isOpen}
        onClose={() => setPreviewPdfModal((prev) => ({ ...prev, isOpen: false }))}
        fileName={previewPdfModal.fileName}
        fileDataUrl={previewPdfModal.fileDataUrl}
        title={previewPdfModal.title}
      />
    </div>
  );
};
