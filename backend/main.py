"""
Jan-Sahayak Backend - FastAPI Server
AI-Powered Government Form Filler

Features:
- Voice input → Form field extraction
- Aadhar OCR → Auto-fill
- PDF form generation
- Demo mode (works without AWS)
"""

import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Check if demo mode
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

# Import services
from services.bedrock_agent import extract_form_fields
from services.textract_service import extract_from_image
from services.pdf_generator import generate_filled_pdf

# Initialize FastAPI app
app = FastAPI(
    title="Jan-Sahayak API",
    description="AI-Powered Government Form Filler for Bharat",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://smit6777.github.io", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= Data Models =============

class VoiceInputRequest(BaseModel):
    transcript: str
    scheme: str = "pm-kisan"
    language: str = "hi"  # hi = Hindi, gu = Gujarati

class FormData(BaseModel):
    scheme: str
    fields: Dict[str, Any]

class ExtractedFields(BaseModel):
    success: bool
    fields: Dict[str, str]
    message: str
    confidence: float = 0.0

# ============= Supported Schemes =============

SCHEMES = {
    "pm-kisan": {
        "name": "PM Kisan Samman Nidhi",
        "name_hi": "पीएम किसान सम्मान निधि",
        "icon": "🌾",
        "fields": ["name", "fatherName", "aadhar", "mobile", "bankAccount", "ifsc", "address", "landArea"]
    },
    "vidhva-sahay": {
        "name": "Vidhva Sahay Yojana",
        "name_hi": "विधवा सहाय योजना",
        "icon": "🏠",
        "fields": ["name", "aadhar", "mobile", "husbandName", "deathCertNo", "bankAccount", "ifsc", "address"]
    },
    "ration-card": {
        "name": "Ration Card Application",
        "name_hi": "राशन कार्ड आवेदन",
        "icon": "🍚",
        "fields": ["name", "aadhar", "mobile", "familyMembers", "income", "address", "cardType"]
    },
    "ayushman-bharat": {
        "name": "Ayushman Bharat",
        "name_hi": "आयुष्मान भारत",
        "icon": "🏥",
        "fields": ["name", "aadhar", "mobile", "familyMembers", "income", "address", "existingDiseases"]
    },
    "pm-awas": {
        "name": "PM Awas Yojana",
        "name_hi": "पीएम आवास योजना",
        "icon": "🏗️",
        "fields": ["name", "fatherName", "aadhar", "mobile", "income", "currentAddress", "plotSize", "category"]
    },
    "ujjwala": {
        "name": "Ujjwala Yojana",
        "name_hi": "उज्ज्वला योजना",
        "icon": "🔥",
        "fields": ["name", "aadhar", "mobile", "address", "bankAccount", "ifsc", "bplNumber"]
    },
    "sukanya-samriddhi": {
        "name": "Sukanya Samriddhi",
        "name_hi": "सुकन्या समृद्धि",
        "icon": "👧",
        "fields": ["name", "fatherName", "motherName", "daughterName", "daughterDOB", "aadhar", "mobile", "address", "bankAccount"]
    },
    "kisan-credit": {
        "name": "Kisan Credit Card",
        "name_hi": "किसान क्रेडिट कार्ड",
        "icon": "💳",
        "fields": ["name", "fatherName", "aadhar", "mobile", "landArea", "cropType", "bankAccount", "ifsc", "address"]
    }
}

# ============= API Endpoints =============

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Jan-Sahayak API",
        "demo_mode": DEMO_MODE,
        "message": "नमस्ते! जन-सहायक API चल रहा है। (Jan-Sahayak API is running!)"
    }

@app.get("/api/schemes")
async def get_schemes():
    """Get list of supported government schemes"""
    return {
        "success": True,
        "schemes": SCHEMES,
        "total": len(SCHEMES)
    }

@app.get("/api/scheme/{scheme_id}")
async def get_scheme_details(scheme_id: str):
    """Get details of a specific scheme"""
    if scheme_id not in SCHEMES:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {
        "success": True,
        "scheme": SCHEMES[scheme_id]
    }

