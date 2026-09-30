import React, { useState, useMemo } from "react";
import { SubmissionData, UserAccount, RegulationDocument } from "../types";
import { Search, Plus, Eye, FileText, CheckCircle2, Clock, XCircle, FileSpreadsheet, BookOpen, AlertCircle, ChevronDown } from "lucide-react";

interface DashboardViewProps {
  currentUser: UserAccount;
  submissions: SubmissionData[];
  regulations: RegulationDocument[];
  onNavigate: (menu: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, submissions, regulations, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenisDokumen, setFilterJenisDokumen] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterTanggalTerdaftar, setFilterTanggalTerdaftar] = useState("");
  const [filterTanggalBerakhir, setFilterTanggalBerakhir] = useState("");

  // Statistics
  const totalArsipAktif = submissions.length;
  const totalMouDisetujui = submissions.filter((s) => s.verificationStatus === "Diterima").length;
  const menungguVerifikasi = submissions.filter((s) => s.verificationStatus === "Menunggu").length;
  const regulasiAktif = regulations.filter((r) => r.isActive).length;

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchSearch =
        !searchTerm ||
        sub.rabFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.satkerUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.program.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === "semua" || sub.verificationStatus.toLowerCase() === filterStatus.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [submissions, searchTerm, filterStatus]);

  // Recent submissions (latest 5)
  const recentSubmissions = filteredSubmissions.slice(0, 5);

  const getStatusAiColor = (status: string, score: number) => {
    if (status === "LOLOS") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    }
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
  };

  const getStatusVerifikasiColor = (status: string) => {
    switch (status) {
      case "Diterima":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      case "Ditolak":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard Utama</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ringkasan metrik kinerja, status arsip aktif & usulan terbaru</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sky-50 dark:bg-sky-950/30 rounded-2xl p-5 border border-sky-200/60 dark:border-sky-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Total Arsip Aktif</span>
              <div className="text-3xl font-extrabold text-sky-700 dark:text-sky-300 mt-2">{totalArsipAktif}</div>
              <span className="text-[11px] text-sky-600/80 dark:text-sky-400/80 mt-1 block">Dokumen aktif</span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <FileText className="w-7 h-7 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-200/60 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total MOU • Disetujui</span>
              <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">{totalMouDisetujui}</div>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">Nota kesepahaman / Telaah selesai</span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Menunggu Verifikasi</span>
              <div className="text-3xl font-extrabold text-amber-700 dark:text-amber-300 mt-2">{menungguVerifikasi}</div>
              <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 block">Antrean verifikator anggaran</span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-violet-50 dark:bg-violet-950/30 rounded-2xl p-5 border border-violet-200/60 dark:border-violet-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Regulasi Acuan Aktif</span>
              <div className="text-3xl font-extrabold text-violet-700 dark:text-violet-300 mt-2">{regulasiAktif}</div>
              <span className="text-[11px] text-violet-600/80 dark:text-violet-400/80 mt-1 block">PMK Standar Biaya Masukan</span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-violet-500 dark:text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul dokumen, tiket, Satker, atau nama berkas..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Jenis Dokumen:</span>
            <select
              value={filterJenisDokumen}
              onChange={(e) => setFilterJenisDokumen(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            >
              <option value="semua">Semua</option>
              <option value="rab">RAB</option>
              <option value="mou">MOU</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            >
              <option value="semua">Semua</option>
              <option value="menunggu">Menunggu</option>
              <option value="diterima">Diterima</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tanggal Terdaftar:</span>
            <input
              type="date"
              value={filterTanggalTerdaftar}
              onChange={(e) => setFilterTanggalTerdaftar(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tanggal Berakhir:</span>
            <input
              type="date"
              value={filterTanggalBerakhir}
              onChange={(e) => setFilterTanggalBerakhir(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Dokumen Terbaru */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Dokumen Terbaru</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daftar seluruh usulan dokumen Rincian Anggaran Biaya (RAB) dan Nota Kesepahaman aktif</p>
          </div>
          <button
            onClick={() => onNavigate("menu_rab_list")}
            className="h-10 px-4 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-teal-600/25 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Usulan RAB Baru</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Judul</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Satker Pengusul</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tanggal</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Status AI</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Verifikasi</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada dokumen</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Mulai buat usulan RAB baru</p>
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white leading-snug max-w-md">{sub.program}</div>
                      <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono mt-1">
                        {sub.ticketNumber} &bull; {sub.rabFileName}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{sub.satkerUserName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub.satkerUnit}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700 dark:text-slate-300">{formatDate(sub.submittedAt)}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub.submittedAt.includes("WIB") ? sub.submittedAt.split(" ").slice(-2).join(" ") : ""}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusAiColor(sub.aiStatus, sub.aiScore)}`}
                      >
                        {sub.aiStatus === "LOLOS" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {sub.aiStatus === "LOLOS" ? "Lolos" : "Revisi"} ({Math.round(sub.aiScore / 5)}/20)
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusVerifikasiColor(sub.verificationStatus)}`}
                      >
                        {sub.verificationStatus === "Diterima" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {sub.verificationStatus === "Menunggu" && <Clock className="w-3.5 h-3.5" />}
                        {sub.verificationStatus === "Ditolak" && <XCircle className="w-3.5 h-3.5" />}
                        {sub.verificationStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => onNavigate("menu_rab_list")}
                        className="p-2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-all cursor-pointer"
                        title="Preview Dokumen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
