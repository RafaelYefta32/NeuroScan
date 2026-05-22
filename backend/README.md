# NeuroScan Backend API

This is the Python FastAPI backend for the NeuroScan MRI Classification system.

## Setup Instructions

1. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   python main.py
   # Or using uvicorn directly:
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`.
You can access the interactive API documentation (Swagger UI) at `http://localhost:8000/docs`.

## Integrating Your Deep Learning Model
Open `main.py` and locate the `/predict` endpoint. You can integrate your PyTorch (`.pt`) or TensorFlow (`.h5`) model there.