@app.post("/api/extract-from-voice", response_model=ExtractedFields)
async def extract_from_voice(request: VoiceInputRequest):
    """
    Extract form fields from voice transcript
    Uses AWS Bedrock (Claude) or Demo mode
    """
    try:
        result = await extract_form_fields(
            transcript=request.transcript,
            scheme=request.scheme,
            language=request.language,
            demo_mode=DEMO_MODE
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommend-scheme")
async def recommend_scheme_endpoint(request: VoiceInputRequest):
    """
    Recommend a scheme based on problem statement
    """
    try:
        from services.bedrock_agent import recommend_scheme
        
        result = await recommend_scheme(
            transcript=request.transcript,
            schemes=SCHEMES,
            demo_mode=DEMO_MODE
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def chat_endpoint(request: VoiceInputRequest):
    """
    General Chat Endpoint (Gemini/Demo)
    """
    try:
        from services.bedrock_agent import chat_with_ai
        
        # We use 'transcript' as the user message
        result = await chat_with_ai(
            history=[], # TODO: Pass history if needed
            message=request.transcript,
            demo_mode=DEMO_MODE
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract-from-image")
async def extract_from_aadhar(file: UploadFile = File(...)):
    """
    Extract data from Aadhar card image
    Uses AWS Textract or Demo mode
    """
    try:
        # Read file content
        contents = await file.read()
        
        result = await extract_from_image(
            image_bytes=contents,
            demo_mode=DEMO_MODE
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from services.database import save_form_submission

@app.post("/api/save-form")
async def save_form(form_data: dict = Body(...)):
    """
    Save form submission to database
    """
    try:
        # Add timestamp
        import datetime
        form_data["created_at"] = datetime.datetime.now().isoformat()
        
        result = save_form_submission(form_data)
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Save error: {e}")
        # Don't fail the request if DB fails, just log it
        return {"success": False, "error": str(e)}

@app.post("/api/fill-form")
async def fill_form(form_data: FormData):
    """
    Generate filled PDF form
    """
    try:
        if form_data.scheme not in SCHEMES:
            raise HTTPException(status_code=400, detail="Invalid scheme")
        
        pdf_path = await generate_filled_pdf(
            scheme=form_data.scheme,
            fields=form_data.fields
        )
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"{form_data.scheme}_filled_form.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/demo-status")
async def demo_status():
    """Check if running in demo mode"""
    return {
        "demo_mode": DEMO_MODE,
        "message": "Demo mode uses simulated responses. Add AWS credentials for real AI." if DEMO_MODE else "Running with real AWS services."
    }

# ============= TTS Service =============
from gtts import gTTS
import io
from fastapi.responses import StreamingResponse

class SpeakRequest(BaseModel):
    text: str
    language: str = "hi"

@app.post("/api/speak")
async def text_to_speech(request: SpeakRequest):
    """
    Generate speech from text using Google TTS
    Returns streaming audio (MP3)
    """
    try:
        # Map frontend lang codes to gTTS codes
        # en-IN -> en, hi-IN -> hi, etc.
        lang_code = request.language.split("-")[0]
        
        # gTTS specific tweaks for accents if needed
        tld = 'co.in' if lang_code in ['en', 'hi', 'bn', 'gu', 'kn', 'ml', 'mr', 'ta', 'te', 'ur'] else 'com'
        
        tts = gTTS(text=request.text, lang=lang_code, tld=tld, slow=False)
        
        # Write to in-memory buffer
        buffer = io.BytesIO()
        tts.write_to_fp(buffer)
        buffer.seek(0)
        
        return StreamingResponse(buffer, media_type="audio/mp3")
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= Run Server =============

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Jan-Sahayak API Starting...")
    print(f"📍 URL: http://localhost:{port}")
    print(f"🎮 Demo Mode: {'ON' if DEMO_MODE else 'OFF'}")
    print(f"📋 Schemes: {', '.join(SCHEMES.keys())}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
