import React, { useState, useRef, useEffect } from "react";
import { UserAccount, UserRole } from "../types";
import { User as UserIcon, ChevronDown, LogOut, KeyRound, RefreshCw, ShieldCheck, Building, Menu } from "lucide-react";
export type AppNavTab = "dashboard" | "satker" | "verifikator" | "regulations" | "master" | "superadmin";

interface HeaderProps {
  currentUser: UserAccount;
  activeRole: UserRole;
  activeTab: AppNavTab;
  onSwitchActiveRole: (role: UserRole) => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, activeRole, activeTab, onSwitchActiveRole, onOpenChangePassword, onLogout, onToggleMobileSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case "superadmin":
        return "admin";
      case "satker":
        return "satker";
      case "verifikator":
        return "verifikator";
    }
  };

  const getTabTitle = (tab: AppNavTab) => {
    switch (tab) {
      case "dashboard":
        return "Dashboard Utama";
      case "satker":
        return "Pengajuan Dokumen RAB";
      case "verifikator":
        return "Evaluasi & Verifikasi Dokumen RAB";
      case "regulations":
        return "Manajemen Dokumen Regulasi Acuan";
      case "master":
        return "Master Data & Pengguna Sistem";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button onClick={onToggleMobileSidebar} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:block">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">{getTabTitle(activeTab)}</h2>
          <p className="text-[11px] text-slate-400">Sistem Verifikasi &amp; Telaah Anggaran Berbasis AI &bull; Komdigi RI</p>
        </div>
      </div>

      {/* Right: Quick actions & User Profile Dropdown matching screenshot */}
      <div className="flex items-center gap-3">
        {/* User Profile Pill matching screenshot */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 p-1.5 sm:pl-2.5 sm:pr-3 rounded-full hover:bg-slate-50 border border-slate-200/60 transition-all cursor-pointer group"
          >
            {/* Circular Avatar Icon */}
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
              <UserIcon className="w-5 h-5" />
            </div>

            {/* User Info Texts */}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 leading-tight">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 font-medium leading-tight">{getRoleDisplayName(activeRole)}</div>
            </div>

            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" />
          </button>

          {/* Clean User Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">NIP / ID: {currentUser.id}</div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUser.unit}</span>
                </div>
              </div>

              {/* Multi-role Switcher */}
              {currentUser.roles.length > 1 && (
                <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-cyan-600" />
                    <span>Ganti Hak Akses / Role:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {currentUser.roles.map((r) => {
                      const isActive = r === activeRole;
                      return (
                        <button
                          key={r}
                          onClick={() => {
                            onSwitchActiveRole(r);
                            setDropdownOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                            isActive ? "bg-cyan-500 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Links */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    onOpenChangePassword();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Ubah Kata Sandi</span>
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
