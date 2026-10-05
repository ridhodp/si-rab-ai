import React from "react";
import { X, HelpCircle, ShieldCheck, Users, FolderArchive, ListChecks, Layers, FileSpreadsheet, ClipboardCheck, LayoutDashboard } from "lucide-react";
import { UserRole, ActiveMenuKey } from "../types";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: UserRole;
  activeMenu: ActiveMenuKey;
}

interface MenuGuide {
  title: string;
  icon: React.ElementType;
  description: string;
  steps: string[];
  tips: string[];
}

const getMenuGuides = (role: UserRole): Record<string, MenuGuide> => {
  const guides: Record<string, MenuGuide> = {
    menu_dashboard: {
      title: "Dashboard",
      icon: LayoutDashboard,
      description: "Halaman utama yang menampilkan ringkasan metrik kinerja, status arsip aktif, dan usulan terbaru.",
      steps: [
        "Lihat statistik utama: total pengguna, regulasi aktif, dan dokumen RAB",
        "Periksa status verifikasi terbaru di bagian riwayat pengajuan",
        "Gunakan tombol 'Pengajuan Baru' di Pembahasan 2 untuk pengajuan cepat",
      ],
      tips: [
        "Dashboard menampilkan data real-time berdasarkan role Anda",
        "Klik kartu statistik untuk melihat detail lebih lanjut",
      ],
    },
    menu_users: {
      title: "Management User",
      icon: Users,
      description: "Kelola akun pengguna sistem, termasuk tambah, edit, dan nonaktifkan akun.",
      steps: [
        "Klik 'Tambah User Baru' untuk membuat akun baru",
        "Isi formulir: nama, NIP/ID, unit, role, dan password",
        "Klik ikon edit untuk mengubah data pengguna",
        "Klik ikon nonaktif untuk menonaktifkan akun sementara",
      ],
      tips: [
        "Setiap user bisa memiliki lebih dari satu role",
        "Password default harus diganti saat login pertama",
        "Nonaktifkan akun jika user sudah tidak aktif",
      ],
    },
    menu_acuan: {
      title: "Input Acuan",
      icon: FolderArchive,
      description: "Manajemen regulasi dan ketentuan standar AI yang digunakan sebagai acuan verifikasi.",
      steps: [
        "Klik 'Upload Regulasi Baru' untuk menambah dokumen acuan",
        "Isi metadata: judul, kategori, tahun, dan deskripsi",
        "Upload file PDF regulasi",
        "Atur status aktif/nonaktif untuk regulasi",
      ],
      tips: [
        "Regulasi aktif akan digunakan AI sebagai acuan verifikasi",
        "Pastikan PDF sudah sebelum upload",
        "Gunakan kategori yang konsisten untuk memudahkan pencarian",
      ],
    },
    menu_checklist: {
      title: "Input Checklist",
      icon: ListChecks,
      description: "20 kriteria evaluasi AI yang digunakan untuk verifikasi dokumen RAB.",
      steps: [
        "Lihat daftar 20 kriteria evaluasi yang tersedia",
        "Klik 'Edit' untuk mengubah teks kriteria",
        "Aktifkan/nonaktifkan kriteria sesuai kebutuhan",
        "Kriteria aktif akan digunakan dalam proses verifikasi AI",
      ],
      tips: [
        "Kriteria harus jelas dan terukur",
        "Maksimal 20 kriteria aktif bersamaan",
        "Review kriteria secara berkala",
      ],
    },
    menu_master_ro: {
      title: "Input Master RO",
      icon: Layers,
      description: "Hierarki dan katalog Result Organization (RO) untuk klasifikasi RAB.",
      steps: [
        "Klik 'Tambah RO Baru' untuk menambah data RO",
        "Isi hierarki: Program → Kegiatan → KRO → RO",
        "Tandai prioritas nasional jika diperlukan",
        "Gunakan filter untuk mencari RO tertentu",
      ],
      tips: [
        "Struktur RO harus mengikuti hierarki resmi",
        "Prioritas nasional ditandai dengan label khusus",
        "Data RO digunakan saat pengisian form RAB",
      ],
    },
    menu_rab_list: {
      title: "Daftar RAB",
      icon: FileSpreadsheet,
      description: "Pengajuan dan riwayat dokumen RAB yang telah dibuat.",
      steps: [
        "Klik tombol 'Pengajuan Baru' di Pembahasan 2 untuk membuat pengajuan",
        "Isi formulir: pilih RO, isi komponen anggaran",
        "Upload file PDF RAB resmi",
        "Klik 'Kirim' untuk submit ke verifikator",
        "Pantau status: Menunggu → Diproses → Selesai",
      ],
      tips: [
        "Pastikan PDF RAB sudah final sebelum upload",
        "Anda bisa melihat hasil verifikasi AI sebelum submit",
        "Dokumen yang sudah dikirim tidak bisa diubah",
      ],
    },
    menu_verification: {
      title: "Verifikasi Dokumen",
      icon: ClipboardCheck,
      description: "Telaah anggaran dan penilaian AI terhadap dokumen RAB yang masuk.",
      steps: [
        "Pilih dokumen dari antrian verifikasi",
        "Lihat hasil analisis AI otomatis",
        "Review 20 kriteria evaluasi satu per satu",
        "Beri catatan dan keputusan: Lolos / Ditolak",
        "Submit hasil verifikasi",
      ],
      tips: [
        "AI memberikan rekomendasi, keputusan akhir ada di verifikator",
        "Pastikan semua kriteria sudah direview",
        "Catatan verifikasi harus jelas dan konstruktif",
      ],
    },
  };

  // Filter guides based on role
  if (role === "superadmin") return guides;
  if (role === "verifikator") {
    const { menu_users, menu_rab_list, ...rest } = guides;
    return rest;
  }
  if (role === "satker") {
    const { menu_users, menu_verification, ...rest } = guides;
    return rest;
  }
  return guides;
};

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case "superadmin": return "Super Admin";
    case "verifikator": return "ROCAN (Verifikator)";
    case "satker": return "Satuan Kerja (Satker)";
  }
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, activeRole, activeMenu }) => {
  if (!isOpen) return null;

  const guides = getMenuGuides(activeRole);
  const currentGuide = guides[activeMenu] || guides["menu_dashboard"];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Panduan Penggunaan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(activeRole)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Current Menu Guide */}
          {currentGuide && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                  <currentGuide.icon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentGuide.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentGuide.description}</p>
                </div>
              </div>

              {/* Steps */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Cara Menggunakan</h4>
                <ol className="space-y-2">
                  {currentGuide.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Tips</h4>
                <ul className="space-y-1.5">
                  {currentGuide.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* All Menus for Role */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Menu yang Tersedia untuk Role Anda</h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(guides).map(([key, guide]) => {
                const Icon = guide.icon;
                const isActive = key === activeMenu;
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isActive
                        ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800"
                        : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-cyan-100 dark:bg-cyan-900/40"
                        : "bg-slate-100 dark:bg-slate-700"
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold truncate ${isActive ? "text-cyan-700 dark:text-cyan-300" : "text-slate-700 dark:text-slate-300"}`}>
                        {guide.title}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{guide.description}</div>
                    </div>
                    {isActive && (
                      <span className="ml-auto px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold rounded-full shrink-0">
                        Aktif
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
            Butuh bantuan lebih? Hubungi administrator sistem
          </p>
        </div>
      </div>
    </div>
  );
};
