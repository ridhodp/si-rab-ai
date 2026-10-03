import React, { useState, useEffect } from "react";
import { ChevronsRight, ChevronsLeft, HelpCircle, CheckCircle2, LogOut, AlertCircle, X } from "lucide-react";
import { UserAccount, UserRole, SubmissionData, RegulationDocument, ActiveMenuKey, StandardMenuKey, ROLE_PERMISSIONS_MATRIX, HierarchyItem } from "./types";
import { INITIAL_USERS, INITIAL_SUBMISSIONS } from "./data/initialUsers";
import { INITIAL_REGULATIONS } from "./data/initialRegulations";
import { HIERARCHY_DATA } from "./data/budgetData";
import { LoginView } from "./components/LoginView";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { SuperAdminView } from "./components/SuperAdminView";
import { SatkerView } from "./components/SatkerView";
import { VerifikatorView } from "./components/VerifikatorView";
import { MasterRoView } from "./components/MasterRoView";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { HelpModal } from "./components/HelpModal";
import {
  authApi,
  usersApi,
  regulationsApi,
  submissionsApi,
  masterRoApi,
  criteriaApi,
  toUserAccount,
  toRegulationDocument,
  toSubmissionData,
  toHierarchyItem,
} from "./services/api";

// Helper to map any ActiveMenuKey to StandardMenuKey
export const toStandardMenuKey = (menuKey: ActiveMenuKey): StandardMenuKey => {
  switch (menuKey) {
    case "menu_users":
    case "admin_users":
      return "menu_users";
    case "menu_acuan":
    case "admin_regulations":
      return "menu_acuan";
    case "menu_checklist":
    case "verifikator_checklist":
      return "menu_checklist";
    case "menu_master_ro":
      return "menu_master_ro";
    case "menu_rab_list":
    case "satker_list":
    case "satker_form":
      return "menu_rab_list";
    case "menu_verification":
    case "verifikator_review":
      return "menu_verification";
    default:
      return "menu_users";
  }
};

// Default menu when entering a role
export const getDefaultMenuForRole = (role: UserRole): StandardMenuKey => {
  switch (role) {
    case "superadmin":
      return "menu_users";
    case "verifikator":
      return "menu_acuan";
    case "satker":
      return "menu_rab_list";
  }
};

