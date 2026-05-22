
import logging
import json
from datetime import datetime
from typing import Optional

from entities.classification_result import ClassificationResult
from services.model_service import ModelService
from services.activity_log_service import ActivityLogService

logger = logging.getLogger(__name__)


class ClassificationService:

    def __init__(
        self,
        supabase_client=None,
        model_service: Optional[ModelService] = None,
        activity_log_service: Optional[ActivityLogService] = None,
    ):
        self._supabase = supabase_client
        self._model_service = model_service
        self._log_service = activity_log_service

    def analyze_image(
        self,
        image_bytes: bytes,
        filename: str,
        user_id: str,
        model_id: Optional[int] = None,
    ) -> ClassificationResult:
        # Langkah 1: Upload gambar ke Supabase Storage
        image_url = self._upload_scan_to_storage(image_bytes, filename)

        # Langkah 2: Jalankan prediksi
        prediction = self._model_service.predict_image(image_bytes)

        # Langkah 3: Simpan hasil ke Supabase
        result = self._save_result_to_db(
            user_id=user_id,
            model_id=model_id,
            image_url=image_url,
            prediction=prediction,
        )

        # Langkah 4: Catat aktivitas
        if self._log_service and user_id:
            self._log_service.record_log(
                user_id=user_id,
                activity="MRI Scan Upload",
                description=f"Uploaded an MRI scan. Predicted: {prediction['predicted_class']}",
            )

        return result

    def _upload_scan_to_storage(self, image_bytes: bytes, filename: str) -> str:
        if not self._supabase:
            return "https://via.placeholder.com/150"

        import random
        import string

        random_prefix = "".join(random.choices(string.ascii_lowercase + string.digits, k=12))
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
        storage_filename = f"{random_prefix}_{int(datetime.now().timestamp())}.{ext}"

        try:
            upload_result = (
                self._supabase.storage.from_("scans")
                .upload(storage_filename, image_bytes)
            )
            url_result = (
                self._supabase.storage.from_("scans")
                .get_public_url(storage_filename)
            )
            image_url = url_result
            logger.info(f"Gambar MRI berhasil diupload ke Storage: {storage_filename}")
            return image_url
        except Exception as e:
            logger.warning(f"Upload ke Storage gagal (bucket 'scans' mungkin tidak ada): {e}")
            return "https://via.placeholder.com/150"

    def _save_result_to_db(
        self,
        user_id: str,
        model_id: Optional[int],
        image_url: str,
        prediction: dict,
    ) -> ClassificationResult:
        result_data = {
            "user_id": user_id,
            "model_id": model_id,
            "image_mri": image_url,
            "predicted_class": prediction["predicted_class"],
            "confidence_score": prediction["confidence_score"],
            "explanation": json.dumps(prediction["all_scores"]),
        }

        if self._supabase:
            try:
                response = (
                    self._supabase.table("classification_results")
                    .insert([result_data])
                    .execute()
                )
                if response.data:
                    saved = response.data[0]
                    logger.info(f"Hasil klasifikasi disimpan dengan ID: {saved.get('id')}")
                    return ClassificationResult.from_dict(saved)
            except Exception as e:
                logger.error(f"Gagal menyimpan hasil ke database: {e}")

        # Kembalikan objek sementara jika DB tidak tersedia
        return ClassificationResult(
            id=None,
            user_id=user_id,
            model_id=model_id,
            image_mri=image_url,
            predicted_class=prediction["predicted_class"],
            confidence_score=prediction["confidence_score"],
            explanation=json.dumps(prediction["all_scores"]),
            created_at=datetime.now(),
        )

    def get_result_details(self, result_id: int) -> Optional[ClassificationResult]:
        if not self._supabase:
            return None

        try:
            response = (
                self._supabase.table("classification_results")
                .select("*")
                .eq("id", result_id)
                .maybeSingle()
                .execute()
            )
            if response.data:
                return ClassificationResult.from_dict(response.data)
        except Exception as e:
            logger.error(f"Gagal mengambil detail hasil ID {result_id}: {e}")

        return None

    def generate_pdf_report(self, result: ClassificationResult) -> bytes:
        report_text = (
            f"NeuroScan Classification Report\n"
            f"================================\n"
            f"Predicted Class   : {result.predicted_class}\n"
            f"Confidence Score  : {result.confidence_percentage()}%\n"
            f"Tumor Detected    : {'Yes' if result.is_tumor_detected() else 'No'}\n"
            f"Analysis Date     : {result.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
        )
        logger.info(f"PDF report dibuat untuk result ID: {result.id}")
        return report_text.encode("utf-8")
