import os
import io
import shutil
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import numpy as np
from PIL import Image

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from the frontend's .env.local
load_dotenv(dotenv_path="../frontend/.env.local")

# Supabase Initialization
from supabase import create_client, Client
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized.")
else:
    logger.warning("Supabase credentials not found. Dynamic model downloading will not work.")

# ML Setup
# Lazy load TensorFlow to save memory if it fails
try:
    import tensorflow as tf
    TF_AVAILABLE = True
    logger.info(f"TensorFlow version: {tf.__version__}")
except ImportError:
    TF_AVAILABLE = False
    logger.error("TensorFlow is not installed. Run: pip install tensorflow")

# Global variables
current_model = None
# Based on user input:
CLASS_LABELS = ['glioma', 'meningioma', 'notumor', 'pituitary']
IMAGE_SIZE = (224, 224)

def load_active_model():
    global current_model
    if not TF_AVAILABLE:
        return False
        
    try:
        # Try to fetch active model from Supabase
        if supabase:
            logger.info("Checking Supabase for active model...")
            response = supabase.table("models").select("*").eq("is_active", True).execute()
            data = response.data
            
            if data and len(data) > 0:
                active_record = data[0]
                file_path = active_record.get("file_path")
                if file_path:
                    logger.info(f"Found active model in DB. Checking local storage for {file_path}...")
                    
                    try:
                        if os.path.exists(file_path):
                            logger.info("Model file found locally. Loading into memory...")
                            current_model = tf.keras.models.load_model(file_path)
                            logger.info("Active model loaded successfully!")
                            return True
                        else:
                            logger.warning(f"Active model file not found at {file_path}. Proceeding to fallback.")
                    except Exception as load_err:
                        logger.error(f"Failed to load active model from {file_path}: {load_err}")
    except Exception as e:
        logger.error(f"Error checking Supabase for models: {e}")
        
    # Fallback to local file if Supabase fails or no active model found
    local_fallback = "models/efficientnetB0.keras"
    logger.info(f"Attempting to load local fallback model: {local_fallback}")
    try:
        if os.path.exists(local_fallback):
            current_model = tf.keras.models.load_model(local_fallback)
            logger.info("Local fallback model loaded successfully!")
            return True
        else:
            logger.warning(f"Local fallback model not found at {local_fallback}.")
    except Exception as e:
        logger.error(f"Failed to load local fallback model: {e}")
        
    return False

# Initialize the app
app = FastAPI(title="NeuroScan API", description="Backend API for MRI Classification")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up API...")
    load_active_model()

class HealthResponse(BaseModel):
    status: str
    message: str
    model_loaded: bool

@app.get("/", response_model=HealthResponse)
async def root():
    return {
        "status": "ok", 
        "message": "NeuroScan API is running",
        "model_loaded": current_model is not None
    }

@app.post("/reload")
async def reload_model():
    """Endpoint to trigger the backend to fetch the latest active model from Supabase"""
    success = load_active_model()
    if success:
        return {"status": "success", "message": "Model reloaded successfully."}
    else:
        raise HTTPException(status_code=500, detail="Failed to reload model.")

@app.post("/upload-model")
async def upload_model(file: UploadFile = File(...)):
    """Endpoint to upload a model directly to the backend's local 'models' folder."""
    try:
        os.makedirs("models", exist_ok=True)
        file_path = f"models/{file.filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"status": "success", "file_path": file_path}
    except Exception as e:
        logger.error(f"Error uploading model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def preprocess_image(image_bytes):
    """Convert bytes to PIL Image, resize to 150x150, and convert to numpy array"""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMAGE_SIZE)
    img_array = np.array(img)
    
    # Keras models usually expect a batch dimension (1, 150, 150, 3)
    img_array = np.expand_dims(img_array, axis=0)
    
    # EfficientNet internally normalizes, but if your preprocessing required scaling to 0-1:
    # img_array = img_array / 255.0 
    
    return img_array

@app.post("/predict")
async def predict_mri(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    if current_model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Please ensure a valid .keras model exists.")
    
    try:
        contents = await file.read()
        
        # Preprocess
        processed_image = preprocess_image(contents)
        
        # Predict
        predictions = current_model.predict(processed_image)
        
        # Determine the class with highest probability
        # Assuming predictions is a 2D array like [[0.1, 0.8, 0.05, 0.05]]
        class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][class_idx])
        predicted_class = CLASS_LABELS[class_idx]
        
        return {
            "filename": file.filename,
            "predicted_class": predicted_class,
            "confidence_score": confidence,
            "all_scores": {CLASS_LABELS[i]: float(predictions[0][i]) for i in range(len(CLASS_LABELS))},
            "message": "Prediction successful"
        }
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