export default function App() {
  // Users State (Single-Role per User: Super Admin, Satker, Verifikator; filter out old multi-role id "19871212")
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem("rab_app_users");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((u) => u.id && u.id.length === 8)) {
          return parsed.filter((u: UserAccount) => u.id !== "19871212");
        }
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem("rab_app_users");
    return INITIAL_USERS;
  });

  // Regulations State (Dokumen Peraturan / Standar SBM yang dimasukkan Super Admin / ROCAN)
  const [regulations, setRegulations] = useState<RegulationDocument[]>(() => {
    const saved = localStorage.getItem("rab_app_regulations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_REGULATIONS;
  });

  // Master RO & Hierarki State
  const [masterRoList, setMasterRoList] = useState<HierarchyItem[]>(() => {
    const saved = localStorage.getItem("rab_app_master_ro");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return HIERARCHY_DATA.map((item, idx) => ({ ...item, id: `ro_${idx + 1}` }));
  });

  // Submissions State
  const [submissions, setSubmissions] = useState<SubmissionData[]>(() => {
    const saved = localStorage.getItem("rab_app_submissions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((s) => s.satkerUserId && s.satkerUserId.length === 8)) {
          const hasDitolak = parsed.some((s: SubmissionData) => s.verificationStatus === "Ditolak");
          if (!hasDitolak) {
            const ditolakMock = INITIAL_SUBMISSIONS.find((s) => s.verificationStatus === "Ditolak");
            if (ditolakMock) {
              return [...parsed, ditolakMock];
            }
          }
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem("rab_app_submissions");
    return INITIAL_SUBMISSIONS;
  });

  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("rab_app_current_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.id.length === 8 && parsed.id !== "19871212") {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem("rab_app_current_user");
    return null;
  });

  // Dedicated Single Role per Account
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    if (currentUser) {
      return currentUser.roles[0] || currentUser.activeRole || "satker";
    }
    return "satker";
  });

  // Dynamic Navigation Menu Key - initialized according to activeRole & RBAC table
  const [activeMenu, setActiveMenu] = useState<ActiveMenuKey>(() => {
    const savedUser = localStorage.getItem("rab_app_current_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && u.roles && u.roles[0]) {
          return getDefaultMenuForRole(u.roles[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return "menu_dashboard";
  });

  // Dashboard View State
  const [showDashboard, setShowDashboard] = useState(true);

  // Sidebar Collapsed State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Help Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Theme State: 'light' or 'dark' (Persistent)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("rab_app_theme");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Toast State
  const [toast, setToast] = useState<{ title: string; message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (title: string, message: string, type: "success" | "info" | "error") => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, regulationsData, submissionsData, masterRoData, criteriaData] = await Promise.all([
          usersApi.getAll(),
          regulationsApi.getAll(),
          submissionsApi.getAll(),
          masterRoApi.getAll(),
          criteriaApi.getAll(),
        ]);

        const mappedUsers = usersData.map(toUserAccount);
        if (mappedUsers.length > 0) setUsers(mappedUsers);
        if (regulationsData.length > 0) setRegulations(regulationsData.map(toRegulationDocument));
        if (submissionsData.length > 0) setSubmissions(submissionsData.map((s) => toSubmissionData(s, mappedUsers)));
        if (masterRoData.length > 0) setMasterRoList(masterRoData.map(toHierarchyItem));
      } catch (error) {
        // API tidak tersedia - fallback ke data lokal secara diam-diam
        console.warn("API tidak tersedia, menggunakan data lokal:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync theme to <html> tag classList and localStorage
  useEffect(() => {
    localStorage.setItem("rab_app_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Sync to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem("rab_app_users", JSON.stringify(users));
    } catch (e) {
      console.warn("Could not sync users to localStorage:", e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem("rab_app_master_ro", JSON.stringify(masterRoList));
    } catch (e) {
      console.warn("Could not sync masterRoList to localStorage:", e);
    }
  }, [masterRoList]);

  useEffect(() => {
    try {
      const sanitized = regulations.map((reg) => {
        if (reg.pdfDataUrl && reg.pdfDataUrl.length > 20000) {
          const { pdfDataUrl, ...rest } = reg;
          return rest;
        }
        return reg;
      });
      localStorage.setItem("rab_app_regulations", JSON.stringify(sanitized));
    } catch (e) {
      console.warn("Could not sync regulations to localStorage:", e);
      try {
        const stripped = regulations.map(({ pdfDataUrl, ...rest }) => rest);
        localStorage.setItem("rab_app_regulations", JSON.stringify(stripped));
      } catch (e2) {
        console.warn("Fallback sync regulations failed:", e2);
      }
    }
  }, [regulations]);

  useEffect(() => {
    try {
      const sanitized = submissions.map((sub) => {
        if (sub.pdfDataUrl && sub.pdfDataUrl.length > 20000) {
          const { pdfDataUrl, ...rest } = sub;
          return rest;
        }
        return sub;
      });
      localStorage.setItem("rab_app_submissions", JSON.stringify(sanitized));
    } catch (e) {
      console.warn("Could not sync submissions to localStorage:", e);
      try {
        const stripped = submissions.map(({ pdfDataUrl, ...rest }) => rest);
        localStorage.setItem("rab_app_submissions", JSON.stringify(stripped));
      } catch (e2) {
        console.warn("Fallback sync submissions failed:", e2);
      }
    }
  }, [submissions]);

  // Sync currentUser and verify activeMenu permission
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("rab_app_current_user", JSON.stringify(currentUser));
        const role = currentUser.roles[0] || currentUser.activeRole || "satker";
        setActiveRole(role);

        // Ensure activeMenu is allowed for the user's role
        setActiveMenu((currMenu) => {
          const std = toStandardMenuKey(currMenu);
          const perm = ROLE_PERMISSIONS_MATRIX[std]?.[role] || "NONE";
          if (perm !== "NONE") {
            return currMenu;
          }
          return getDefaultMenuForRole(role);
        });
      } else {
        localStorage.removeItem("rab_app_current_user");
      }
    } catch (e) {
      console.warn("Could not sync currentUser to localStorage:", e);
    }
  }, [currentUser]);

  // Handle Login
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    const role = user.roles[0] || user.activeRole || "satker";
    setActiveRole(role);
    setActiveMenu(getDefaultMenuForRole(role));
    showToast("Berhasil Masuk", `Selamat datang, ${user.name}`, "success");
  };

  // Handle Logout
  const handleLogout = () => {
    const userName = currentUser?.name;
    setCurrentUser(null);
    localStorage.removeItem("rab_app_current_user");
    showToast("Berhasil Keluar", userName ? `Sampai jumpa, ${userName}` : "Anda telah keluar dari sistem", "info");
  };

  // User CRUD by Super Admin
  const handleAddUser = async (newUser: UserAccount) => {
    try {
      await usersApi.create(newUser);
      setUsers([newUser, ...users]);
    } catch (error) {
      console.error("Gagal menambah user:", error);
      setUsers([newUser, ...users]);
    }
  };

  const handleUpdateUser = async (updatedUser: UserAccount) => {
    try {
      await usersApi.update(updatedUser.id, updatedUser);
    } catch (error) {
      console.error("Gagal update user:", error);
    }
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      const role = updatedUser.roles[0] || updatedUser.activeRole || "satker";
      setActiveRole(role);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersApi.delete(userId);
    } catch (error) {
      console.error("Gagal hapus user:", error);
    }
    setUsers(users.filter((u) => u.id !== userId));
  };

  // Regulation Documents CRUD
  const handleAddRegulation = async (newReg: RegulationDocument) => {
    try {
      await regulationsApi.create(newReg);
    } catch (error) {
      console.error("Gagal menambah regulasi:", error);
    }
    setRegulations([newReg, ...regulations]);
  };

  const handleUpdateRegulation = async (updatedReg: RegulationDocument) => {
    try {
      await regulationsApi.update(updatedReg.id, updatedReg);
    } catch (error) {
      console.error("Gagal update regulasi:", error);
    }
    setRegulations(regulations.map((r) => (r.id === updatedReg.id ? updatedReg : r)));
  };

  const handleDeleteRegulation = async (regId: string) => {
    try {
      await regulationsApi.delete(regId);
    } catch (error) {
      console.error("Gagal hapus regulasi:", error);
    }
    setRegulations(regulations.filter((r) => r.id !== regId));
  };

  const handleToggleRegulationActive = async (regId: string) => {
    try {
      await regulationsApi.toggle(regId);
    } catch (error) {
      console.error("Gagal toggle regulasi:", error);
    }
    setRegulations(regulations.map((r) => (r.id === regId ? { ...r, isActive: !r.isActive } : r)));
  };

  // Master RO CRUD
  const handleAddMasterRo = async (newItem: HierarchyItem) => {
    try {
      await masterRoApi.create(newItem);
    } catch (error) {
      console.error("Gagal menambah Master RO:", error);
    }
    setMasterRoList([newItem, ...masterRoList]);
  };

  const handleUpdateMasterRo = async (updatedItem: HierarchyItem) => {
    if (!updatedItem.id) return;
    try {
      await masterRoApi.update(updatedItem.id, updatedItem);
    } catch (error) {
      console.error("Gagal update Master RO:", error);
    }
    setMasterRoList(masterRoList.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleDeleteMasterRo = async (itemId: string) => {
    try {
      await masterRoApi.delete(itemId);
    } catch (error) {
      console.error("Gagal hapus Master RO:", error);
    }
    setMasterRoList(masterRoList.filter((item) => item.id !== itemId));
  };

  // Change Password
  const handleUpdatePassword = (newPassword: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, password: newPassword };
    setCurrentUser(updated);
    setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
  };

  // SatKer Submission
  const handleAddSubmission = (newSub: SubmissionData) => {
    setSubmissions([newSub, ...submissions]);
  };

  // Verifikator Decision Update
  const handleUpdateSubmission = (updatedSub: SubmissionData) => {
    setSubmissions(submissions.map((s) => (s.id === updatedSub.id ? updatedSub : s)));
  };

  // SatKer / Super Admin Delete Submission
  const handleDeleteSubmission = (submissionId: string) => {
    setSubmissions(submissions.filter((s) => s.id !== submissionId));
  };

  // Toast Notification Element (rendered di semua kondisi)
  const toastElement = toast ? (
    <div className="fixed top-20 right-4 z-[80] animate-in slide-in-from-right duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-sm ${
          toast.type === "success"
            ? "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800"
            : toast.type === "info"
            ? "bg-sky-50/95 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800"
            : "bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === "success"
              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
              : toast.type === "info"
              ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
              : "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : toast.type === "info" ? <LogOut className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-900 dark:text-white">{toast.title}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{toast.message}</div>
        </div>
        <button
          onClick={() => setToast(null)}
          className="ml-2 p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
          aria-label="Tutup notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  ) : null;

  // Loading Screen
  if (isLoading) {
    return (
      <div className="h-screen bg-sky-100/75 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto animate-pulse">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render Login View
  if (!currentUser) {
    return (
      <>
        <LoginView users={users} theme={theme} onToggleTheme={handleToggleTheme} onLoginSuccess={handleLogin} />
        {toastElement}
      </>
    );
  }

  // Canonical standard menu and permission for current view
  const stdKey = toStandardMenuKey(activeMenu);
  const currentPermission = ROLE_PERMISSIONS_MATRIX[stdKey]?.[activeRole] || "NONE";

  return (
    <div className="h-screen bg-sky-100/75 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200 antialiased overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigasi Dinamis Berdasarkan Role (Super Admin, ROCAN, Satker) */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-30 transform transition-transform duration-300 ease-in-out h-full
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${!isMobileSidebarOpen ? 'invisible lg:visible' : 'visible'}
        ${isSidebarCollapsed ? 'hidden lg:block' : 'block'}
      `}>
        <Sidebar
          activeRole={activeRole}
          activeMenu={activeMenu}
          onSelectMenu={(menu) => {
            setActiveMenu(menu);
            setIsMobileSidebarOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => {
            if (window.innerWidth < 1024) {
              setIsMobileSidebarOpen(!isMobileSidebarOpen);
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }
          }}
          currentUser={currentUser}
          onOpenChangePassword={() => {
            setIsPasswordModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onLogout={handleLogout}
          counts={{
            users: users.length,
            regulations: regulations.filter((r) => r.isActive).length,
            submissions: submissions.length,
            pendingSubmissions: submissions.filter((s) => s.verificationStatus === "Menunggu").length,
            criteria: 20,
            masterRo: masterRoList.length,
          }}
        />
      </div>

      {/* Main Content: Area Dinamis Menampilkan Isi Halaman Sesuai Matriks Hak Akses (E & V) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navigation Bar */}
        <Navbar
          currentUser={currentUser}
          activeRole={activeRole}
          activeMenu={activeMenu}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenChangePassword={() => setIsPasswordModalOpen(true)}
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {currentPermission === "NONE" ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Anda tidak memiliki hak akses ke modul menu ini.</p>
              <button
                type="button"
                onClick={() => setActiveMenu(getDefaultMenuForRole(activeRole))}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Kembali ke Menu Utama
              </button>
            </div>
          ) : (
            <>
              {/* 0. DASHBOARD UTAMA */}
              {stdKey === "menu_dashboard" && (
                <DashboardView
                  currentUser={currentUser}
                  submissions={submissions}
                  regulations={regulations}
                  onNavigate={(menu) => setActiveMenu(menu as ActiveMenuKey)}
                />
              )}

              {/* 1. MANAGEMENT USER */}
              {stdKey === "menu_users" && (
                <SuperAdminView
                  users={users}
                  currentUser={currentUser}
                  regulations={regulations}
                  activeMenu="admin_users"
                  permission="E"
                  onSelectMenu={setActiveMenu}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onAddRegulation={handleAddRegulation}
                  onUpdateRegulation={handleUpdateRegulation}
                  onDeleteRegulation={handleDeleteRegulation}
                  onToggleRegulationActive={handleToggleRegulationActive}
                />
              )}

              {/* 2. INPUT ACUAN (ARSIP REGULASI) */}
              {stdKey === "menu_acuan" && (
                <SuperAdminView
                  users={users}
                  currentUser={currentUser}
                  regulations={regulations}
                  activeMenu="admin_regulations"
                  permission={currentPermission}
                  onSelectMenu={setActiveMenu}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onAddRegulation={handleAddRegulation}
                  onUpdateRegulation={handleUpdateRegulation}
                  onDeleteRegulation={handleDeleteRegulation}
                  onToggleRegulationActive={handleToggleRegulationActive}
                />
              )}

              {/* 3. INPUT CHECKLIST (MASTER 20 KRITERIA) */}
              {stdKey === "menu_checklist" && (
                <VerifikatorView
                  currentUser={currentUser}
                  submissions={submissions}
                  onUpdateSubmission={handleUpdateSubmission}
                  activeMenu="verifikator_checklist"
                  permission={currentPermission}
                  onSelectMenu={setActiveMenu}
                  regulations={regulations}
                />
              )}

              {/* 4. INPUT MASTER RO */}
              {stdKey === "menu_master_ro" && (
                <MasterRoView
                  permission={currentPermission}
                  currentUser={currentUser}
                  hierarchyData={masterRoList}
                  onAddMasterRo={handleAddMasterRo}
                  onUpdateMasterRo={handleUpdateMasterRo}
                  onDeleteMasterRo={handleDeleteMasterRo}
                />
              )}

              {/* 5. DAFTAR RAB (PENGAJUAN & RIWAYAT) */}
              {stdKey === "menu_rab_list" && (
                <SatkerView
                  currentUser={currentUser}
                  onAddSubmission={handleAddSubmission}
                  onUpdateSubmission={handleUpdateSubmission}
                  onDeleteSubmission={handleDeleteSubmission}
                  submissions={submissions}
                  regulations={regulations}
                  activeMenu={activeMenu}
                  onSelectMenu={setActiveMenu}
                />
              )}

              {/* 6. > VERIFIKASI (TELAAH ANGGARAN & PENILAIAN AI) */}
              {stdKey === "menu_verification" && (
                <VerifikatorView
                  currentUser={currentUser}
                  submissions={submissions}
                  onUpdateSubmission={handleUpdateSubmission}
                  activeMenu="verifikator_review"
                  permission={currentPermission}
                  onSelectMenu={setActiveMenu}
                  regulations={regulations}
                />
              )}
            </>
          )}
        </main>

        {/* Clean Minimalist Footer */}
        <footer className="border-t border-sky-200/80 dark:border-slate-800/80 py-4 text-center text-xs text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs print:hidden transition-colors">
          Sistem Verifikasi &amp; Telaah Otomatis File RAB Berbasis AI &bull; Kementerian Komunikasi dan Digital Republik Indonesia &bull; 2026
        </footer>
        </div>

      {/* Toast Notification */}
      {toastElement}

      {/* Floating Help Button */}
      <button
        onClick={() => setIsHelpModalOpen(true)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
        title="Panduan Penggunaan"
        aria-label="Panduan Penggunaan"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Modals */}
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} currentUser={currentUser} onUpdatePassword={handleUpdatePassword} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} activeRole={activeRole} activeMenu={activeMenu} />
    </div>
  );
}
