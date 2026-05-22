import logging
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# Referensi ke service instance (di-inject dari main.py)
_model_service = None


def init_router(model_service):
    global _model_service
    _model_service = model_service


class HealthResponse(BaseModel):
    status: str
    message: str
    model_loaded: bool


@router.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "message": "NeuroScan API is running",
        "model_loaded": _model_service.is_model_loaded() if _model_service else False,
    }


@router.post("/upload-model", tags=["Model Management"])
async def upload_model(file: UploadFile = File(...)):
    if _model_service is None:
        raise HTTPException(status_code=503, detail="ModelService belum diinisialisasi.")

    try:
        file_path = _model_service.upload_model(file.file, file.filename)
        return {"status": "success", "file_path": file_path}
    except Exception as e:
        logger.error(f"Gagal mengupload model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload", tags=["Model Management"])
async def reload_model():
    if _model_service is None:
        raise HTTPException(status_code=503, detail="ModelService belum diinisialisasi.")

    success = _model_service.set_active_model()
    if success:
        return {"status": "success", "message": "Model berhasil dimuat ulang."}
    else:
        raise HTTPException(status_code=500, detail="Gagal memuat ulang model.")
