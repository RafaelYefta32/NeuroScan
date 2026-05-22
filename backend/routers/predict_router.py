
import logging
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter()

# Referensi ke service instance (di-inject dari main.py)
_classification_service = None


def init_router(classification_service):
    global _classification_service
    _classification_service = classification_service


@router.post("/predict", tags=["Classification"])
async def predict_mri(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    model_id: Optional[int] = Form(None),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, detail="File yang diberikan bukan gambar."
        )

    if _classification_service is None:
        raise HTTPException(
            status_code=503,
            detail="ClassificationService belum diinisialisasi.",
        )

    if not _classification_service._model_service.is_model_loaded():
        raise HTTPException(
            status_code=503,
            detail="Model belum dimuat. Pastikan file .keras tersedia dan valid.",
        )

    try:
        contents = await file.read()

        result = _classification_service.analyze_image(
            image_bytes=contents,
            filename=file.filename or "scan.jpg",
            user_id=user_id or "",
            model_id=model_id,
        )

        return {
            "filename": file.filename,
            "predicted_class": result.predicted_class,
            "confidence_score": result.confidence_score,
            "all_scores": (
                __import__("json").loads(result.explanation)
                if result.explanation
                else {}
            ),
            "image_url": result.image_mri,
            "result_id": result.id,
            "message": "Prediksi berhasil",
        }

    except RuntimeError as e:
        logger.error(f"RuntimeError saat prediksi: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error saat prediksi: {e}")
        raise HTTPException(
            status_code=500, detail=f"Terjadi kesalahan saat prediksi: {str(e)}"
        )
