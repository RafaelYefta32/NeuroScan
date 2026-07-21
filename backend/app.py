"""
Entry point untuk HuggingFace Spaces (sdk: gradio).
Gunakan demo.launch() agar ZeroGPU tidak langsung shutdown.
"""
import gradio as gr
from fastapi.middleware.cors import CORSMiddleware
import os

# Import FastAPI app beserta semua routes dan middleware dari main.py
from main import app as fastapi_app

# Buat tampilan Gradio sederhana sebagai "landing page" API
with gr.Blocks(
    title="NeuroScan API",
    theme=gr.themes.Soft(primary_hue="blue"),
) as demo:
    gr.Markdown(
        """
        # 🧠 NeuroScan API
        **Backend API untuk Klasifikasi MRI Tumor Otak**

        ---

        ### 📖 Dokumentasi API
        - [Swagger UI](/docs) — Interactive API documentation
        - [ReDoc](/redoc) — Alternative documentation

        ### 🔗 Endpoints Utama
        | Method | Endpoint | Deskripsi |
        |--------|----------|-----------|
        | `POST` | `/predict` | Klasifikasi gambar MRI |
        | `GET` | `/models` | Daftar model tersedia |

        ---
        *Dibangun dengan FastAPI + TensorFlow*
        """
    )

# Launch Gradio (prevent_thread_lock agar bisa tambah routes dulu)
gradio_server, _, _ = demo.launch(
    server_port=7860,
    server_name="0.0.0.0",
    prevent_thread_lock=True,
)

# Mount semua router FastAPI ke server Gradio
from routers import model_router, predict_router, user_router
gradio_server.include_router(predict_router)
gradio_server.include_router(model_router)
gradio_server.include_router(user_router)

# Blok thread agar server tetap berjalan (tidak langsung exit)
demo.block_thread()

