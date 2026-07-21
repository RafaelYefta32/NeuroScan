"""
Entry point untuk HuggingFace Spaces (sdk: gradio).
Menggabungkan FastAPI backend dengan Gradio UI agar bisa berjalan
di HuggingFace Spaces gratis (tanpa Docker berbayar).
"""
import uvicorn
import gradio as gr

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
        | `GET` | `/health` | Health check |

        ---
        *Dibangun dengan FastAPI + TensorFlow*
        """
    )

# Mount Gradio UI ke dalam FastAPI app di path "/"
# FastAPI endpoints tetap bisa diakses di path masing-masing (/predict, /docs, dll)
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

if __name__ == "__main__":
    # HuggingFace Spaces membutuhkan port 7860
    uvicorn.run(app, host="0.0.0.0", port=7860)
