import React, { useState } from "react";
import { UserAccount } from "../types";
import { INITIAL_USERS } from "../data/initialUsers";
import { authApi } from "../services/api";
import { Lock, User, AlertCircle, HelpCircle, ArrowRight, Eye, EyeOff, Sun, Moon, UserPlus } from "lucide-react";

interface LoginViewProps {
  users: UserAccount[];
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, theme = "light", onToggleTheme, onLoginSuccess }) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedId = userId.trim();

    if (trimmedId.length !== 8) {
      setErrorMessage("user ID tidak ditemukan");
      return;
    }

    const foundUser = users.find((u) => u.id === trimmedId) || INITIAL_USERS.find((u) => u.id === trimmedId);

    if (!foundUser) {
      setErrorMessage("user ID tidak ditemukan");
      return;
    }

    if (foundUser.password !== password) {
      setErrorMessage("Password yang Anda masukkan salah.");
      return;
    }

    if (!foundUser.isActive) {
      setErrorMessage("Akun ini sedang dinonaktifkan oleh Administrator.");
      return;m
    }

    onLoginSuccess(foundUser);
  };

  const handleQuickLogin = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);
    setErrorMessage("");

    const targetUser = users.find((u) => u.id === id) || INITIAL_USERS.find((u) => u.id === id);
    if (targetUser) {
      if (!targetUser.isActive) {
        setErrorMessage("Akun ini sedang dinonaktifkan oleh Administrator.");
        return;
      }
      onLoginSuccess(targetUser);
    } else {
      setErrorMessage("user ID tidak ditemukan");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-[#eaf4fd] to-sky-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Right: Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        {onToggleTheme && (
          <button
            id="btn-login-toggle-theme"
            type="button"
            onClick={onToggleTheme}
            className="p-2 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-sky-200/80 dark:border-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center backdrop-blur-xs"
            title={theme === "dark" ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        )}
      </div>

      {/* Single Unified Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 border border-sky-200/90 dark:border-slate-800 rounded-2xl shadow-md shadow-sky-900/5 p-6 sm:p-8 transition-colors">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img
                src="/logo-komdigi-emblem.svg"
                alt="Logo Kementerian Komunikasi dan Digital RI"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-xs transition-transform hover:scale-105"
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Selamat Datang</h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Sistem Verifikasi &amp; Telaah Dokumen Anggaran (RAB) Komdigi RI</p>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Error Message */}
            {errorMessage && (
              <div
                id="login-error-message"
                className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Input User ID */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="user-id-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ID Pengguna / NIP
                </label>
                <span className="text-[10px] text-slate-400 font-mono">{userId.length}/8 Karakter</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="user-id-input"
                  type="text"
                  maxLength={8}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.replace(/\s+/g, ""))}
                  placeholder="Masukkan 8 digit ID (contoh: 19890422)"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 transition-all font-mono tracking-wider shadow-2xs"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button type="button" onClick={() => setShowHelpModal(true)} className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:underline font-medium cursor-pointer">
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Masuk ke Akun</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Register Link */}
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Belum punya akun? Daftar di sini
              </button>
            </div>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center mb-2.5">Akses Cepat Demo Akun:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("19850115", "password123")}
                className="p-2.5 bg-sky-50/60 dark:bg-slate-800 hover:bg-sky-100/70 dark:hover:bg-slate-700/80 border border-sky-200/70 dark:border-slate-700 rounded-xl text-center text-xs transition-colors cursor-pointer group shadow-2xs"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 text-[11px]">Super Admin</div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">19850115</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("19890422", "password123")}
                className="p-2.5 bg-sky-50/60 dark:bg-slate-800 hover:bg-sky-100/70 dark:hover:bg-slate-700/80 border border-sky-200/70 dark:border-slate-700 rounded-xl text-center text-xs transition-colors cursor-pointer group shadow-2xs"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 text-[11px]">Satker</div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">19890422</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("19910718", "password123")}
                className="p-2.5 bg-sky-50/60 dark:bg-slate-800 hover:bg-sky-100/70 dark:hover:bg-slate-700/80 border border-sky-200/70 dark:border-slate-700 rounded-xl text-center text-xs transition-colors cursor-pointer group shadow-2xs"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 text-[11px]">ROCAN (verif)</div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">19910718</div>
              </button>
            </div>
          </div>

          {/* Footer info */}
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6">Kementerian Komunikasi dan Digital Republik Indonesia &bull; 2026</p>
        </div>
      </div>

      {/* "Lupa Password? Hubungi Admin" Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bantuan Reset Password</h3>
                <p className="text-xs text-slate-400">Hubungi Administrator Sistem</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Ketentuan Reset Kata Sandi:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                <li>
                  Pengguna role <strong>SatKer</strong> dan <strong>Verifikator</strong> dapat mengubah password setelah berhasil masuk melalui menu profil.
                </li>
                <li>
                  Jika Anda lupa password akun, silakan hubungi <strong>Super Admin</strong> pada Biro Perencanaan / PDSI Komdigi.
                </li>
                <li>
                  Kontak Helpdesk TI: <strong className="text-cyan-700 dark:text-cyan-400">helpdesk-anggaran@komdigi.go.id</strong>
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <RegisterModal
          theme={theme}
          onClose={() => setShowRegisterModal(false)}
          onRegisterSuccess={() => {
            setShowRegisterModal(false);
            setUserId("");
            setPassword("");
            setErrorMessage("");
          }}
        />
      )}
    </div>
  );
};

// Register Modal Component
const RegisterModal: React.FC<{
  theme: "light" | "dark";
  onClose: () => void;
  onRegisterSuccess: (user: UserAccount) => void;
}> = ({ theme, onClose, onRegisterSuccess }) => {
  const [regId, setRegId] = useState("");
  const [regName, setRegName] = useState("");
  const [regUnit, setRegUnit] = useState("");
  const [regRole, setRegRole] = useState("satker");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (regId.length !== 8) {
      setRegError("ID pengguna harus 8 karakter");
      return;
    }
    if (!regName.trim() || !regUnit.trim()) {
      setRegError("Nama dan unit wajib diisi");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password minimal 6 karakter");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Konfirmasi password tidak cocok");
      return;
    }

    setIsRegistering(true);
    try {
      const user = await authApi.register({
        id: regId,
        name: regName,
        unit: regUnit,
        password: regPassword,
        role: regRole,
      });
      onRegisterSuccess(user);
    } catch (error) {
      // Fallback: register lokal jika API tidak tersedia
      const localUser: UserAccount = {
        id: regId,
        name: regName,
        unit: regUnit,
        roles: [regRole],
        activeRole: regRole,
        password: regPassword,
        isActive: true,
      };
      onRegisterSuccess(localUser);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Akun Baru</h3>
            <p className="text-xs text-slate-400">Lengkapi data di bawah ini</p>
          </div>
        </div>

        {regError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{regError}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ID Pengguna (8 digit)</label>
            <input
              type="text"
              maxLength={8}
              value={regId}
              onChange={(e) => setRegId(e.target.value.replace(/\s+/g, ""))}
              placeholder="Contoh: 19900101"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="Nama lengkap sesuai identitas"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit / Satker</label>
            <input
              type="text"
              value={regUnit}
              onChange={(e) => setRegUnit(e.target.value)}
              placeholder="Contoh: Biro Perencanaan"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
            <select
              value={regRole}
              onChange={(e) => setRegRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            >
              <option value="satker">Satuan Kerja (Satker)</option>
              <option value="verifikator">ROCAN (Verifikator)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Konfirmasi Password</label>
            <input
              type="password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-400 text-white text-xs font-bold rounded-xl shadow-sm shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isRegistering ? "Mendaftar..." : "Daftar Sekarang"}
          </button>
        </form>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
