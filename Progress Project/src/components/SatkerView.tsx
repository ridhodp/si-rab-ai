import React, { useState, useEffect } from "react";
import { UserAccount, SubmissionData, ActiveMenuKey, RegulationDocument } from "../types";
import { getUniquePrograms, getKegiatansForProgram, getKrosForKegiatan, getRosForKro, HIERARCHY_DATA } from "../data/budgetData";
import { runAiRabAnalysis } from "../data/defaultCriteria";
import {
  FileSpreadsheet,
  Upload,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Printer,
  ChevronDown,
  ChevronUp,
  Layers,
  Loader2,
  Check,
  FileCheck,
  BookOpen,
  Scale,
  AlertCircle,
  Clock,
  Search,
  FileText,
  ExternalLink,
  RotateCcw,
  Filter,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Info,
  X,
  Pencil,
  History,
  Tag,
  Calendar,
  FolderOpen,
  PlusCircle,
} from "lucide-react";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { PrintableReport } from "./PrintableReport";
import { inspectUploadedRabDocument } from "../utils/pdfInspector";

interface SatkerViewProps {
  currentUser: UserAccount;
  onAddSubmission: (submission: SubmissionData) => void;
  onUpdateSubmission?: (submission: SubmissionData) => void;
  onDeleteSubmission?: (submissionId: string) => void;
  submissions: SubmissionData[];
  regulations?: RegulationDocument[];
  activeMenu?: ActiveMenuKey;
  onSelectMenu?: (menu: ActiveMenuKey) => void;
}

const MONTH_NAMES_ID = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const KATEGORI_OPTIONS = [
  { value: "Kategori 1", label: "RO Wajib" },
  { value: "Kategori 2", label: "RO Prioritas Strategis" },
  { value: "Kategori 3", label: "RO Strategis/Diskresioner" },
  { value: "Kategori 4", label: "RO Non-Strategis" },
];

const KATEGORI_DESCRIPTIONS: Record<string, string> = {
  "Kategori 1":
    "Kategori ini merupakan RO yang bersifat wajib, mengikat, ditetapkan melalui kebijakan penganggaran nasional, dan harus tetap berjalan secara berkelanjutan. Penilaian terhadap RO pada kategori ini tidak ditujukan untuk menilai perlu atau tidaknya RO, melainkan untuk memvalidasi kesesuaian ruang lingkup, kejelasan kebutuhan dasar, dan keterkaitan komponen dengan RO yang diusulkan.",
  "Kategori 2":
    "Kategori ini merupakan RO prioritas yang ditetapkan secara resmi oleh Menteri, dan/atau penguatan layanan esensial. Penilaian RO terhadap kategori ini dilaksanakan secara penuh sesuai parameter penilaian substansi.",
  "Kategori 3":
    "Kategori ini merupakan RO yang memiliki keterkaitan dengan prioritas pembangunan nasional dan pencapaian sasaran kementerian, serta mendukung tugas dan fungsi Satker, namun tidak memenuhi kriteria Kategori 1 maupun Kategori 2.",
  "Kategori 4":
    "Kategori ini merupakan RO yang tidak memenuhi kriteria Kategori 1, Kategori 2, maupun Kategori 3, serta tidak memiliki keterkaitan dengan tugas dan fungsi Satker pengusul, maupun pencapaian sasaran strategis kementerian. Terhadap RO yang masuk ke dalam kategori ini tidak diteruskan ke tahap berikutnya.",
};

