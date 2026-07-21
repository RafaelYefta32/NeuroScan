
import os
import io
import logging
import shutil
from typing import Optional

import numpy as np
from PIL import Image
from fastapi import UploadFile

from entities.model_entity import ModelEntity

logger = logging.getLogger(__name__)

CLASS_LABELS = ["glioma", "meningioma", "notumor", "pituitary"]
DEFAULT_IMAGE_SIZE = (224, 224)
LOCAL_MODEL_DIR = "models"
FALLBACK_MODEL_PATH = "models/efficientnetB0.keras"

# HuggingFace Hub: repo tempat model .keras disimpan
# Set via env var HF_MODEL_REPO, contoh: "RafaelYefta/neuroscan-models"
HF_MODEL_REPO = os.environ.get("HF_MODEL_REPO", "")
HF_TOKEN = os.environ.get("HF_TOKEN", "")  # Untuk private repo (opsional)


class ModelService:

    def __init__(self, supabase_client=None):
        self._current_model = None
        self._image_size = DEFAULT_IMAGE_SIZE
        self._supabase = supabase_client
        self._tf_available = self._check_tensorflow()

    def _check_tensorflow(self) -> bool:
        try:
            import tensorflow as tf
            logger.info(f"TensorFlow version: {tf.__version__}")
            return True
        except ImportError:
            logger.error("TensorFlow tidak terinstall. Jalankan: pip install tensorflow")
            return False

    def is_model_loaded(self) -> bool:
        return self._current_model is not None

    def _download_from_hf_hub(self, filename: str) -> str:
        """Download model dari HuggingFace Hub jika belum ada secara lokal."""
        os.makedirs(LOCAL_MODEL_DIR, exist_ok=True)
        local_path = os.path.join(LOCAL_MODEL_DIR, os.path.basename(filename))

        if os.path.exists(local_path):
            logger.info(f"Model sudah ada di cache lokal: {local_path}")
            return local_path

        if not HF_MODEL_REPO:
            logger.warning("HF_MODEL_REPO tidak dikonfigurasi, skip download dari HF Hub.")
            return local_path

        try:
            from huggingface_hub import hf_hub_download
            logger.info(f"Mendownload model dari HF Hub: {HF_MODEL_REPO}/{os.path.basename(filename)}")
            downloaded = hf_hub_download(
                repo_id=HF_MODEL_REPO,
                filename=os.path.basename(filename),
                token=HF_TOKEN or None,
                local_dir=LOCAL_MODEL_DIR,
            )
            logger.info(f"Model berhasil didownload ke: {downloaded}")
            return downloaded
        except Exception as e:
            logger.error(f"Gagal download model dari HF Hub: {e}")
            return local_path

    def upload_model(self, file_obj, filename: str) -> str:
        os.makedirs(LOCAL_MODEL_DIR, exist_ok=True)
        file_path = os.path.join(LOCAL_MODEL_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)

        logger.info(f"Model berhasil diupload ke: {file_path}")
        return file_path

    def set_active_model(self) -> bool:
        if not self._tf_available:
            logger.error("TensorFlow tidak tersedia, tidak dapat memuat model.")
            return False

        import tensorflow as tf

        if self._supabase:
            try:
                logger.info("Memeriksa Supabase untuk model aktif...")
                response = (
                    self._supabase.table("models")
                    .select("*")
                    .eq("is_active", True)
                    .execute()
                )
                data = response.data

                if data and len(data) > 0:
                    active_record = ModelEntity.from_dict(data[0])
                    logger.info(
                        f"Model aktif ditemukan di DB: {active_record.model_name} "
                        f"v{active_record.version} | path: {active_record.file_path}"
                    )

                    # Coba download dari HF Hub jika file tidak ada lokal
                    local_path = self._download_from_hf_hub(active_record.file_path)

                    if os.path.exists(local_path):
                        self._current_model = tf.keras.models.load_model(local_path)
                        self._set_image_size_from_model()
                        logger.info(
                            "Model aktif berhasil dimuat ke memori! "
                            f"Ukuran input: {self._image_size}"
                        )
                        return True
                    else:
                        logger.warning(
                            f"File model tidak ditemukan di: {local_path}. "
                            "Beralih ke fallback."
                        )

            except Exception as e:
                logger.error(f"Gagal mengambil model dari Supabase: {e}")

        # Coba download fallback dari HF Hub juga
        fallback_local = self._download_from_hf_hub(FALLBACK_MODEL_PATH)
        logger.info(f"Mencoba memuat model fallback: {fallback_local}")
        try:
            if os.path.exists(fallback_local):
                self._current_model = tf.keras.models.load_model(fallback_local)
                self._set_image_size_from_model()
                logger.info(
                    "Model fallback lokal berhasil dimuat! "
                    f"Ukuran input: {self._image_size}"
                )
                return True
            else:
                logger.warning(f"Model fallback tidak ditemukan di: {FALLBACK_MODEL_PATH}")
        except Exception as e:
            logger.error(f"Gagal memuat model fallback: {e}")

        return False

    def _preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(self._image_size or DEFAULT_IMAGE_SIZE)
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    def _set_image_size_from_model(self) -> None:
        if self._current_model is None:
            return

        try:
            input_shape = self._current_model.input_shape
            if isinstance(input_shape, list):
                input_shape = input_shape[0]

            if input_shape is None:
                raise ValueError("Input shape tidak tersedia")

            shape = [dim for dim in input_shape if dim is not None]
            if len(shape) == 2:
                height, width = shape
            elif len(shape) == 3:
                if shape[0] in (1, 3):
                    _, height, width = input_shape[1:]
                else:
                    height, width = shape[0], shape[1]
            else:
                height, width = DEFAULT_IMAGE_SIZE

            if height is None or width is None:
                raise ValueError("Dimensi input model tidak lengkap")

            self._image_size = (int(width), int(height))
        except Exception as e:
            logger.warning(
                f"Gagal menentukan ukuran input model secara otomatis: {e}. "
                f"Menggunakan default {DEFAULT_IMAGE_SIZE}"
            )
            self._image_size = DEFAULT_IMAGE_SIZE

    def predict_image(self, image_bytes: bytes) -> dict:
        if self._current_model is None:
            raise RuntimeError(
                "Model belum dimuat. Pastikan file .keras tersedia dan valid."
            )

        processed = self._preprocess_image(image_bytes)
        predictions = self._current_model.predict(processed)

        class_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][class_idx])
        predicted_class = CLASS_LABELS[class_idx]

        all_scores = {
            CLASS_LABELS[i]: float(predictions[0][i])
            for i in range(len(CLASS_LABELS))
        }

        logger.info(
            f"Prediksi: {predicted_class} (confidence: {confidence:.4f})"
        )

        return {
            "predicted_class": predicted_class,
            "confidence_score": confidence,
            "all_scores": all_scores,
        }
