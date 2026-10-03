"""
Ollama Local AI Service
Menjalankan model AI lokal (Qwen3.5:4B) melalui Ollama API.
"""
import os
import json
import requests
from typing import Any

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")


def analyze_rab_with_ollama(extracted_data: dict[str, Any]) -> dict[str, Any]:
    """
    Kirim hasil ekstraksi PDF ke model Ollama untuk analisis.
    """
    # Siapkan prompt dengan data terstruktur
    prompt = f"""Anda adalah Pejabat Verifikator Anggaran Ahli Kementerian Keuangan & Komdigi RI.
Telaah dokumen PDF Rincian Anggaran Biaya (RAB) berikut terhadap 20 Kriteria Wajib.

DATA EKSTRAKSI PDF (TERSTRUKTUR):
{json.dumps(extracted_data, indent=2, ensure_ascii=False)}

PEDOMAN TELAAH:
1. Bandingkan setiap rincian akun belanja, komponen biaya, dan satuan tarif terhadap batas tertinggi Standar Biaya Masukan (SBM) dan Juknis.
2. Jika terdapat honorarium narasumber, biaya konsumsi rapat, uang harian perjadin, sewa fasilitas, atau harga satuan yang MELEBIHI batas tarif pada dokumen peraturan acuan, berikan status "failed" pada kriteria terkait dan sebutkan batas tarif maksimal dari dokumen acuan pada kolom "notes".
3. Periksa ketaatan Bagan Akun Standar (BAS 6 digit), pemisahan biaya pokok/pendukung, kalkulasi perkalian, tarif pajak PPN (12%) / PPh, serta lembar pengesahan PPK bertanda tangan & NIP.

20 Kriteria Wajib:
1. Bagan Akun Standar (BAS 6 digit)
2. Belanja Bahan (521211) sesuai SBM
3. Belanja Konsumsi Rapat (521219)
4. Belanja Honor Output Kegiatan (521213)
5. Belanja Jasa Profesi Narasumber (522151)
6. Belanja Sewa Gedung/Ruangan (522141)
7. Belanja Langganan Daya & Jasa (522111)
8. Belanja Pemeliharaan Peralatan (523121)
9. Biaya Perjalanan Dinas Dalam Negeri (524111)
10. Transportasi Lokal & Uang Harian SBM
11. Kesesuaian Volume & Satuan Ukur
12. Kejelasan Komponen Biaya Rinci
13. Pemisahan Biaya Pokok & Biaya Pendukung
14. Perhitungan Matematis Perkalian Akurat
15. Perlakuan Pajak PPN (12%) / PPh Pasal 21/23
16. Rasionalitas Harga Pasar & Tidak Pemborosan
17. Tidak Terdapat Duplikasi Anggaran
18. Total Biaya Tidak Melampaui Batas Pagu
19. Rekapitulasi Rincian Sinkron dengan Total Akhir
20. Lembar Pengesahan PPK Bertanda Tangan & NIP

Balas HANYA dalam format JSON valid:
{{
  "aiStatus": "LOLOS" atau "TIDAK LOLOS",
  "aiScore": integer 0-100,
  "aiReason": "ringkasan uraian temuan dengan menyebutkan rujukan berkas dan peraturan acuan",
  "aiRecommendation": "langkah tindak lanjut rekomendasi mengacu pada peraturan acuan",
  "activeRegulationTitle": "nama peraturan acuan",
  "criteriaResults": [
    {{
      "id": 1,
      "text": "nama kriteria",
      "status": "passed" atau "failed",
      "notes": "bukti kutipan dari file RAB dan perbandingannya dengan regulasi acuan",
      "verifierStatus": "Lolos" atau "Ditolak",
      "verifierNotes": ""
    }}, ... 20 kriteria lengkap
  ]
}}
"""

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_ctx": 8192,
                },
            },
            timeout=120,
        )
        response.raise_for_status()

        raw_text = response.json().get("response", "").strip()
        # Bersihkan markdown code block jika ada
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        result = json.loads(raw_text.strip())
        return result

    except requests.exceptions.ConnectionError:
        print(f"Ollama tidak dapat dihubungi di {OLLAMA_BASE_URL}. Pastikan Ollama berjalan.")
        return None
    except Exception as e:
        print(f"Ollama analysis failed: {str(e)}")
        return None


def check_ollama_available() -> bool:
    """Cek apakah Ollama server tersedia."""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except Exception:
        return False
