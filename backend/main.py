import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Membaca dari .env di folder backend/ (untuk development lokal)
# Di Vercel, env vars dikonfigurasi langsung di dashboard
load_dotenv()

from supabase import create_client, Client

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client berhasil diinisialisasi.")
else:
    logger.warning(
        "Kredensial Supabase tidak ditemukan. "
        "Pengunduhan model dinamis tidak akan berfungsi."
    )

from services.model_service import ModelService
from services.classification_service import ClassificationService
from services.activity_log_service import ActivityLogService

model_service = ModelService(supabase_client=supabase)
activity_log_service = ActivityLogService(supabase_client=supabase)
classification_service = ClassificationService(
    supabase_client=supabase,
    model_service=model_service,
    activity_log_service=activity_log_service,
)

from routers import model_router, predict_router, user_router
from routers.model_router import init_router as init_model_router
from routers.predict_router import init_router as init_predict_router

init_model_router(model_service)
init_predict_router(classification_service)

app = FastAPI(
    title="NeuroScan API",
    description=(
        "Backend API untuk Klasifikasi MRI Tumor Otak. "
        "Dibangun dengan arsitektur OOP menggunakan FastAPI dan TensorFlow."
    ),
    version="2.0.0",
)

# CORS: Baca daftar origin dari env var ALLOWED_ORIGINS (koma-separated)
# Contoh di Vercel: ALLOWED_ORIGINS=https://neuroscan.vercel.app,https://www.neuroscan.com
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
_allowed_origins = [
    o.strip() for o in _raw_origins.split(",") if o.strip()
] if _raw_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(model_router)

app.include_router(predict_router)

app.include_router(user_router)

@app.on_event("startup")
async def startup_event():
    logger.info("NeuroScan API sedang starting up...")
    success = model_service.set_active_model()
    if success:
        logger.info("Model berhasil dimuat saat startup.")
    else:
        logger.warning(
            "Tidak ada model yang dimuat saat startup. "
            "Upload model via endpoint /upload-model atau aktifkan dari dashboard Admin."
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
