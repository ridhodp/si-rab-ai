"""
PDF Data Extraction Service
Mengekstrak data dari dokumen RAB menjadi format JSON yang terstruktur.
"""
import re
from io import BytesIO
from typing import Any
from pypdf import PdfReader


def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract all text from PDF bytes."""
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(page.strip() for page in pages if page.strip()).strip()
    except Exception as e:
        return f"[Ekstraksi teks gagal: {str(e)}]"


def extract_rab_data(pdf_bytes: bytes) -> dict[str, Any]:
    """
    Ekstrak data terstruktur dari PDF RAB.
    Mengembalikan JSON object dengan data yang rapi dan siap dipakai AI.
    """
    text = extract_pdf_text(pdf_bytes)

    if not text or text.startswith("[Ekstraksi"):
        return {
            "status": "error",
            "message": "Tidak dapat mengekstrak teks dari PDF",
            "rawText": text,
        }

    # Ekstrak kode BAS (6 digit)
    bas_codes = re.findall(r'\b(52\d{4})\b', text)

    # Ekstrak NIP (18 digit)
    nip_match = re.search(r'\b(19\d{16}|20\d{16})\b', text)
    nip = nip_match.group(0) if nip_match else None

    # Ekstrak total anggaran (format: Rp 1.234.567 atau 1.234.567)
    total_patterns = re.findall(
        r'(?:Rp\.?\s*)?(\d{1,3}(?:\.\d{3})+)', text
    )
    # Filter angka yang masuk akal sebagai total (> 100.000)
    amounts = [int(p.replace(".", "")) for p in total_patterns if int(p.replace(".", "")) > 100000]
    total_anggaran = max(amounts) if amounts else None

    # Deteksi komponen biaya utama
    komponen_biaya = []
    komponen_keywords = [
        "Honorarium", "Belanja Bahan", "Belanja Jasa", "Belanja Perjalanan",
        "Belanja Alat", "Belanja Sewa", "Konsumsi", "Transportasi",
        "Narasumber", "Moderator", "Fasilitator", "Akomodasi"
    ]
    for keyword in komponen_keywords:
        if keyword.lower() in text.lower():
            komponen_biaya.append(keyword)

    # Deteksi pengesahan PPK
    has_ppk = any(kw in text.lower() for kw in [
        "pejabat pembuat komitmen", "ppk", "mengetahui", "pengesahan"
    ])

    # Deteksi pajak
    has_ppn = "ppn" in text.lower() or "12%" in text or "11%" in text
    has_pph = "pph" in text.lower() or "pasal 21" in text.lower() or "pasal 23" in text.lower()

    # Deteksi volume dan satuan
    volume_matches = re.findall(
        r'(\d+)\s*(orang|unit|buah|set|hari|jam|lembar|eksemplar|peserta|kegiatan)',
        text.lower()
    )
    volumes = [{"jumlah": int(v[0]), "satuan": v[1]} for v in volume_matches[:10]]

    # Deteksi tanggal
    tanggal_matches = re.findall(
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})',
        text
    )

    return {
        "status": "success",
        "metadata": {
            "totalPages": len(PdfReader(BytesIO(pdf_bytes)).pages),
            "textLength": len(text),
        },
        "strukturAnggaran": {
            "kodeBAS": list(set(bas_codes)),
            "totalAnggaran": total_anggaran,
            "komponenBiaya": komponen_biaya,
        },
        "administrasi": {
            "nipPpk": nip,
            "adaPengesahanPpk": has_ppk,
            "tanggalDokumen": tanggal_matches[:5] if tanggal_matches else [],
        },
        "pajak": {
            "adaPpn": has_ppn,
            "adaPph": has_pph,
        },
        "volumeSatuan": volumes,
        "rawText": text[:50000],  # Batasi untuk menghindari token overflow
    }
