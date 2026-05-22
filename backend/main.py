from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="NeuroScan API", description="Backend API for MRI Classification")

# Setup CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to your frontend URL in production (e.g. http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/", response_model=HealthResponse)
async def root():
    return {"status": "ok", "message": "NeuroScan API is running"}

@app.post("/predict")
async def predict_mri(file: UploadFile = File(...)):
    """
    Endpoint to handle MRI image uploads and run classification.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    # Read the image bytes
    contents = await file.read()
    
    # ---------------------------------------------------------
    # TODO: Implement your Deep Learning model inference here
    # 1. Load image from bytes (e.g., using PIL)
    # 2. Preprocess the image (resize, normalize)
    # 3. Pass to model (e.g., model.predict())
    # 4. Return the predicted class and confidence
    # ---------------------------------------------------------
    
    # Mock response for now
    return {
        "filename": file.filename,
        "predicted_class": "Glioma", 
        "confidence_score": 0.98,
        "message": "Prediction successful (Mock Data)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
