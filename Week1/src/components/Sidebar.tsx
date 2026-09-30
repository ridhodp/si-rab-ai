import React from "react";
import { Users, FolderArchive, FileSpreadsheet, ClipboardCheck, ListChecks, Layers, ChevronsLeft, ChevronsRight, Settings, LogOut, ShieldCheck } from "lucide-react";
import { UserRole, ActiveMenuKey, UserAccount, StandardMenuKey, ROLE_PERMISSIONS_MATRIX, AccessPermission } from "../types";

interface SidebarProps {
  activeRole: UserRole;
  activeMenu: ActiveMenuKey;
  onSelectMenu: (menu: ActiveMenuKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: UserAccount;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  counts?: {
    users?: number;
    regulations?: number;
    submissions?: number;
    pendingSubmissions?: number;
    criteria?: number;
    masterRo?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeRole, activeMenu, onSelectMenu, isCollapsed, onToggleCollapse, currentUser, onOpenChangePassword, onLogout, counts = {} }) => {
  const getRoleHeaderInfo = () => {
    switch (activeRole) {
      case "superadmin":
        return {
          title: "Super Admin",
          color: "bg-cyan-600 text-white",
          sub: "Pusat Kendali Pengguna & Regulasi",
          activeBg: "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-600/25",
          iconColor: "text-cyan-600 dark:text-cyan-400",
          hoverBg: "hover:bg-cyan-50 dark:hover:bg-cyan-950/40",
        };
      case "verifikator":
        return {
          title: "ROCAN (verif)",
          color: "bg-emerald-600 text-white",
          sub: "Biro Perencanaan & Verifikasi RAB",
          activeBg: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/25",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
        };
      case "satker":
        return {
          title: "Satker",
          color: "bg-blue-600 text-white",
          sub: "Pengusul & Pembuat Dokumen RAB",
          activeBg: "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25",
          iconColor: "text-blue-600 dark:text-blue-400",
          hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-950/40",
        };
    }
  };

  const roleInfo = getRoleHeaderInfo();

  // Helper to determine if a standard menu key is currently active
  const isMenuActive = (targetKey: StandardMenuKey) => {
    if (activeMenu === targetKey) return true;
    if (targetKey === "menu_dashboard" && activeMenu === "menu_dashboard") return true;
    if (targetKey === "menu_users" && activeMenu === "admin_users") return true;
    if (targetKey === "menu_acuan" && activeMenu === "admin_regulations") return true;
    if (targetKey === "menu_checklist" && activeMenu === "verifikator_checklist") return true;
    if (targetKey === "menu_master_ro" && activeMenu === "menu_master_ro") return true;
    if (targetKey === "menu_rab_list" && (activeMenu === "satker_list" || activeMenu === "satker_form")) return true;
    if (targetKey === "menu_verification" && activeMenu === "verifikator_review") return true;
    return false;
  };

  // Master definitions of the 7 functional menus
  const allMenuItems: Array<{
    key: StandardMenuKey;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeColor?: string;
  }> = [
    {
      key: "menu_dashboard",
      label: "Dashboard",
      sublabel: "Ikhtisar & Statistik",
      icon: ShieldCheck,
    },
    {
      key: "menu_users",
      label: "Management User",
      sublabel: "Kelola akun & hak akses",
      icon: Users,
      badgeCount: counts.users ?? 3,
      badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300",
    },
    {
      key: "menu_acuan",
      label: "Input Acuan",
      sublabel: "Regulasi & ketentuan AI",
      icon: FolderArchive,
      badgeCount: counts.regulations ?? 2,
      badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    },
    {
      key: "menu_checklist",
      label: "Input Checklist",
      sublabel: "20 kriteria evaluasi AI",
      icon: ListChecks,
      badgeCount: counts.criteria ?? 20,
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },
    {
      key: "menu_master_ro",
      label: "Input Master RO",
      sublabel: "Hierarki & katalog RO",
      icon: Layers,
      badgeCount: counts.masterRo ?? 58,
      badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
    },
    {
      key: "menu_rab_list",
      label: "Daftar RAB",
      sublabel: "Pengajuan & riwayat dokumen",
      icon: FileSpreadsheet,
      badgeCount: counts.submissions ?? 0,
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    },
    {
      key: "menu_verification",
      label: "Verifikasi",
      sublabel: "Telaah & evaluasi dokumen",
      icon: ClipboardCheck,
      badgeCount: counts.pendingSubmissions ?? 0,
      badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    },
  ];

  // Specific ordering per role:
  // - Super Admin: 1 to 6
  // - ROCAN (verif): Input Acuan, Input Checklist, Input Master RO, > Verifikasi
  // - Satker: Daftar RAB, > Verifikasi, Input Acuan, Input Checklist, Input Master RO
  const getOrderedMenuKeysForRole = (role: UserRole): StandardMenuKey[] => {
    switch (role) {
      case "superadmin":
        return ["menu_users", "menu_acuan", "menu_checklist", "menu_master_ro", "menu_rab_list", "menu_verification"];
      case "verifikator":
        return ["menu_acuan", "menu_checklist", "menu_master_ro", "menu_verification"];
      case "satker":
        return ["menu_rab_list", "menu_verification", "menu_acuan", "menu_checklist", "menu_master_ro"];
    }
  };

  const orderedKeys = getOrderedMenuKeysForRole(activeRole);

  // Filter out any menu where permission is "NONE"
  const visibleMenus = orderedKeys
    .map((key) => {
      const item = allMenuItems.find((m) => m.key === key);
      const perm: AccessPermission = ROLE_PERMISSIONS_MATRIX[key]?.[activeRole] || "NONE";
      return { item, permission: perm };
    })
    .filter((entry): entry is { item: (typeof allMenuItems)[0]; permission: AccessPermission } => {
      return entry.item !== undefined && entry.permission !== "NONE";
    });

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 select-none shadow-xl shadow-slate-200/30 dark:shadow-slate-900/30 h-full ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Top Header & Navigation Links */}
      <div className="flex-1 overflow-y-auto">
        {/* Brand & Collapse Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              type="button"
              onClick={() => onSelectMenu(orderedKeys[0])}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-200 dark:hover:ring-cyan-800 transition-all"
              title="Kembali ke menu utama"
              aria-label="Kembali ke menu utama"
            >
              <svg viewBox="11500 -1000 31200 30000" className="w-8 h-8" style={{ shapeRendering: "geometricPrecision", fillRule: "evenodd", clipRule: "evenodd" }}>
                <path fill="#8F181B" d="M20627.89 7423.87l-3252.76 0c-369.89,0 -672.52,-302.62 -672.52,-672.51l0 -3266.47 3147.98 0c427.52,0 777.3,349.78 777.3,777.3l0 3161.68z"/>
                <path fill="#EDBC1B" d="M34525.8 18941.08l3252.75 0c369.9,0 672.52,302.63 672.52,672.52l0 3266.46 -3147.97 0c-427.52,0 -777.3,-349.78 -777.3,-777.3l0 -3161.68z"/>
                <path fill="#006DB0" d="M18274.52 19558.1c1286.33,0 2338.78,1052.45 2338.78,2338.78l0 3088.97c0,1305.85 1068.42,2374.28 2374.27,2374.28l5446.01 0 0 -5597.71c0,-1207.78 -988.18,-2195.95 -2195.96,-2195.95l-3295.7 0c-1218.01,0 -2221.03,-967.4 -2278.66,-2171.79 -1.74,-36.29 -2.91,-72.79 -2.62,-109.49l22.89 -2845.84c7.02,-872.5 580.91,-1532.69 1626.9,-1532.69l2340.37 0c799.22,0 1453.13,-653.91 1453.13,-1453.14l0 -4029.65 -5476.04 0 0 1585.51 0 2331.18c0,787.93 -582.48,1446.4 -1338.1,1566.1l-3721.2 0c-869.3,0 -1580.54,711.24 -1580.54,1580.54l0 5070.9 4286.47 0z"/>
                <path fill="#00ADE6" d="M39548.64 5653.85l-3524.84 0c-840.61,0 -1528.38,-687.76 -1528.38,-1528.38l0 -2447.65c0,-711.24 -581.92,-1293.16 -1293.15,-1293.16l-4176.36 0 0 3808.55c0,845.76 691.98,1537.75 1537.75,1537.75l2258.54 0c936.98,0 1703.59,766.62 1703.59,1703.59l0 3356.67c0,842.85 -689.59,1532.44 -1532.43,1532.44l-3659.51 0c-811.37,0 -1475.22,663.85 -1475.22,1475.22l0 3627.38c0,833.16 681.66,1514.82 1514.81,1514.82l5152.35 0 0 -5002.11c0,-888.42 726.89,-1615.31 1615.32,-1615.31l3359.03 0c908.08,0 1651.05,-742.97 1651.05,-1651.05l0 -3416.21c0,-881.4 -721.15,-1602.55 -1602.55,-1602.55z"/>
              </svg>
            </button>

            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kementerian Komdigi RI</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  SI-RAB <span className="text-cyan-600 dark:text-cyan-400">AI</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isCollapsed
                ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
            aria-label={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {isCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Section Title */}
        <div className="px-5 pt-5 pb-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu Utama</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">v2.6</span>
            </div>
          ) : (
            <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
          )}
        </div>

        {/* Dynamic Navigation Items based on RBAC matrix */}
        <nav className="px-3 space-y-1 pb-4">
          {visibleMenus.map(({ item }) => {
            const active = isMenuActive(item.key);
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                id={`sidebar-menu-${item.key}`}
                type="button"
                onClick={() => onSelectMenu(item.key)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                  active
                    ? "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                    : `text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60`
                }`}
                title={`${item.label} — ${item.sublabel}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                    active ? "bg-sky-200/60 dark:bg-sky-900/40" : "bg-slate-100 dark:bg-slate-800 group-hover:scale-105"
                  }`}>
                    <Icon className={`w-4.5 h-4.5 transition-colors ${active ? "text-sky-600 dark:text-sky-400" : roleInfo.iconColor}`} />
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{item.label}</div>
                      <div className={`text-[11px] truncate transition-colors ${active ? "text-sky-600/80 dark:text-sky-400/80" : "text-slate-400 dark:text-slate-500"}`}>
                        {item.sublabel}
                      </div>
                    </div>
                  )}
                </div>


              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section: User Actions & Snapshot */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        {/* Action Buttons - removed, now in navbar dropdown */}

        {/* User Info Card */}
        {!isCollapsed && (
          <div className="p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${roleInfo.color} flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{roleInfo.title}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
