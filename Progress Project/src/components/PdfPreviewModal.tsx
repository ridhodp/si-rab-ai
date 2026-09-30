import React, { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, FileSpreadsheet, Download, ExternalLink, Upload, CheckCircle2, AlertCircle, FileText, FileCheck } from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileDataUrl?: string;
  title: string;
  metadata?: {
    program?: string;
    kegiatan?: string;
    kro?: string;
    ro?: string;
    unit?: string;
    satkerName?: string;
  };
  onUploadFile?: (file: File) => void;
}

// Convert base64 data URL to a native Blob URL for 100% reliable PDF rendering in Chromium (Chrome/Edge)
function convertDataUrlToBlobUrl(dataUrl: string): string | null {
  if (!dataUrl) return null;
  if (dataUrl.startsWith("blob:") || dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    return dataUrl;
  }
  try {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
    const binaryStr = atob(parts[1]);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Error converting data URL to Blob URL:", err);
    return null;
  }
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose, fileName, fileDataUrl, title, metadata, onUploadFile }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Manage blob URL lifecycle
  useEffect(() => {
    if (!fileDataUrl) {
      setBlobUrl(null);
      return;
    }

    if (fileDataUrl.startsWith("blob:") || fileDataUrl.startsWith("http")) {
      setBlobUrl(fileDataUrl);
      return;
    }

    const createdUrl = convertDataUrlToBlobUrl(fileDataUrl);
    if (createdUrl) {
      setBlobUrl(createdUrl);
      return () => {
        if (createdUrl.startsWith("blob:") && !fileDataUrl.startsWith("blob:")) {
          URL.revokeObjectURL(createdUrl);
        }
      };
    } else {
      setBlobUrl(fileDataUrl);
    }
  }, [fileDataUrl]);

  if (!isOpen) return null;

  const displayUrl = blobUrl || fileDataUrl;

  const handleOpenNewTab = () => {
    if (!displayUrl) return;
    window.open(displayUrl, "_blank");
  };

  const handleDownload = () => {
    if (!displayUrl) return;
    const link = document.createElement("a");
    link.href = displayUrl;
    link.download = fileName || "dokumen_rab.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Top Header & Controls */}
        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-slate-900 dark:text-white gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 rounded-xl shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold truncate text-slate-900 dark:text-white">{title}</h3>
                {fileDataUrl ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Berkas Asli (.PDF)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                    <AlertCircle className="w-3 h-3" /> Belum Ada Berkas PDF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">{fileName || "Dokumen usulan formulir"}</p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {displayUrl && (
              <>
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Buka Dokumen di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Tab Baru</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 rounded-xl transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold border border-cyan-200 dark:border-cyan-800 cursor-pointer"
                  title="Unduh Berkas PDF Asli"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Unduh</span>
                </button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 text-slate-700 dark:text-slate-200">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(60, prev - 15))}
                className="p-1 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Perkecil Tampilan"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 font-medium">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(160, prev + 15))}
                className="p-1 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Perbesar Tampilan"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rotate */}
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Putar Dokumen 90 Derajat"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400 rounded-xl transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 ml-1 cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div className="flex-1 bg-slate-100/70 dark:bg-slate-950/70 p-4 sm:p-6 overflow-auto flex justify-center items-start">
          {displayUrl ? (
            /* Render Native Real Uploaded PDF File with Blob URL support */
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease-out",
              }}
              className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden min-h-[820px] border border-slate-300 flex flex-col"
            >
              <iframe src={displayUrl} title={fileName || "Pratinjau Dokumen PDF RAB"} className="w-full h-[80vh] min-h-[750px] border-none bg-white" />
            </div>
          ) : (
            /* Informative State when No Physical PDF has been uploaded yet */
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease-out",
              }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center text-slate-900 dark:text-white my-auto shadow-md space-y-6"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <FileText className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Berkas PDF Asli Belum Diunggah</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                  Pratinjau ini akan menampilkan dokumen fisik PDF asli secara langsung dan dinamis begitu berkas diunggah melalui formulir Poin 2.
                </p>
              </div>

              {onUploadFile && (
                <div className="flex justify-center pt-1">
                  <label
                    htmlFor="modal-pdf-upload-input"
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah Berkas PDF Sekarang</span>
                  </label>
                  <input
                    id="modal-pdf-upload-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUploadFile(file);
                      }
                    }}
                  />
                </div>
              )}

              {/* Dynamic Metadata from Active Form Selection */}
              <div className="text-left bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 rounded-xl p-4 text-xs space-y-3">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Parameter Usulan Berdasarkan Pilihan Formulir:</span>
                </div>

                {/* Tampilan menurun (vertical stack) dengan Satuan Kerja di posisi paling atas */}
                <div className="flex flex-col space-y-2.5 text-[11px]">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">1. Satuan Kerja / Unit Eselon:</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300 block text-xs mt-0.5 truncate">
                      {metadata?.satkerName || metadata?.unit || "Satker Kementerian Komunikasi dan Digital"}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">2. Program:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs mt-0.5">{metadata?.program || "Belum dipilih"}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">3. Kegiatan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs mt-0.5">{metadata?.kegiatan || "Belum dipilih"}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">4. Output (KRO &bull; RO):</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs mt-0.5">
                      {metadata?.kro || "-"} &bull; {metadata?.ro || "-"}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700 italic">
                  * Seluruh rincian volume, harga satuan, pagu alokasi, serta akun BAS 6-digit akan dibaca dan dievaluasi langsung dari berkas PDF yang Anda lampirkan.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & quick helper */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${displayUrl ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}></span>
            <span>{displayUrl ? "Pratinjau PDF interaktif aktif (Browser Native Engine)" : "Menunggu berkas PDF diunggah"}</span>
          </div>
          {displayUrl && (
            <div className="flex items-center gap-2">
              <span>Tampilan kurang pas?</span>
              <button type="button" onClick={handleOpenNewTab} className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-semibold underline cursor-pointer">
                Buka di Tab Baru &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