export const SatkerView: React.FC<SatkerViewProps> = ({
  currentUser,
  onAddSubmission,
  onUpdateSubmission,
  onDeleteSubmission,
  submissions,
  regulations = [],
  activeMenu = "satker_list",
  onSelectMenu,
}) => {
  const activeRegulations = regulations.filter((r) => r.isActive);

  // Sub Tab state for Daftar RAB vs Form Pengajuan
  const [activeRabSubTab, setActiveRabSubTab] = useState<"list" | "form">(() => {
    return activeMenu === "satker_form" ? "form" : "list";
  });

  useEffect(() => {
    if (activeMenu === "satker_form") {
      setActiveRabSubTab("form");
    } else if (activeMenu === "satker_list" || activeMenu === "menu_rab_list") {
      setActiveRabSubTab("list");
    }
  }, [activeMenu]);

  // ---------------------------------------------------------
  // FORM FILTER PENCARIAN DOKUMEN (5 FIELDS) FOR PEMBAHASAN 2
  // ---------------------------------------------------------
  const [filterJenisDokumen, setFilterJenisDokumen] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Menunggu" | "Diterima" | "Ditolak">("all");
  const [filterTahun, setFilterTahun] = useState<string>("all");
  const [filterBulan, setFilterBulan] = useState<string>("all");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    jenisDokumen: "",
    status: "all" as "all" | "Menunggu" | "Diterima" | "Ditolak",
    tahun: "all",
    bulan: "all",
  });

  const handleApplyFilter = () => {
    setAppliedFilters({
      jenisDokumen: filterJenisDokumen,
      status: filterStatus,
      tahun: filterTahun,
      bulan: filterBulan,
    });
  };

  const handleResetFilter = () => {
    setFilterJenisDokumen("");
    setFilterStatus("all");
    setFilterTahun("all");
    setFilterBulan("all");
    setAppliedFilters({
      jenisDokumen: "",
      status: "all",
      tahun: "all",
      bulan: "all",
    });
  };

  // Minimize States
  const [isPembahasan1Collapsed, setIsPembahasan1Collapsed] = useState(false);
  const [isPembahasan2Collapsed, setIsPembahasan2Collapsed] = useState(false);
  const [isUnifiedFormCollapsed, setIsUnifiedFormCollapsed] = useState(false);
  const [isResultsCollapsed, setIsResultsCollapsed] = useState(false);

  // Modals for Daftar RAB
  const [selectedDetailSubmission, setSelectedDetailSubmission] = useState<SubmissionData | null>(null);
  const [historyPreviewItem, setHistoryPreviewItem] = useState<SubmissionData | null>(null);
  const [historyPrintItem, setHistoryPrintItem] = useState<{
    submission: SubmissionData;
    reportType: "ai-result" | "verified-report";
  } | null>(null);

  // CRUD Modals: Edit & Delete & User Log History
  const [editItem, setEditItem] = useState<SubmissionData | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SubmissionData | null>(null);
  const [historyLogItem, setHistoryLogItem] = useState<SubmissionData | null>(null);

  // Edit form state
  const [editFileName, setEditFileName] = useState("");
  const [editKategori1, setEditKategori1] = useState("");
  const [editKategori2, setEditKategori2] = useState("");
  const [editKategori3, setEditKategori3] = useState("");

  const handleOpenEdit = (sub: SubmissionData) => {
    setEditItem(sub);
    setEditFileName(sub.rabFileName);
    setEditKategori1(sub.kategori1 || "");
    setEditKategori2(sub.kategori2 || "");
    setEditKategori3(sub.kategori3 || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const userLabel = `${currentUser.name} (${currentUser.id})`;
    const timeNow = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) + " WIB";
    const existingAudit = editItem.auditTrail || [];

    const updatedSub: SubmissionData = {
      ...editItem,
      rabFileName: editFileName.trim() || editItem.rabFileName,
      kategori1: editKategori1.trim(),
      kategori2: editKategori2.trim(),
      kategori3: editKategori3.trim(),
      updatedBy: userLabel,
      auditTrail: [
        ...existingAudit,
        {
          action: "UPDATE",
          performedBy: userLabel,
          timestamp: timeNow,
          details: `Pembaruan metadata berkas PDF & kategori (${editFileName.trim()})`,
        },
      ],
    };

    if (onUpdateSubmission) {
      onUpdateSubmission(updatedSub);
    }
    setEditItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    if (onDeleteSubmission) {
      onDeleteSubmission(deleteCandidate.id);
    }
    setDeleteCandidate(null);
  };

  // ---------------------------------------------------------
  // FORM PENGAJUAN RAB BARU STATES
  // ---------------------------------------------------------
  const [programs, setPrograms] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  const [kegiatans, setKegiatans] = useState<{ kegiatan: string; unitEselon1: string }[]>([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState<string>("");

  const [kros, setKros] = useState<{ kro: string; unitEselon2: string; prioritas: string }[]>([]);
  const [selectedKro, setSelectedKro] = useState<string>("");

  const [ros, setRos] = useState<string[]>([]);
  const [selectedRo, setSelectedRo] = useState<string>("");

  const [selectedYear, setSelectedYear] = useState<string>("");

  const [currentUnitEselon1, setCurrentUnitEselon1] = useState<string>("");
  const [currentUnitEselon2, setCurrentUnitEselon2] = useState<string>("");
  const [currentPrioritas, setCurrentPrioritas] = useState<string>("");

  // Kategori RAB (Dropdown)
  const [selectedKategori, setSelectedKategori] = useState<string>("");

  // File Upload State: RAB PDF ONLY
  const [rabFile, setRabFile] = useState<File | null>(null);
  const [rabFileName, setRabFileName] = useState<string>("");
  const [rabDataUrl, setRabDataUrl] = useState<string | undefined>(undefined);
  const [rabBlobUrl, setRabBlobUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Live Form Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // AI Loading & Result States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgressText, setAnalysisProgressText] = useState("");
  const [currentSubmission, setCurrentSubmission] = useState<SubmissionData | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Post-submit Trigger State (Daftar Dokumen Acuan Terkait)
  const [showReferenceDocsTrigger, setShowReferenceDocsTrigger] = useState(false);

  // Init Programs
  useEffect(() => {
    const list = getUniquePrograms();
    setPrograms(list);
  }, []);

  // Cascading Kegiatans
  useEffect(() => {
    if (!selectedProgram) {
      setKegiatans([]);
      setSelectedKegiatan("");
      setCurrentUnitEselon1("");
      return;
    }
    const kList = getKegiatansForProgram(selectedProgram);
    setKegiatans(kList);
    setSelectedKegiatan("");
    setCurrentUnitEselon1("");
  }, [selectedProgram]);

  // Cascading KROs
  useEffect(() => {
    if (!selectedProgram || !selectedKegiatan) {
      setKros([]);
      setSelectedKro("");
      setCurrentUnitEselon2("");
      setCurrentPrioritas("");
      return;
    }
    const kroList = getKrosForKegiatan(selectedProgram, selectedKegiatan);
    setKros(kroList);
    setSelectedKro("");
    setCurrentUnitEselon2("");
    setCurrentPrioritas("");
  }, [selectedProgram, selectedKegiatan]);

  // Cascading ROs
  useEffect(() => {
    if (!selectedProgram || !selectedKegiatan || !selectedKro) {
      setRos([]);
      setSelectedRo("");
      return;
    }
    const roList = getRosForKro(selectedProgram, selectedKegiatan, selectedKro);
    setRos(roList);
    setSelectedRo("");

    const match = HIERARCHY_DATA.find((h) => h.program === selectedProgram && h.kegiatan === selectedKegiatan && h.kro === selectedKro);
    if (match) {
      setCurrentUnitEselon1(match.unitEselon1);
      setCurrentUnitEselon2(match.unitEselon2);
      setCurrentPrioritas(match.prioritasCheck);
    }
  }, [selectedProgram, selectedKegiatan, selectedKro]);

  // Direct file processor
  const handleDirectFileUpload = (file: File) => {
    setRabFile(file);
    setRabFileName(file.name);
    setUploadError(null);

    if (rabBlobUrl && rabBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(rabBlobUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setRabBlobUrl(blobUrl);

    const reader = new FileReader();
    reader.onload = (event) => {
      setRabDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRabUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDirectFileUpload(file);
    }
  };

  // Reset Formulir (Only available when rabFile !== null)
  const handleResetForm = () => {
    setSelectedProgram("");
    setSelectedKegiatan("");
    setSelectedKro("");
    setSelectedRo("");
    setCurrentUnitEselon1("");
    setCurrentUnitEselon2("");
    setCurrentPrioritas("");
    setFormKategori1("");
    setFormKategori2("");
    setFormKategori3("");

    if (rabBlobUrl && rabBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(rabBlobUrl);
    }
    setRabBlobUrl(undefined);
    setRabFile(null);
    setRabFileName("");
    setRabDataUrl(undefined);
    setCurrentSubmission(null);
    setShowReferenceDocsTrigger(false);
    setUploadError(null);
  };

  // Handler untuk memulai revisi dokumen dari Riwayat
  const handleStartRevision = (sub: SubmissionData) => {
    setSelectedProgram(sub.program);
    const kList = getKegiatansForProgram(sub.program);
    setKegiatans(kList);
    setSelectedKegiatan(sub.kegiatan);
    const kroList = getKrosForKegiatan(sub.program, sub.kegiatan);
    setKros(kroList);
    setSelectedKro(sub.kro);
    const roList = getRosForKro(sub.program, sub.kegiatan, sub.kro);
    setRos(roList);
    setSelectedRo(sub.ro);
    setCurrentUnitEselon1(sub.unitEselon1);
    setCurrentUnitEselon2(sub.unitEselon2);
    setCurrentPrioritas(sub.prioritas);
    setFormKategori1(sub.kategori1 || "");
    setFormKategori2(sub.kategori2 || "");
    setFormKategori3(sub.kategori3 || "");

    setSelectedDetailSubmission(null);
    if (onSelectMenu) {
      onSelectMenu("satker_form");
    }

    setTimeout(() => {
      document.getElementById("rab-file-upload-input")?.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  // Relevant submissions for stats & table
  const relevantSubmissions = submissions;

  const waitingCount = relevantSubmissions.filter((s) => s.verificationStatus === "Menunggu").length;
  const acceptedCount = relevantSubmissions.filter((s) => s.verificationStatus === "Diterima").length;
  const rejectedCount = relevantSubmissions.filter((s) => s.verificationStatus === "Ditolak").length;

  // Filtered submissions based on 5-field filter form
  const filteredSubmissions = relevantSubmissions.filter((sub) => {
    // 1. Jenis Dokumen (Teks)
    if (appliedFilters.jenisDokumen.trim()) {
      const q = appliedFilters.jenisDokumen.toLowerCase().trim();
      const matchName = sub.rabFileName.toLowerCase().includes(q);
      const matchKat1 = (sub.kategori1 || "").toLowerCase().includes(q);
      const matchKat2 = (sub.kategori2 || "").toLowerCase().includes(q);
      const matchKat3 = (sub.kategori3 || "").toLowerCase().includes(q);
      const matchProg = sub.program.toLowerCase().includes(q);
      const matchKeg = sub.kegiatan.toLowerCase().includes(q);
      if (!matchName && !matchKat1 && !matchKat2 && !matchKat3 && !matchProg && !matchKeg) {
        return false;
      }
    }

    // 2. Status (Dropdown)
    if (appliedFilters.status !== "all") {
      if (sub.verificationStatus !== appliedFilters.status) {
        return false;
      }
    }

    // 3. Tahun Anggaran (Dropdown/Number)
    if (appliedFilters.tahun !== "all") {
      if (!sub.submittedAt.includes(appliedFilters.tahun) && !sub.ticketNumber.includes(appliedFilters.tahun)) {
        return false;
      }
    }

    // 4. Bulan (Dropdown)
    if (appliedFilters.bulan !== "all") {
      const monthObj = MONTH_NAMES_ID.find((m) => m.value === appliedFilters.bulan);
      const monthPatternNum = `/${appliedFilters.bulan}/`;
      const monthPatternName = monthObj ? monthObj.label.toLowerCase() : "";
      const matchMonth = sub.submittedAt.includes(monthPatternNum) || (monthPatternName && sub.submittedAt.toLowerCase().includes(monthPatternName));
      if (!matchMonth) {
        return false;
      }
    }

    return true;
  });

  // Submit RAB to AI Engine
  const handleAiSubmit = async () => {
    if (!selectedProgram || !selectedKegiatan || !selectedKro || !selectedRo || !selectedYear) {
      setUploadError("Harap lengkapi seluruh pilihan hierarki anggaran (Program, Kegiatan, KRO, RO, dan Tahun) sebelum mengajukan telaah AI.");
      return;
    }
    if (!rabFile) {
      setUploadError("Wajib mengunggah berkas dokumen PDF RAB sebelum mengajukan telaah AI.");
      return;
    }
    setUploadError(null);
    setIsAnalyzing(true);
    const regLabel = activeRegulations.length > 0 ? activeRegulations.map((r) => r.title).join(" & ") : "PMK Standar Biaya Masukan (SBM)";

    setAnalysisProgressText(`Membaca berkas PDF "${rabFileName}"...`);
    await new Promise((r) => setTimeout(r, 350));
    setAnalysisProgressText(`Mengekstraksi konten tabel biaya, kode BAS, dan pagu dari "${rabFileName}"...`);
    await new Promise((r) => setTimeout(r, 450));
    setAnalysisProgressText(`Memvalidasi kepatuhan 20 Kriteria Wajib terhadap ${activeRegulations[0]?.title || "PMK SBM"}...`);
    await new Promise((r) => setTimeout(r, 550));
    setAnalysisProgressText(`Menghasilkan laporan telaah cerdas dokumen "${rabFileName}"...`);

    let analysis: any = null;

    if (rabFile) {
      try {
        const formData = new FormData();
        formData.append("rab_file", rabFile);
        formData.append("program", selectedProgram);
        formData.append("kegiatan", selectedKegiatan);
        formData.append("kro", selectedKro);
        formData.append("ro", selectedRo);
        formData.append("tahun", selectedYear);
        formData.append("unit_eselon1", currentUnitEselon1 || "Direktorat Jenderal Komunikasi Publik dan Media");
        formData.append("unit_eselon2", currentUnitEselon2 || "Direktorat Informasi Publik");
        formData.append("prioritas", currentPrioritas || "Prioritas Nasional");
        formData.append("satker_user_id", currentUser.id);

        const resp = await fetch("http://localhost:8000/api/submissions/upload-and-check", {
          method: "POST",
          body: formData,
        });

        if (resp.ok) {
          const data = await resp.json();
          let cResults = data.ai_criteria_results;
          if (typeof cResults === "string") {
            try {
              cResults = JSON.parse(cResults);
            } catch {
              cResults = null;
            }
          }
          if (Array.isArray(cResults) && cResults.length > 0) {
            analysis = {
              aiStatus: data.ai_status,
              aiScore: data.ai_score,
              aiReason: data.ai_reason,
              aiRecommendation: data.ai_recommendation,
              criteriaResults: cResults,
              activeRegulationTitle: data.activeRegulationTitle || regLabel,
              ticketNumber: data.ticket_number,
            };
          }
        }
      } catch (e) {
        console.info("Backend API belum aktif, beralih ke inspeksi dokumen cerdas langsung dari berkas...");
      }
    }

    if (!analysis) {
      try {
        analysis = await inspectUploadedRabDocument(
          rabFile,
          rabFileName,
          rabFile ? `${(rabFile.size / (1024 * 1024)).toFixed(1)} MB` : "1.8 MB",
          selectedProgram,
          selectedKegiatan,
          selectedKro,
          selectedRo,
          regulations,
        );
      } catch (err) {
        console.warn("inspectUploadedRabDocument error, fallback to runAiRabAnalysis:", err);
        analysis = runAiRabAnalysis(selectedProgram, selectedKegiatan, selectedKro, selectedRo, rabFileName, regulations);
      }
    }

    let finalCriteria = Array.isArray(analysis?.criteriaResults) ? analysis.criteriaResults : [];
    if (finalCriteria.length === 0) {
      const fallbackAnalysis = runAiRabAnalysis(selectedProgram, selectedKegiatan, selectedKro, selectedRo, rabFileName, regulations);
      finalCriteria = fallbackAnalysis.criteriaResults;
      if (!analysis) {
        analysis = fallbackAnalysis;
      }
    }

    const nowFormatted = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) + " WIB";
    const userLabel = `${currentUser.name} (${currentUser.id})`;

    // Generate related reference documents for post-submit trigger
    const refDocs = [
      activeRegulations[0]?.title || "Peraturan Menteri Keuangan No. 49/PMK.02/2023 tentang Standar Biaya Masukan TA 2026",
      "Petunjuk Teknis Penyusunan Dokumen RKA-K/L dan Rincian Anggaran Biaya Kementerian Komunikasi dan Digital RI",
      "Bagan Akun Standar (BAS) 6 Digit Belanja Operasional & Non-Operasional Perbendaharaan RI",
      "Panduan Batas Tarif Standar Honorarium & Perjalanan Dinas Dalam Negeri",
    ];

    const newSubmission: SubmissionData = {
      id: `SUB-${Date.now()}`,
      ticketNumber: analysis?.ticketNumber || `RAB/KOMDIGI/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      satkerUserId: currentUser.id,
      satkerUserName: currentUser.name,
      satkerUnit: currentUser.unit,
      submittedAt: nowFormatted,
      program: selectedProgram,
      kegiatan: selectedKegiatan,
      kro: selectedKro,
      ro: selectedRo,
      unitEselon1: currentUnitEselon1 || "Direktorat Jenderal Komunikasi Publik dan Media",
      unitEselon2: currentUnitEselon2 || "Direktorat Informasi Publik",
      prioritas: currentPrioritas || "Prioritas Nasional",
      rabFileName: rabFileName,
      rabFileSize: rabFile ? `${(rabFile.size / (1024 * 1024)).toFixed(1)} MB` : "1.8 MB",
      pdfDataUrl: rabBlobUrl || rabDataUrl,
      activeRegulationTitle: analysis?.activeRegulationTitle || regLabel,

      // 3 New Category Fields
      kategori: selectedKategori,
      kategori_deskripsi: selectedKategori ? KATEGORI_DESCRIPTIONS[selectedKategori] : "",

      // User Logging Metadata
      createdBy: userLabel,
      updatedBy: userLabel,
      auditTrail: [
        {
          action: "CREATE",
          performedBy: userLabel,
          timestamp: nowFormatted,
          details: `Pendaftaran berkas RAB PDF: ${rabFileName}`,
        },
      ],

      // Related Reference Documents Trigger
      referenceDocuments: refDocs,

      aiStatus: analysis?.aiStatus || "LOLOS",
      aiScore: typeof analysis?.aiScore === "number" ? analysis.aiScore : 100,
      aiReason: analysis?.aiReason || "Penelaahan dokumen RAB berhasil diselesaikan.",
      aiRecommendation: analysis?.aiRecommendation || "Patuhi seluruh standar biaya SBM yang berlaku.",
      criteriaResults: finalCriteria,
      verificationStatus: "Menunggu",
      verifikatorNotes: "",
    };

    setCurrentSubmission(newSubmission);
    setShowReferenceDocsTrigger(true);
    setIsResultsCollapsed(false);
    setIsAnalyzing(false);

    try {
      onAddSubmission(newSubmission);
    } catch (e) {
      console.warn("Could not save to parent submission list:", e);
    }

    setTimeout(() => {
      document.getElementById("post-submit-reference-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 shadow-sm transition-colors relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-800/50 text-xs font-bold text-blue-700 dark:text-blue-300 mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Portal Satuan Kerja (Satker)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {activeMenu === "satker_form" ? "Form Pengajuan Telaah Dokumen RAB Baru" : "Daftar Dokumen RAB & Riwayat Pengajuan"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {activeMenu === "satker_form"
                ? "Isi formulir hierarki anggaran RKA-K/L terpadu, tentukan 3 kategori penanda, unggah dokumen PDF RAB, dan jalankan telaah otomatis AI."
                : "Pantau status verifikasi dokumen RAB, filter berdasarkan jenis dokumen, status, tahun anggaran dan bulan, serta kelola tindakan CRUD berkas."}
            </p>
          </div>


        </div>
      </div>

      {/* Sub Navigation Tabs for Daftar RAB */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveRabSubTab("list")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeRabSubTab === "list"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20 ring-1 ring-cyan-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Daftar &amp; Riwayat Dokumen RAB ({submissions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRabSubTab("form")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeRabSubTab === "form"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20 ring-1 ring-cyan-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Form Pengajuan RAB Baru</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* 1. VIEW SUB-TAB: DAFTAR & RIWAYAT RAB */}
      {/* ================================================================== */}
      {activeRabSubTab === "list" && (
        <div className="space-y-10 sm:space-y-12 animate-fadeIn">
          {/* SECTION 1: PEMBAHASAN 1 • RINGKASAN STATUS VERIFIKASI BERKAS PDF (TETAP SAMA) */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 sm:space-y-7 transition-all">
            {/* Outline Label Badge */}
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
              <FileCheck className="w-3.5 h-3.5" />
              <span>PEMBAHASAN 1 &bull; RINGKASAN STATUS VERIFIKASI BERKAS PDF</span>
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>1. Ringkasan Status Verifikasi Berkas Dokumen PDF RAB</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Statistik keseluruhan dokumen RAB yang diajukan beserta status kelolosan telaah verifikator</p>
              </div>

              <button
                type="button"
                onClick={() => setIsPembahasan1Collapsed(!isPembahasan1Collapsed)}
                className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold"
                title={isPembahasan1Collapsed ? "Perluas Pembahasan 1" : "Minimize Pembahasan 1"}
              >
                <span>{isPembahasan1Collapsed ? "Perluas" : "Minimize"}</span>
                {isPembahasan1Collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isPembahasan1Collapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                {/* 1. Total Berkas PDF */}
                <div className="p-5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Berkas PDF</span>
                    <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{relevantSubmissions.length}</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Seluruh dokumen yang diinput</span>
                </div>

                {/* 2. Menunggu Verifikasi */}
                <div className="p-5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Menunggu Verifikasi</span>
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{waitingCount}</div>
                  <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 block">Menunggu proses telaah</span>
                </div>

                {/* 3. Diterima */}
                <div className="p-5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Diterima / Disetujui</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{acceptedCount}</div>
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block">Memenuhi SBM &amp; disahkan DIPA</span>
                </div>

                {/* 4. Ditolak */}
                <div className="p-5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide">Ditolak / Perlu Revisi</span>
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{rejectedCount}</div>
                  <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1 block">Perlu perbaikan dari Satker</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: PEMBAHASAN 2 • TABEL INFORMASI DOKUMEN PDF & FORM FILTER PENCARIAN DOKUMEN */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 sm:space-y-7 transition-all">
            {/* Outline Label Badge */}
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-blue-600 text-white border-blue-400 select-none">
              <FileText className="w-3.5 h-3.5" />
              <span>PEMBAHASAN 2 &bull; TABEL INFORMASI DOKUMEN PDF RAB</span>
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>2. Tabel Informasi Dokumen PDF Berdasarkan Status &amp; Aksi CRUD</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gunakan form filter pencarian, kelola berkas dengan tombol aksi CRUD, dan pantau history pembuat (Create) serta pembaru (Update) berkas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPembahasan2Collapsed(!isPembahasan2Collapsed)}
                className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto"
                title={isPembahasan2Collapsed ? "Perluas Tabel" : "Minimize Tabel"}
              >
                <span>{isPembahasan2Collapsed ? "Perluas" : "Minimize"}</span>
                {isPembahasan2Collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isPembahasan2Collapsed && (
              <div className="space-y-6 animate-fadeIn">
                {/* ------------------------------------------------------------- */}
                {/* FORM FILTER PENCARIAN DOKUMEN (5 FIELD SESUAI INSTRUKSI) */}
                {/* 1. Jenis Dokumen (Teks) */}
                {/* 2. Status (Dropdown: Diterima, Menunggu, Ditolak) */}
                {/* 3. Tahun Anggaran (Dropdown/Number) */}
                {/* 4. Bulan (Dropdown) */}
                {/* 5. Button Apply Filter */}
                {/* ------------------------------------------------------------- */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsFilterVisible(!isFilterVisible)}
                    className="h-10 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter</span>
                    {isFilterVisible ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {isFilterVisible && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">5 Parameter Penapisan</span>
                  )}
                </div>

                {isFilterVisible && (
                <div className="p-5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* 1. Jenis Dokumen (Input Teks) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        1. Jenis Dokumen <span className="text-slate-400 font-normal lowercase">(teks)</span>
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="filter-jenis-dokumen"
                          type="text"
                          value={filterJenisDokumen}
                          onChange={(e) => setFilterJenisDokumen(e.target.value)}
                          placeholder="Cari jenis dokumen / nama berkas..."
                          className="w-full pl-9 pr-3 h-10 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* 2. Status (Dropdown: Diterima, Menunggu, Ditolak) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">2. Status Verifikasi</label>
                      <select
                        id="filter-status-dropdown"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-2xs cursor-pointer"
                      >
                        <option value="all">Semua Status Penetapan</option>
                        <option value="Menunggu">Menunggu</option>
                        <option value="Diterima">Diterima</option>
                        <option value="Ditolak">Ditolak</option>
                      </select>
                    </div>

                    {/* 3. Tahun Anggaran (Calendar Picker) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">3. Tahun Anggaran</label>
                      <input
                        type="month"
                        id="filter-tahun-dropdown"
                        value={filterTahun === "all" ? "" : filterTahun}
                        onChange={(e) => setFilterTahun(e.target.value ? e.target.value.split("-")[0] : "all")}
                        className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-2xs cursor-pointer"
                      />
                    </div>

                    {/* 4. Bulan Pengajuan (Calendar Picker) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">4. Bulan Pengajuan</label>
                      <input
                        type="month"
                        id="filter-bulan-dropdown"
                        value={filterBulan === "all" ? "" : `2026-${filterBulan}`}
                        onChange={(e) => setFilterBulan(e.target.value ? e.target.value.split("-")[1] : "all")}
                        className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-2xs cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 5. Tombol "Apply Filter" & Reset */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{filteredSubmissions.length}</strong> dari {relevantSubmissions.length} dokumen
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="h-10 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>

                      {/* 5. BUTTON APPLY FILTER */}
                      <button
                        id="btn-apply-filter"
                        type="button"
                        onClick={handleApplyFilter}
                        className="h-10 px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ring-1 ring-cyan-500"
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Apply Filter</span>
                      </button>
                    </div>
                  </div>
                </div>
                )}

                {/* Table of PDF Documents with CRUD actions & User Logging */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/95 dark:bg-slate-800/95 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 uppercase font-black tracking-wider text-xs">
                        <tr>
                          <th className="px-4 py-4 w-12 text-center">No</th>
                          <th className="px-4 py-4 w-40">Kode &amp; Pengajuan</th>
                          <th className="px-4 py-4">Dokumen PDF RAB &amp; Kategori</th>
                          <th className="px-4 py-4">Hierarki Anggaran RKA-K/L</th>
                          <th className="px-4 py-4 w-48">User Logging (Create &amp; Update)</th>
                          <th className="px-4 py-4 w-28 text-center">Hasil AI</th>
                          <th className="px-4 py-4 w-44">Status Verifikasi</th>
                          <th className="px-4 py-4 w-44 text-center">Aksi (CRUD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-14 text-slate-400 dark:text-slate-500">
                              <FileSpreadsheet className="w-9 h-9 mx-auto mb-2.5 opacity-50" />
                              <p className="font-bold text-xs">Tidak ada dokumen PDF RAB yang sesuai dengan filter.</p>
                              <p className="text-[11px] mt-1 text-slate-400">Silakan sesuaikan parameter pencarian atau gunakan menu "Form Pengajuan RAB Baru".</p>
                            </td>
                          </tr>
                        ) : (
                          filteredSubmissions.map((sub, idx) => {
                            const creator = sub.createdBy || `${sub.satkerUserName} (${sub.satkerUserId})`;
                            const updater = sub.updatedBy || creator;

                            return (
                              <tr key={sub.id} className="hover:bg-sky-50/80 dark:hover:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 transition-colors">
                                {/* 1. No */}
                                <td className="px-4 py-4 text-center font-mono font-medium text-slate-400">{idx + 1}</td>

                                {/* 2. Kode & Pengajuan */}
                                <td className="px-4 py-4">
                                  <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 block text-xs">{sub.ticketNumber}</span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{sub.submittedAt}</span>
                                </td>

                                {/* 3. Dokumen PDF RAB & Kategori */}
                                <td className="px-4 py-4">
                                  <div className="flex items-start gap-2.5">
                                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 shrink-0 mt-0.5">
                                      <FileSpreadsheet className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs" title={sub.rabFileName}>
                                        {sub.rabFileName}
                                      </span>
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">{sub.rabFileSize || "2.1 MB"} &bull; Format PDF</span>

                                      {/* Tags Kategori 1, 2, 3 */}
                                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                        {sub.kategori1 && (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                                            {sub.kategori1}
                                          </span>
                                        )}
                                        {sub.kategori2 && (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {sub.kategori2}
                                          </span>
                                        )}
                                        {sub.kategori3 && (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            {sub.kategori3}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 4. Hierarki Anggaran */}
                                <td className="px-4 py-4">
                                  <span className="font-semibold text-slate-900 dark:text-slate-200 block truncate max-w-xs" title={sub.kegiatan}>
                                    {sub.kegiatan}
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-xs mt-0.5">
                                    {sub.kro} &bull; {sub.ro}
                                  </span>
                                </td>

                                {/* 5. User Logging (Create & Update info) */}
                                <td className="px-4 py-4">
                                  <div className="space-y-1">
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">Created: </span>
                                      <span className="truncate block" title={creator}>
                                        {creator}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">Updated: </span>
                                      <span className="truncate block" title={updater}>
                                        {updater}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setHistoryLogItem(sub)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer pt-0.5"
                                    >
                                      <History className="w-3 h-3" />
                                      <span>Lihat History CRUD PDF</span>
                                    </button>
                                  </div>
                                </td>

                                {/* 6. Hasil AI */}
                                <td className="px-4 py-4 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                      sub.aiStatus === "LOLOS"
                                        ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                        : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                    }`}
                                  >
                                    {sub.aiStatus === "LOLOS" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                    {Math.round(sub.aiScore / 5)}/20
                                  </span>
                                </td>

                                {/* 7. Status Verifikasi */}
                                <td className="px-4 py-4">
                                  {sub.verificationStatus === "Menunggu" && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                                      Menunggu
                                    </span>
                                  )}
                                  {sub.verificationStatus === "Diterima" && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      Diterima
                                    </span>
                                  )}
                                  {sub.verificationStatus === "Ditolak" && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                      Ditolak
                                    </span>
                                  )}
                                </td>

                                {/* 8. Aksi (CRUD) */}
                                <td className="px-4 py-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* Read: Detail */}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDetailSubmission(sub)}
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                                      title="Read: Lihat Detail Lengkap"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>

                                    {/* Read: Preview PDF */}
                                    <button
                                      type="button"
                                      onClick={() => setHistoryPreviewItem(sub)}
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 transition-colors cursor-pointer border border-cyan-200 dark:border-cyan-800"
                                      title="Read: Pratinjau Dokumen PDF Asli"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>

                                    {/* Update: Edit Dokumen */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(sub)}
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800"
                                      title="Update: Edit Nama & Kategori Berkas"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Delete: Hapus Dokumen */}
                                    <button
                                      type="button"
                                      onClick={() => setDeleteCandidate(sub)}
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                                      title="Delete: Hapus Dokumen dari Daftar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Print / Cetak PDF */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setHistoryPrintItem({
                                          submission: sub,
                                          reportType: sub.verificationStatus === "Diterima" ? "verified-report" : "ai-result",
                                        })
                                      }
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                                      title="Cetak Dokumen Hasil AI / Berita Acara"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 2. VIEW SUB-TAB: FORM PENGAJUAN RAB BARU */}
      {/* ================================================================== */}
      {activeRabSubTab === "form" && (
        <div className="space-y-10 sm:space-y-12 animate-fadeIn">
          {/* GABUNGAN PEMBAHASAN 1 & PEMBAHASAN 2 MENJADI SATU KESATUAN FORM */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 sm:space-y-7 transition-all">
            {/* Outline Label Badge Terpadu */}
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
              <Upload className="w-3.5 h-3.5" />
              <span>PEMBAHASAN TERPADU &bull; FORMULIR PENGAJUAN TELAAH DOKUMEN RAB BARU</span>
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Formulir Terpadu Hierarki Anggaran &amp; Berkas PDF RAB</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lengkapi hierarki anggaran, tambahkan 3 klasifikasi kategori penanda, unggah dokumen PDF RAB, dan kirim untuk pemeriksaan otomatis AI.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUnifiedFormCollapsed(!isUnifiedFormCollapsed)}
                className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold"
                title={isUnifiedFormCollapsed ? "Perluas Formulir" : "Minimize Formulir"}
              >
                <span>{isUnifiedFormCollapsed ? "Perluas" : "Minimize"}</span>
                {isUnifiedFormCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isUnifiedFormCollapsed && (
              <div className="space-y-6 animate-fadeIn">
                {/* SUB-SECTION A: HIERARKI ANGGARAN RKA-K/L (CASCADING DROPDOWN) */}
                <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">A. Parameter Hierarki Anggaran RKA-K/L (Cascading)</span>

                  <div className="flex flex-col space-y-4">
                    {/* a. Program */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        a. Program <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-program"
                          value={selectedProgram}
                          onChange={(e) => setSelectedProgram(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih Program Anggaran --
                          </option>
                          {programs.map((prog) => (
                            <option key={prog} value={prog} className="dark:bg-slate-800 dark:text-white">
                              {prog}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* b. Kegiatan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        b. Kegiatan <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-kegiatan"
                          value={selectedKegiatan}
                          onChange={(e) => setSelectedKegiatan(e.target.value)}
                          disabled={!selectedProgram || kegiatans.length === 0}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium disabled:opacity-50 shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih Kegiatan --
                          </option>
                          {kegiatans.map((item) => (
                            <option key={item.kegiatan} value={item.kegiatan} className="dark:bg-slate-800 dark:text-white">
                              {item.kegiatan}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* c. KRO */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        c. Klasifikasi Rincian Output (KRO) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-kro"
                          value={selectedKro}
                          onChange={(e) => setSelectedKro(e.target.value)}
                          disabled={!selectedKegiatan || kros.length === 0}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium disabled:opacity-50 shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih KRO --
                          </option>
                          {kros.map((item) => (
                            <option key={item.kro} value={item.kro} className="dark:bg-slate-800 dark:text-white">
                              {item.kro}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* d. RO */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        d. Rincian Output (RO) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-ro"
                          value={selectedRo}
                          onChange={(e) => setSelectedRo(e.target.value)}
                          disabled={!selectedKro || ros.length === 0}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium disabled:opacity-50 shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih RO --
                          </option>
                          {ros.map((item) => (
                            <option key={item} value={item} className="dark:bg-slate-800 dark:text-white">
                              {item}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* e. Tahun */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        e. Tahun Anggaran <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-year"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih Tahun --
                          </option>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() + 5 - i;
                            return (
                              <option key={year} value={String(year)} className="dark:bg-slate-800 dark:text-white">
                                {year}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Info Box Hierarchy */}
                  {(currentUnitEselon1 || currentUnitEselon2 || currentPrioritas) && (
                    <div className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unit Eselon I:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">{currentUnitEselon1 || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unit Eselon II:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">{currentUnitEselon2 || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Prioritas:</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400 block">{currentPrioritas || "Bukan Prioritas Nasional"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* SUB-SECTION B: KATEGORI USULAN RAB (DROPDOWN) */}
                <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">B. Klasifikasi Kategori Usulan RAB</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="select-kategori"
                        value={selectedKategori}
                        onChange={(e) => setSelectedKategori(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium shadow-2xs"
                      >
                        <option value="" disabled>
                          -- Pilih Kategori --
                        </option>
                        {KATEGORI_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="dark:bg-slate-800 dark:text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Deskripsi Kategori
                    </span>
                    <div className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 shadow-2xs min-h-[60px]">
                      {selectedKategori
                        ? KATEGORI_DESCRIPTIONS[selectedKategori]
                        : "Pilih kategori untuk melihat deskripsi."}
                    </div>
                  </div>
                </div>

                {/* SUB-SECTION C: UNGGAH BERKAS DOKUMEN PDF RAB */}
                <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">C. Unggah Berkas Dokumen PDF RAB</span>
                    <span className="text-[11px] text-slate-400 font-medium">Format: .pdf</span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                          rabFile
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{rabFileName || "Belum ada berkas PDF dipilih"}</span>
                          {rabFile ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] rounded-full font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {(rabFile.size / (1024 * 1024)).toFixed(2)} MB &bull; PDF Terpilih
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] rounded-full font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Wajib Unggah PDF
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pilih dokumen PDF RAB resmi Satker Anda untuk diperiksa kepatuhan tarif dan kalkulasi anggarannya.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                      <label
                        htmlFor="rab-file-upload-input"
                        className="h-10 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs inline-flex items-center justify-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>{rabFile ? "Ganti Berkas PDF" : "Pilih Berkas PDF"}</span>
                      </label>
                      <input id="rab-file-upload-input" type="file" accept=".pdf" onChange={handleRabUpload} className="hidden" />

                      {rabFile && (
                        <button
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          className="h-10 px-4 bg-sky-50 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 hover:bg-cyan-100 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                {/* Aturan Spesifik: Tombol Hapus/Reset Formulir HANYA MUNCUL setelah user selesai memilih berkas PDF */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    {rabFile !== null ? (
                      <button
                        id="btn-satker-reset"
                        type="button"
                        onClick={handleResetForm}
                        className="h-11 sm:h-12 px-5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 hover:border-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 shadow-2xs cursor-pointer animate-fadeIn"
                        title="Hapus / Reset Formulir (muncul setelah memilih berkas PDF)"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>Hapus / Reset Formulir</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Tombol reset formulir akan muncul setelah Anda memilih berkas PDF.</span>
                    )}
                  </div>

                  <button
                    id="btn-satker-submit"
                    type="button"
                    disabled={isAnalyzing}
                    onClick={handleAiSubmit}
                    className="h-11 sm:h-12 px-6 sm:px-8 bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-cyan-600/30 hover:shadow-lg active:scale-98 transition-all disabled:opacity-60 cursor-pointer ring-1 ring-cyan-500"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{analysisProgressText || "Memproses Pengecekan AI..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Submit &amp; Periksa RAB dengan AI (LLM)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Loading Progress Banner */}
          {isAnalyzing && (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xs transition-colors">
              <div className="inline-flex p-4 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 mb-2">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Engine AI LLM Sedang Menelaah Dokumen RAB</h3>
              <p className="text-xs text-cyan-700 dark:text-cyan-400 font-mono animate-pulse">{analysisProgressText}</p>
              <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-3/4 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TRIGGER POST-SUBMIT: DAFTAR DOKUMEN ACUAN TERKAIT BERKAS PDF  */}
          {/* MUNCUL KETIKA PENGAJUAN TELAH BERHASIL DILAKUKAN              */}
          {/* ------------------------------------------------------------- */}
          {showReferenceDocsTrigger && currentSubmission && (
            <div
              id="post-submit-reference-section"
              className="relative bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-600 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-5 animate-fadeIn"
            >
              {/* Outline Label Badge */}
              <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-emerald-600 text-white border-emerald-400 select-none">
                <BookOpen className="w-3.5 h-3.5" />
                <span>POST-SUBMIT TRIGGER &bull; DOKUMEN ACUAN TERKAIT BERKAS PDF</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-200/80 dark:border-emerald-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Pengajuan Berhasil &bull; Kode {currentSubmission.ticketNumber}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Berkas PDF "{currentSubmission.rabFileName}" telah terdaftar. Berikut adalah daftar dokumen acuan regulasi resmi terkait:
                    </p>
                  </div>
                </div>

                {onSelectMenu && (
                  <button
                    type="button"
                    onClick={() => onSelectMenu("satker_list")}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
                  >
                    <span>Lihat di Daftar RAB</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* List of Related Reference Documents */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider block">Daftar Dokumen Acuan Terkait Berkas PDF yang Baru Diunggah:</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentSubmission.referenceDocuments || []).map((doc, idx) => (
                    <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 shadow-2xs">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-snug">{doc}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">Dokumen Regulasi Acuan AI</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Results Section */}
          {currentSubmission && !isAnalyzing && (
            <div
              id="ai-results-section"
              className="relative bg-white dark:bg-slate-900 border-2 border-amber-500 dark:border-amber-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 animate-fadeIn"
            >
              {/* Outline Label Badge */}
              <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-amber-600 text-white border-amber-400 select-none">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HASIL PENELAAHAN AI &bull; 20 KRITERIA KEPATUHAN SBM</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Laporan Evaluasi Penapisan AI Dokumen RAB</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Kode: {currentSubmission.ticketNumber} &bull; Skor: {Math.round(currentSubmission.aiScore / 5)}/20 ({currentSubmission.aiStatus})
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="h-9 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Laporan Telaah AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsResultsCollapsed(!isResultsCollapsed)}
                    className="h-9 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <span>{isResultsCollapsed ? "Perluas" : "Minimize"}</span>
                    {isResultsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isResultsCollapsed && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div>
                      <strong className="text-slate-900 dark:text-white">Alasan AI: </strong>
                      <span className="text-slate-700 dark:text-slate-300">{currentSubmission.aiReason}</span>
                    </div>
                    {currentSubmission.aiRecommendation && (
                      <div>
                        <strong className="text-slate-900 dark:text-white">Rekomendasi AI: </strong>
                        <span className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{currentSubmission.aiRecommendation}</span>
                      </div>
                    )}
                  </div>

                  {/* 20 Criteria Preview List */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold sticky top-0">
                        <tr>
                          <th className="px-4 py-3 w-12 text-center">No</th>
                          <th className="px-4 py-3">Kriteria Wajib SBM</th>
                          <th className="px-4 py-3 w-28 text-center">Hasil AI</th>
                          <th className="px-4 py-3">Catatan Bukti AI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentSubmission.criteriaResults.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                            <td className="px-4 py-2.5 text-center font-mono text-slate-400">{c.id}</td>
                            <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{c.text}</td>
                            <td className="px-4 py-2.5 text-center">
                              {c.status === "passed" ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">Lolos</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold">Ditolak</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{c.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: DETAIL SUBMISSION (READ)                                     */}
      {/* ================================================================== */}
      {selectedDetailSubmission && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 border border-cyan-200 dark:border-cyan-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">Informasi Detail Dokumen RAB</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-bold">
                      {selectedDetailSubmission.ticketNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Diajukan pada {selectedDetailSubmission.submittedAt} &bull; {selectedDetailSubmission.satkerUserName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailSubmission(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Status Banner */}
              <div className="p-4 rounded-xl border flex items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Verifikasi:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">{selectedDetailSubmission.verificationStatus}</span>
                  {selectedDetailSubmission.verifikatorNotes && <p className="text-slate-600 dark:text-slate-300 mt-1">Catatan: {selectedDetailSubmission.verifikatorNotes}</p>}
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    selectedDetailSubmission.aiStatus === "LOLOS"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  AI: {selectedDetailSubmission.aiStatus} ({Math.round(selectedDetailSubmission.aiScore / 5)}/20)
                </span>
              </div>

              {/* Hierarchy and Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">Hierarki Anggaran RKA-K/L</span>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Program:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{selectedDetailSubmission.program}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kegiatan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{selectedDetailSubmission.kegiatan}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">KRO &bull; RO:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {selectedDetailSubmission.kro} &bull; {selectedDetailSubmission.ro}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">Klasifikasi Kategori &amp; User Logging</span>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kategori 1:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.kategori1 || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kategori 2:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.kategori2 || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kategori 3:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.kategori3 || "-"}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Created By:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.createdBy || selectedDetailSubmission.satkerUserName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDetailSubmission(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: EDIT DOKUMEN (UPDATE CRUD)                                  */}
      {/* ================================================================== */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold">Edit Metadata Dokumen RAB</h3>
              </div>
              <button type="button" onClick={() => setEditItem(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Dokumen PDF</label>
                <input
                  type="text"
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori 1</label>
                <input
                  type="text"
                  value={editKategori1}
                  onChange={(e) => setEditKategori1(e.target.value)}
                  placeholder="Kategori 1..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori 2</label>
                <input
                  type="text"
                  value={editKategori2}
                  onChange={(e) => setEditKategori2(e.target.value)}
                  placeholder="Kategori 2..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori 3</label>
                <input
                  type="text"
                  value={editKategori3}
                  onChange={(e) => setEditKategori3(e.target.value)}
                  placeholder="Kategori 3..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Pembaruan ini akan dicatat ke dalam log history dengan akun pembaru: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: KONFIRMASI HAPUS DOKUMEN (DELETE CRUD)                      */}
      {/* ================================================================== */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Hapus Dokumen</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tindakan ini akan menghapus dokumen dari sistem pengajuan RAB.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold block text-slate-900 dark:text-white truncate">{deleteCandidate.rabFileName}</span>
              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{deleteCandidate.ticketNumber}</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button type="button" onClick={handleConfirmDelete} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs">
                Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: LOG HISTORY CRUD FILE PDF (USER LOGGING AUDIT TRAIL)       */}
      {/* ================================================================== */}
      {historyLogItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold">History CRUD Dokumen PDF</h3>
              </div>
              <button type="button" onClick={() => setHistoryLogItem(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">{historyLogItem.rabFileName}</span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{historyLogItem.ticketNumber}</span>
              </div>

              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">Aktivitas Pengguna (User Logging):</span>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {(historyLogItem.auditTrail && historyLogItem.auditTrail.length > 0
                    ? historyLogItem.auditTrail
                    : [
                        {
                          action: "CREATE" as const,
                          performedBy: historyLogItem.createdBy || `${historyLogItem.satkerUserName} (${historyLogItem.satkerUserId})`,
                          timestamp: historyLogItem.submittedAt,
                          details: `Pendaftaran dokumen awal: ${historyLogItem.rabFileName}`,
                        },
                      ]
                  ).map((entry, i) => (
                    <div key={i} className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.action === "CREATE"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : entry.action === "UPDATE"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {entry.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{entry.timestamp}</span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white mt-1">Oleh: {entry.performedBy}</div>
                      {entry.details && <p className="text-[11px] text-slate-500 dark:text-slate-400">{entry.details}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryLogItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History PDF Preview Modal */}
      {historyPreviewItem && (
        <PdfPreviewModal
          isOpen={!!historyPreviewItem}
          onClose={() => setHistoryPreviewItem(null)}
          fileName={historyPreviewItem.rabFileName}
          fileDataUrl={historyPreviewItem.pdfDataUrl}
          title={`Pratinjau Dokumen RAB: ${historyPreviewItem.ticketNumber}`}
          metadata={{
            program: historyPreviewItem.program,
            kegiatan: historyPreviewItem.kegiatan,
            kro: historyPreviewItem.kro,
            ro: historyPreviewItem.ro,
            unit: historyPreviewItem.unitEselon1,
            satkerName: historyPreviewItem.satkerUserName,
          }}
        />
      )}

      {/* History Printable Report Modal */}
      {historyPrintItem && <PrintableReport isOpen={!!historyPrintItem} onClose={() => setHistoryPrintItem(null)} submission={historyPrintItem.submission} reportType={historyPrintItem.reportType} />}

      {/* PDF Preview Modal for RAB (Live Form) */}
      <PdfPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fileName={rabFileName || "Dokumen Usulan RAB"}
        fileDataUrl={rabBlobUrl || rabDataUrl}
        title="Pratinjau Dokumen RAB (Rincian Anggaran Biaya)"
        metadata={{
          program: selectedProgram,
          kegiatan: selectedKegiatan,
          kro: selectedKro,
          ro: selectedRo,
          unit: currentUnitEselon1,
          satkerName: currentUser.name,
        }}
        onUploadFile={handleDirectFileUpload}
      />

      {/* Printable Report Modal (Live Form) */}
      {currentSubmission && <PrintableReport isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} submission={currentSubmission} reportType="ai-result" />}
    </div>
  );
};
