import os
import uuid
import json
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import engine, get_db, Base
from models import User, Submission, Regulation
from services.gemini_checker import analyze_rab_document, extract_pdf_text

# Buat tabel otomatis jika belum ada di PostgreSQL
Base.metadata.create_all(bind=engine)
app = FastAPI(title="API Pengecekan Dokumen RAB AI", version="1.0.0")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pastikan direktori uploads tersedia
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/regulations", exist_ok=True)

# Konfigurasi CORS agar frontend React dapat mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "API Pengecekan Dokumen RAB AI"}

@app.post("/api/auth/login")
def login(payload: dict, db: Session = Depends(get_db)):
    user_id = payload.get("id", "").strip()
    password = payload.get("password", "")

    if len(user_id) != 8:
        raise HTTPException(status_code=400, detail="user ID tidak ditemukan")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=401, detail="user ID tidak ditemukan")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun ini sedang dinonaktifkan.")

    return {
        "id": user.id,
        "name": user.name,
        "unit": user.unit,
        "roles": user.roles,
        "activeRole": user.active_role,
        "isActive": user.is_active,
        "phone": user.phone
    }

# ======================================================================
# MANAJEMEN DOKUMEN PERATURAN & KETENTUAN ACUAN (SUPER ADMIN)
# ======================================================================
@app.get("/api/regulations")
def get_regulations(db: Session = Depends(get_db)):
    regs = db.query(Regulation).order_by(Regulation.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "description": r.description,
            "fileName": r.file_name,
            "fileSize": r.file_size,
            "isActive": r.is_active,
            "targetYear": r.target_year,
            "extractedRulesSummary": (r.extracted_text[:1200] + "...") if r.extracted_text and len(r.extracted_text) > 1200 else (r.extracted_text or ""),
            "createdAt": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else ""
        }
        for r in regs
    ]

@app.post("/api/regulations/upload")
async def upload_regulation(
    title: str = Form(...),
    category: str = Form("Standar Biaya Masukan (SBM)"),
    target_year: str = Form("2026"),
    description: str = Form(""),
    uploaded_by_id: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    pdf_bytes = await file.read()
    file_path = f"uploads/regulations/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    extracted_text = extract_pdf_text(pdf_bytes)
    reg_id = f"REG-{uuid.uuid4().hex[:8].upper()}"

    regulation = Regulation(
        id=reg_id,
        title=title,
        category=category,
        target_year=target_year,
        description=description,
        file_name=file.filename,
        file_path=file_path,
        file_size=f"{round(len(pdf_bytes)/1024, 1)} KB",
        extracted_text=extracted_text,
        is_active=True,
        uploaded_by_id=uploaded_by_id or None
    )
    db.add(regulation)
    db.commit()
    db.refresh(regulation)
    return {
        "id": regulation.id,
        "title": regulation.title,
        "category": regulation.category,
        "fileName": regulation.file_name,
        "fileSize": regulation.file_size,
        "isActive": regulation.is_active,
        "message": "Dokumen peraturan acuan berhasil diunggah dan diaktifkan untuk penilaian AI."
    }

@app.put("/api/regulations/{reg_id}/toggle")
def toggle_regulation(reg_id: str, db: Session = Depends(get_db)):
    reg = db.query(Regulation).filter(Regulation.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulasi acuan tidak ditemukan")
    reg.is_active = not reg.is_active
    db.commit()
    return {"id": reg.id, "isActive": reg.is_active, "message": f"Status acuan regulasi berhasil diubah"}

@app.delete("/api/regulations/{reg_id}")
def delete_regulation(reg_id: str, db: Session = Depends(get_db)):
    reg = db.query(Regulation).filter(Regulation.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulasi acuan tidak ditemukan")
    db.delete(reg)
    db.commit()
    return {"status": "success", "message": "Dokumen regulasi berhasil dihapus"}

# ======================================================================
# PENGAJUAN & PENELAAHAN RAB OLEH AI
# ======================================================================
@app.post("/api/submissions/upload-and-check")
async def submit_rab(
    program: str = Form(...),
    kegiatan: str = Form(...),
    kro: str = Form(...),
    ro: str = Form(...),
    unit_eselon1: str = Form(...),
    unit_eselon2: str = Form(...),
    prioritas: str = Form(...),
    satker_user_id: str = Form(...),
    rab_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    pdf_bytes = await rab_file.read()

    # Ambil dokumen peraturan acuan aktif yang ditetapkan Super Admin
    active_reg = db.query(Regulation).filter(Regulation.is_active == True).first()
    regulation_bytes = None
    regulation_text = None
    regulation_title = None
    regulation_id = None

    if active_reg:
        regulation_id = active_reg.id
        regulation_title = active_reg.title
        regulation_text = active_reg.extracted_text
        if os.path.exists(active_reg.file_path):
            try:
                with open(active_reg.file_path, "rb") as rf:
                    regulation_bytes = rf.read()
            except Exception:
                pass

    # 1. Panggil Gemini AI Service dengan rujukan ketentuan acuan Super Admin
    ai_result = analyze_rab_document(
        pdf_bytes=pdf_bytes,
        file_name=rab_file.filename,
        regulation_bytes=regulation_bytes,
        regulation_text=regulation_text,
        regulation_title=regulation_title
    )
    extracted_text = ai_result.pop("extractedText", "")
    ticket_number = f"TIKET-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    submission = Submission(
        id=str(uuid.uuid4()),
        ticket_number=ticket_number,
        satker_user_id=satker_user_id,
        program=program,
        kegiatan=kegiatan,
        kro=kro,
        ro=ro,
        unit_eselon1=unit_eselon1,
        unit_eselon2=unit_eselon2,
        prioritas=prioritas,
        rab_file_path=f"uploads/{rab_file.filename}",
        rab_file_size=f"{round(len(pdf_bytes)/1024, 1)} KB",
        regulation_id=regulation_id,
        regulation_title=regulation_title or "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
        ai_status=ai_result["aiStatus"],
        ai_score=ai_result["aiScore"],
        ai_reason=ai_result["aiReason"],
        ai_recommendation=ai_result["aiRecommendation"],
        ai_criteria_results=ai_result["criteriaResults"],
        verification_status="Menunggu"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    submission_data = {
        column.name: getattr(submission, column.name)
        for column in Submission.__table__.columns
    }
    submission_data["extractedText"] = extracted_text
    submission_data["activeRegulationTitle"] = submission.regulation_title
    return submission_data

@app.put("/api/submissions/{sub_id}/verify")
def verify_submission(sub_id: str, payload: dict, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == sub_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Berkas tidak ditemukan")

    submission.ai_criteria_results = payload.get("criteriaResults", submission.ai_criteria_results)
    submission.verification_status = payload.get("verificationStatus")
    submission.verifikator_notes = payload.get("verifikatorNotes")
    submission.verified_by_id = payload.get("verifierId")
    submission.verified_at = datetime.now()
    submission.digital_signature_hash = f"DIGISIG-KOMDIGI-{uuid.uuid4().hex[:8].upper()}"
    db.commit()
    return {"status": "success", "message": "Keputusan verifikasi berhasil disimpan"}