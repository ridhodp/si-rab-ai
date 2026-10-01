"""
Seed script untuk memasukkan data awal ke database.
Jalankan: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models import User, Regulation, Submission, MasterRo, Criterion
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Buat tabel jika belum ada
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_users():
    users = [
        {
            "id": "19850115",
            "name": "Budi Santoso, S.Kom., M.T.",
            "unit": "Biro Perencanaan",
            "roles": ["superadmin"],
            "active_role": "superadmin",
            "password": "password123",
            "phone": "081234567890"
        },
        {
            "id": "19890422",
            "name": "Rina Kusuma, S.E., M.Si.",
            "unit": "Direktorat Pengelolaan Media Publik",
            "roles": ["satker"],
            "active_role": "satker",
            "password": "password123",
            "phone": "081234567891"
        },
        {
            "id": "19910718",
            "name": "Ahmad Fauzi, S.E., Ak., CA",
            "unit": "Inspektorat / Verifikasi Anggaran",
            "roles": ["verifikator"],
            "active_role": "verifikator",
            "password": "password123",
            "phone": "081234567892"
        }
    ]

    for u in users:
        existing = db.query(User).filter(User.id == u["id"]).first()
        if not existing:
            user = User(
                id=u["id"],
                name=u["name"],
                unit=u["unit"],
                roles=u["roles"],
                active_role=u["active_role"],
                password_hash=pwd_context.hash(u["password"]),
                is_active=True,
                phone=u["phone"]
            )
            db.add(user)
            print(f"  ✓ User: {u['name']}")
        else:
            print(f"  - User sudah ada: {u['name']}")

def seed_regulations():
    regulations = [
        {
            "id": "REG-2026-001",
            "title": "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
            "category": "Standar Biaya Masukan (SBM)",
            "description": "Standar Biaya Masukan untuk perencanaan anggaran",
            "file_name": "PMK_49_2023_SBM.pdf",
            "file_path": "uploads/regulations/PMK_49_2023_SBM.pdf",
            "file_size": "250 KB",
            "extracted_text": "SBM Honorarium: Narasumber Rp 250.000/jam, Moderator Rp 200.000/jam, Konsumsi Rp 150.000/orang, Transport Rp 50.000/km",
            "is_active": True,
            "target_year": "2026",
            "uploaded_by_id": "19850115"
        },
        {
            "id": "REG-2026-002",
            "title": "Petunjuk Teknis Tata Kelola Anggaran & Penelaahan RAB Komdigi",
            "category": "Petunjuk Teknis & BAS Komdigi",
            "description": "Petunjuk teknis tata kelola anggaran Kementerian Komdigi",
            "file_name": "JUKNIS_RAB_KOMDIGI.pdf",
            "file_path": "uploads/regulations/JUKNIS_RAB_KOMDIGI.pdf",
            "file_size": "180 KB",
            "extracted_text": "Batas pagu: Maksimal 100% dari pagu yang ditetapkan. Honorarium pejabat: Rp 500.000/hari.",
            "is_active": True,
            "target_year": "2026",
            "uploaded_by_id": "19850115"
        }
    ]

    for r in regulations:
        existing = db.query(Regulation).filter(Regulation.id == r["id"]).first()
        if not existing:
            reg = Regulation(**r)
            db.add(reg)
            print(f"  ✓ Regulasi: {r['title'][:50]}")
        else:
            print(f"  - Regulasi sudah ada: {r['title'][:50]}")

def seed_master_ro():
    ro_data = [
        {"program": "059.GH", "unit_eselon1": "Sekretariat Jenderal", "kegiatan": "059.GH-01", "unit_eselon2": "Biro Perencanaan", "prioritas_check": "Prioritas Nasional", "kro": "059.GH-01-01", "ro": "Interkoneksi Aplikasi Gaji"},
        {"program": "059.GH", "unit_eselon1": "Sekretariat Jenderal", "kegiatan": "059.GH-01", "unit_eselon2": "Biro Perencanaan", "prioritas_check": "Prioritas Nasional", "kro": "059.GH-01-02", "ro": "Sinergitas Transmigrasi"},
        {"program": "059.GK", "unit_eselon1": "Ditjen Komunikasi Publik", "kegiatan": "059.GK-01", "unit_eselon2": "Ditjen Komunikasi Publik", "prioritas_check": "Non-Prioritas", "kro": "059.GK-01-01", "ro": "Pelatihan Vokasi"},
        {"program": "059.GK", "unit_eselon1": "Ditjen Komunikasi Publik", "kegiatan": "059.GK-01", "unit_eselon2": "Ditjen Komunikasi Publik", "prioritas_check": "Non-Prioritas", "kro": "059.GK-01-02", "ro": "Kolaborasi Riset AI"},
        {"program": "059.GL", "unit_eselon1": "Ditjen Infrastruktur Digital", "kegiatan": "059.GL-01", "unit_eselon2": "Ditjen Infrastruktur Digital", "prioritas_check": "Non-Prioritas", "kro": "059.GL-01-01", "ro": "Patroli Siber"},
    ]

    for i, ro in enumerate(ro_data):
        existing = db.query(MasterRo).filter(MasterRo.kro == ro["kro"], MasterRo.ro == ro["ro"]).first()
        if not existing:
            item = MasterRo(
                id=f"RO-{i+1:04d}",
                program=ro["program"],
                unit_eselon1=ro["unit_eselon1"],
                kegiatan=ro["kegiatan"],
                unit_eselon2=ro["unit_eselon2"],
                prioritas_check=ro["prioritas_check"],
                kro=ro["kro"],
                ro=ro["ro"]
            )
            db.add(item)
            print(f"  ✓ Master RO: {ro['ro']}")
        else:
            print(f"  - Master RO sudah ada: {ro['ro']}")

def seed_criteria():
    criteria = [
        {"id": 1, "text": "Struktur Anggaran Lengkap", "description": "RAB memiliki struktur yang lengkap sesuai format", "category": "Struktur Anggaran"},
        {"id": 2, "text": "Komponen Anggaran Terisi", "description": "Semua komponen anggaran terisi dengan benar", "category": "Struktur Anggaran"},
        {"id": 3, "text": "Hierarki RO Sesuai", "description": "KRO dan RO sesuai dengan master RO", "category": "Struktur Anggaran"},
        {"id": 4, "text": "Unit Eselon Terisi", "description": "Unit Eselon I dan II terisi dengan benar", "category": "Struktur Anggaran"},
        {"id": 5, "text": "Dokumen Pendukung Lengkap", "description": "Dokumen pendukung RAB lengkap", "category": "Kelengkapan Administratif"},
        {"id": 6, "text": "Kode Akun Sesuai", "description": "Kode akun sesuai dengan standar akuntansi", "category": "Kesesuaian Akun"},
        {"id": 7, "text": "Klasifikasi Akun Benar", "description": "Klasifikasi akun benar", "category": "Kesesuaian Akun"},
        {"id": 8, "text": "Sub Akun Terisi", "description": "Sub akun terisi dengan benar", "category": "Kesesuaian Akun"},
        {"id": 9, "text": "Kode Kegiatan Sesuai", "description": "Kode kegiatan sesuai dengan master", "category": "Kesesuaian Akun"},
        {"id": 10, "text": "Honorarium Sesuai SBM", "description": "Honorarium sesuai Standar Biaya Masukan", "category": "Kepatuhan Standar Biaya"},
        {"id": 11, "text": "Konsumsi Sesuai SBM", "description": "Konsumsi sesuai Standar Biaya Masukan", "category": "Kepatuhan Standar Biaya"},
        {"id": 12, "text": "Perhitungan Matematis Benar", "description": "Perhitungan matematis benar", "category": "Kalkulasi Matematis"},
        {"id": 13, "text": "Total Anggaran Sesuai", "description": "Total anggaran sesuai dengan jumlah komponen", "category": "Kalkulasi Matematis"},
        {"id": 14, "text": "Efisiensi Anggaran", "description": "Anggaran efisien dan tidak boros", "category": "Efisiensi Anggaran"},
        {"id": 15, "text": "Integritas Anggaran", "description": "Anggaran tidak mengandung mark-up", "category": "Integritas Anggaran"},
        {"id": 16, "text": "Harga Wajar", "description": "Harga yang digunakan wajar", "category": "Kewajaran Harga"},
        {"id": 17, "text": "Kalkulasi Pajak Benar", "description": "Kalkulasi pajak benar", "category": "Kalkulasi Matematis"},
        {"id": 18, "text": "Batas Pagu Tidak Terlampaui", "description": "Anggaran tidak melampaui batas pagu", "category": "Batas Pagu"},
        {"id": 19, "text": "Ditandatangani Pejabat", "description": "RAB ditandatangani oleh pejabat berwenang", "category": "Pengesahan Pejabat"},
        {"id": 20, "text": "Tanggal Pengesahan Valid", "description": "Tanggal pengesahan valid", "category": "Pengesahan Pejabat"},
    ]

    for c in criteria:
        existing = db.query(Criterion).filter(Criterion.id == c["id"]).first()
        if not existing:
            criterion = Criterion(**c)
            db.add(criterion)
            print(f"  ✓ Kriteria {c['id']}: {c['text'][:40]}")
        else:
            print(f"  - Kriteria sudah ada: {c['text'][:40]}")

def seed_submissions():
    submissions = [
        {
            "id": "SUB-2026-001",
            "ticket_number": "TIKET-20260101-001",
            "satker_user_id": "19890422",
            "program": "059.GH",
            "kegiatan": "059.GH-01",
            "kro": "059.GH-01-01",
            "ro": "Interkoneksi Aplikasi Gaji",
            "unit_eselon1": "Sekretariat Jenderal",
            "unit_eselon2": "Biro Perencanaan",
            "prioritas": "Prioritas Nasional",
            "rab_file_path": "uploads/rab_001.pdf",
            "rab_file_size": "1.2 MB",
            "regulation_id": "REG-2026-001",
            "regulation_title": "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
            "ai_status": "LOLOS",
            "ai_score": 98,
            "ai_reason": "Semua kriteria terpenuhi",
            "ai_recommendation": "Diterima",
            "ai_criteria_results": [{"id": i+1, "status": "passed", "notes": "Sesuai"} for i in range(20)],
            "verification_status": "Diterima",
            "verifikator_notes": "Dokumen lengkap dan sesuai",
            "verified_by_id": "19910718",
            "verified_at": datetime(2026, 1, 15, 10, 30),
            "digital_signature_hash": "DIGISIG-KOMDIGI-ABC12345"
        },
        {
            "id": "SUB-2026-002",
            "ticket_number": "TIKET-20260102-002",
            "satker_user_id": "19890422",
            "program": "059.GH",
            "kegiatan": "059.GH-01",
            "kro": "059.GH-01-02",
            "ro": "Sinergitas Transmigrasi",
            "unit_eselon1": "Sekretariat Jenderal",
            "unit_eselon2": "Biro Perencanaan",
            "prioritas": "Prioritas Nasional",
            "rab_file_path": "uploads/rab_002.pdf",
            "rab_file_size": "1.5 MB",
            "regulation_id": "REG-2026-001",
            "regulation_title": "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
            "ai_status": "LOLOS",
            "ai_score": 95,
            "ai_reason": "Semua kriteria terpenuhi",
            "ai_recommendation": "Diterima",
            "ai_criteria_results": [{"id": i+1, "status": "passed", "notes": "Sesuai"} for i in range(20)],
            "verification_status": "Diterima",
            "verifikator_notes": "Dokumen lengkap",
            "verified_by_id": "19910718",
            "verified_at": datetime(2026, 1, 20, 14, 0),
            "digital_signature_hash": "DIGISIG-KOMDIGI-DEF67890"
        },
        {
            "id": "SUB-2026-003",
            "ticket_number": "TIKET-20260103-003",
            "satker_user_id": "19890422",
            "program": "059.GK",
            "kegiatan": "059.GK-01",
            "kro": "059.GK-01-01",
            "ro": "Pelatihan Vokasi",
            "unit_eselon1": "Ditjen Komunikasi Publik",
            "unit_eselon2": "Ditjen Komunikasi Publik",
            "prioritas": "Non-Prioritas",
            "rab_file_path": "uploads/rab_003.pdf",
            "rab_file_size": "0.8 MB",
            "regulation_id": "REG-2026-001",
            "regulation_title": "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
            "ai_status": "LOLOS",
            "ai_score": 92,
            "ai_reason": "Semua kriteria terpenuhi",
            "ai_recommendation": "Menunggu verifikasi",
            "ai_criteria_results": [{"id": i+1, "status": "passed", "notes": "Sesuai"} for i in range(20)],
            "verification_status": "Menunggu",
            "verifikator_notes": "",
            "verified_by_id": None,
            "verified_at": None,
            "digital_signature_hash": None
        },
        {
            "id": "SUB-2026-004",
            "ticket_number": "TIKET-20260104-004",
            "satker_user_id": "19890422",
            "program": "059.GK",
            "kegiatan": "059.GK-01",
            "kro": "059.GK-01-02",
            "ro": "Kolaborasi Riset AI",
            "unit_eselon1": "Ditjen Komunikasi Publik",
            "unit_eselon2": "Ditjen Komunikasi Publik",
            "prioritas": "Non-Prioritas",
            "rab_file_path": "uploads/rab_004.pdf",
            "rab_file_size": "1.1 MB",
            "regulation_id": "REG-2026-001",
            "regulation_title": "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
            "ai_status": "TIDAK LOLOS",
            "ai_score": 68,
            "ai_reason": "Honorarium melebihi SBM",
            "ai_recommendation": "Ditolak - perbaiki honorarium",
            "ai_criteria_results": [{"id": i+1, "status": "passed" if i != 9 else "failed", "notes": "Sesuai" if i != 9 else "Melebihi SBM"} for i in range(20)],
            "verification_status": "Ditolak",
            "verifikator_notes": "Honorarium melebihi batas SBM",
            "verified_by_id": "19910718",
            "verified_at": datetime(2026, 1, 25, 9, 0),
            "digital_signature_hash": "DIGISIG-KOMDIGI-GHI11223"
        },
        {
            "id": "SUB-2026-005",
            "ticket_number": "TIKET-20260105-005",
            "satker_user_id": "19890422",
            "program": "059.GL",
            "kegiatan": "059.GL-01",
            "kro": "059.GL-01-01",
            "ro": "Patroli Siber",
            "unit_eselon1": "Ditjen Infrastruktur Digital",
            "unit_eselon2": "Ditjen Infrastruktur Digital",
            "prioritas": "Non-Prioritas",
            "rab_file_path": "uploads/rab_005.pdf",
            "rab_file_size": "0.9 MB",
            "regulation_id": "REG-2026-001",
            "regulation_title": "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
            "ai_status": "LOLOS",
            "ai_score": 100,
            "ai_reason": "Semua kriteria terpenuhi",
            "ai_recommendation": "Diterima",
            "ai_criteria_results": [{"id": i+1, "status": "passed", "notes": "Sesuai"} for i in range(20)],
            "verification_status": "Diterima",
            "verifikator_notes": "Dokumen sempurna",
            "verified_by_id": "19910718",
            "verified_at": datetime(2026, 1, 30, 11, 0),
            "digital_signature_hash": "DIGISIG-KOMDIGI-JKL44556"
        }
    ]

    for s in submissions:
        existing = db.query(Submission).filter(Submission.id == s["id"]).first()
        if not existing:
            sub = Submission(**s)
            db.add(sub)
            print(f"  ✓ Submission: {s['id']} - {s['ro']}")
        else:
            print(f"  - Submission sudah ada: {s['id']}")

if __name__ == "__main__":
    print("🌱 Seeding database...")
    print("\n📋 Users:")
    seed_users()
    print("\n📋 Regulations:")
    seed_regulations()
    print("\n📋 Master RO:")
    seed_master_ro()
    print("\n📋 Criteria:")
    seed_criteria()
    print("\n📋 Submissions:")
    seed_submissions()
    db.commit()
    print("\n✅ Seeding selesai!")
    db.close()
