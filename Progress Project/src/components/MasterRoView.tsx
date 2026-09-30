import React, { useState, useMemo } from "react";
import { HierarchyItem, AccessPermission, UserAccount } from "../types";
import { Layers, Search, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, FolderGit2, Building2, ShieldCheck, Info, ChevronDown, ChevronUp, X, FileSpreadsheet } from "lucide-react";

interface MasterRoViewProps {
  permission: AccessPermission; // "E" or "V"
  currentUser: UserAccount | null;
  hierarchyData: HierarchyItem[];
  onAddMasterRo?: (item: HierarchyItem) => void;
  onUpdateMasterRo?: (item: HierarchyItem) => void;
  onDeleteMasterRo?: (itemId: string) => void;
}

export const MasterRoView: React.FC<MasterRoViewProps> = ({ permission, currentUser, hierarchyData, onAddMasterRo, onUpdateMasterRo, onDeleteMasterRo }) => {
  const isEditable = permission === "E";

  // Collapse states
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [isCatalogCollapsed, setIsCatalogCollapsed] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("all");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HierarchyItem | null>(null);

  // Form State
  const [formProgram, setFormProgram] = useState("");
  const [formUnitEselon1, setFormUnitEselon1] = useState("");
  const [formKegiatan, setFormKegiatan] = useState("");
  const [formUnitEselon2, setFormUnitEselon2] = useState("");
  const [formPrioritas, setFormPrioritas] = useState("Prioritas Nasional");
  const [formKro, setFormKro] = useState("");
  const [formRo, setFormRo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Unique programs for filter dropdown
  const uniquePrograms = useMemo(() => {
    const set = new Set<string>();
    hierarchyData.forEach((item) => {
      if (item.program) set.add(item.program);
    });
    return Array.from(set);
  }, [hierarchyData]);

  // Dynamic statistics
  const totalItems = hierarchyData.length;
  const totalPrograms = uniquePrograms.length;
  const totalKegiatan = useMemo(() => {
    const set = new Set<string>();
    hierarchyData.forEach((item) => {
      if (item.kegiatan) set.add(item.kegiatan);
    });
    return set.size;
  }, [hierarchyData]);
  const totalKro = useMemo(() => {
    const set = new Set<string>();
    hierarchyData.forEach((item) => {
      if (item.kro) set.add(item.kro);
    });
    return set.size;
  }, [hierarchyData]);

  // Filtered List
  const filteredList = useMemo(() => {
    return hierarchyData.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.program.toLowerCase().includes(q) ||
        item.kegiatan.toLowerCase().includes(q) ||
        item.kro.toLowerCase().includes(q) ||
        item.ro.toLowerCase().includes(q) ||
        item.unitEselon1.toLowerCase().includes(q) ||
        item.unitEselon2.toLowerCase().includes(q);

      const matchProgram = selectedProgramFilter === "all" || item.program === selectedProgramFilter;

      const matchPriority = selectedPriorityFilter === "all" || item.prioritasCheck.toLowerCase().includes(selectedPriorityFilter.toLowerCase());

      return matchSearch && matchProgram && matchPriority;
    });
  }, [hierarchyData, searchTerm, selectedProgramFilter, selectedPriorityFilter]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormProgram(uniquePrograms[0] || "");
    setFormUnitEselon1("01-Sekretariat Jenderal");
    setFormKegiatan("");
    setFormUnitEselon2("");
    setFormPrioritas("Prioritas Nasional");
    setFormKro("");
    setFormRo("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: HierarchyItem) => {
    setEditingItem(item);
    setFormProgram(item.program);
    setFormUnitEselon1(item.unitEselon1);
    setFormKegiatan(item.kegiatan);
    setFormUnitEselon2(item.unitEselon2);
    setFormPrioritas(item.prioritasCheck);
    setFormKro(item.kro);
    setFormRo(item.ro);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Modal Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProgram.trim() || !formKegiatan.trim() || !formKro.trim() || !formRo.trim()) {
      setFormError("Harap lengkapi semua field Program, Kegiatan, KRO, dan RO.");
      return;
    }

    if (editingItem && onUpdateMasterRo) {
      onUpdateMasterRo({
        id: editingItem.id,
        program: formProgram.trim(),
        unitEselon1: formUnitEselon1.trim(),
        kegiatan: formKegiatan.trim(),
        unitEselon2: formUnitEselon2.trim(),
        prioritasCheck: formPrioritas,
        kro: formKro.trim(),
        ro: formRo.trim(),
      });
    } else if (onAddMasterRo) {
      onAddMasterRo({
        id: `ro_${Date.now()}`,
        program: formProgram.trim(),
        unitEselon1: formUnitEselon1.trim(),
        kegiatan: formKegiatan.trim(),
        unitEselon2: formUnitEselon2.trim(),
        prioritasCheck: formPrioritas,
        kro: formKro.trim(),
        ro: formRo.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDeleteItem = (id?: string) => {
    if (!id) return;
    if (onDeleteMasterRo) {
      onDeleteMasterRo(id);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ========================================================================= */}
      {/* VIEW ONLY BANNER (FOR SATKER) */}
      {/* ========================================================================= */}
      {!isEditable && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 flex items-start gap-3 text-sky-900 dark:text-sky-200 shadow-sm">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider block text-[11px] text-sky-800 dark:text-sky-300">Mode Akses: Hanya Lihat (View Only)</span>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
              Sesuai peran <strong>Satker</strong>, Anda memiliki hak akses <strong>View (V)</strong> untuk meninjau katalog Master RO, Program, Kegiatan, dan KRO resmi Kementerian Komunikasi dan
              Digital sebagai panduan pengisian formulir RAB. Modifikasi dan penambahan Master RO hanya dapat dilakukan oleh <strong>Super Admin</strong> dan <strong>ROCAN (verif)</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PEMBAHASAN 1 • RINGKASAN STATISTIK MASTER RO */}
      {/* ========================================================================= */}
      <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500/80 dark:border-cyan-500/80 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm transition-all space-y-6">
        <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md border bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-cyan-400 select-none">
          <Layers className="w-3.5 h-3.5" />
          <span>Statistik Master Data RO</span>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">Ringkasan Parameter Master Rincian Output (RO)</h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isEditable ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"}`}
            >
              {isEditable ? "Edit" : "View"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
            className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <span>{isStatsCollapsed ? "Perluas" : "Minimize"}</span>
            {isStatsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!isStatsCollapsed && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 animate-fadeIn">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold uppercase tracking-wide">Total Master RO</span>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-2 block">{totalItems}</span>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/40 dark:to-cyan-950/20 p-5 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/50 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-xs text-cyan-600 dark:text-cyan-400 block font-semibold uppercase tracking-wide">Program Terdaftar</span>
              <span className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-2 block">{totalPrograms}</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-950/20 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold uppercase tracking-wide">Total Kegiatan</span>
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-2 block">{totalKegiatan}</span>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-950/20 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-xs text-amber-600 dark:text-amber-400 block font-semibold uppercase tracking-wide">Klasifikasi KRO</span>
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-2 block">{totalKro}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. PEMBAHASAN 2 • KATALOG & INPUT MASTER RO */}
      {/* ========================================================================= */}
      <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500/80 dark:border-cyan-500/80 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm transition-all space-y-6">
        <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md border bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-cyan-400 select-none">
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Katalog &amp; Input Master RO</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Katalog Parameter Master Rincian Output (RO)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hierarki anggaran APBN Kementerian Komdigi: Program &bull; Unit Eselon &bull; Kegiatan &bull; KRO &bull; RO.</p>
          </div>

          <div className="flex items-center gap-2.5">
            {isEditable && (
              <button
                type="button"
                id="btn-add-master-ro"
                onClick={handleOpenAddModal}
                className="h-10 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-600/30 hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Master RO</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCatalogCollapsed(!isCatalogCollapsed)}
              className="h-10 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <span>{isCatalogCollapsed ? "Perluas" : "Minimize"}</span>
              {isCatalogCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isCatalogCollapsed && (
          <div className="space-y-5 animate-fadeIn">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari Program, Kegiatan, KRO, atau RO..."
                  className="w-full pl-9 pr-4 h-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Program:</span>
                  <select
                    value={selectedProgramFilter}
                    onChange={(e) => setSelectedProgramFilter(e.target.value)}
                    className="h-10 px-3 max-w-[200px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all truncate cursor-pointer"
                  >
                    <option value="all">Semua Program</option>
                    {uniquePrograms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prioritas:</span>
                  <select
                    value={selectedPriorityFilter}
                    onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                    className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all cursor-pointer"
                  >
                    <option value="all">Semua Prioritas</option>
                    <option value="Prioritas Nasional">Prioritas Nasional</option>
                    <option value="Bukan Prioritas">Bukan Prioritas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Master RO Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">No</th>
                    <th className="px-4 py-3.5 min-w-[220px]">Program &bull; Eselon I</th>
                    <th className="px-4 py-3.5 min-w-[220px]">Kegiatan &bull; Eselon II</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Klasifikasi KRO</th>
                    <th className="px-4 py-3.5 min-w-[220px]">Rincian Output (RO)</th>
                    <th className="px-4 py-3.5 w-32 text-center">Prioritas</th>
                    {isEditable && <th className="px-4 py-3.5 w-24 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={isEditable ? 7 : 6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <span className="text-xs">Tidak ada data Master RO yang cocok dengan pencarian/filter.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredList.slice(0, 100).map((item, idx) => (
                      <tr key={item.id || `${item.program}_${item.kro}_${item.ro}_${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-center font-mono font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.program}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-cyan-600" />
                            <span>{item.unitEselon1}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700 dark:text-slate-300 leading-snug">{item.kegiatan}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Unit: {item.unitEselon2}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-cyan-700 dark:text-cyan-400 block leading-snug">{item.kro}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white block leading-snug">{item.ro}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.prioritasCheck.toLowerCase().includes("prioritas nasional") && !item.prioritasCheck.toLowerCase().includes("bukan")
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {item.prioritasCheck}
                          </span>
                        </td>
                        {isEditable && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Master RO"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(item.id || `${idx}`)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Master RO"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredList.length > 100 && (
              <div className="text-center py-2 text-xs text-slate-400">Menampilkan 100 dari {filteredList.length} total baris Master RO. Gunakan filter pencarian untuk mempersempit hasil.</div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT MASTER RO */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{editingItem ? "Ubah Data Master RO" : "Tambah Master RO Baru"}</h4>
                  <p className="text-[11px] text-slate-400">Masukkan nomenklatur Program, Kegiatan, KRO, dan RO resmi.</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Program <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formProgram}
                  onChange={(e) => setFormProgram(e.target.value)}
                  placeholder="Contoh: 059.GH-Program Komunikasi Publik dan Media"
                  className="w-full px-3.5 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Eselon I</label>
                  <input
                    type="text"
                    value={formUnitEselon1}
                    onChange={(e) => setFormUnitEselon1(e.target.value)}
                    placeholder="Contoh: 01-Sekretariat Jenderal"
                    className="w-full px-3.5 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Eselon II</label>
                  <input
                    type="text"
                    value={formUnitEselon2}
                    onChange={(e) => setFormUnitEselon2(e.target.value)}
                    placeholder="Contoh: 10-Biro Perencanaan & Keuangan"
                    className="w-full px-3.5 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formKegiatan}
                  onChange={(e) => setFormKegiatan(e.target.value)}
                  placeholder="Contoh: 4511-Implementasi Undang-Undang KIP"
                  className="w-full px-3.5 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Klasifikasi Rincian Output (KRO) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formKro}
                    onChange={(e) => setFormKro(e.target.value)}
                    placeholder="Contoh: PBM-Kebijakan Bidang Pelayanan Publik"
                    className="w-full px-3.5 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Prioritas</label>
                  <select
                    value={formPrioritas}
                    onChange={(e) => setFormPrioritas(e.target.value)}
                    className="w-full px-3.5 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all cursor-pointer"
                  >
                    <option value="Prioritas Nasional">Prioritas Nasional</option>
                    <option value="Bukan Prioritas Nasional">Bukan Prioritas Nasional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rincian Output (RO) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formRo}
                  onChange={(e) => setFormRo(e.target.value)}
                  placeholder="Contoh: 001-Rekomendasi Hasil Survey KIP"
                  className="w-full px-3.5 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-md shadow-cyan-600/30 cursor-pointer transition-all">
                  {editingItem ? "Simpan Perubahan" : "Tambahkan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-scaleUp">
            <div className="text-rose-600 mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Hapus Data Master RO?</h4>
            <p className="text-xs text-slate-500 mt-1">Data Master RO ini akan dihapus dari daftar hierarki rujukan sistem.</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button type="button" onClick={() => handleDeleteItem(deleteConfirmId)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
