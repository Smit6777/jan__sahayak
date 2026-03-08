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
from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Form
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
        "fields": ["state", "district", "subDistrict", "village", "name", "fatherName", "gender", "category", "aadhar", "mobile", "address", "pinCode", "ifsc", "bankName", "bankAccount"]
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
        "fields": ["name", "dob", "category", "aadhar", "mobile", "houseName", "street", "village", "district", "state", "pinCode", "bankName", "branchName", "ifsc", "bankAccount", "bplNumber"]
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


class ChatRequest(BaseModel):
    message: str
    history: list = []   # list of {"role": "user"/"assistant", "content": "..."}
    language: str = "hi"

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Human-like AI chat — greets, asks questions, collects form data.
    """
    try:
        from services.bedrock_agent import chat_with_ai

        result = await chat_with_ai(
            history=request.history,
            message=request.message,
            demo_mode=DEMO_MODE
        )
        return result
    except Exception as e:
        return {"text": "Kuch gadbad ho gayi. Dobara try karein.", "action": "NONE", "fields": {}}

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

from services.database import save_form_submission, get_user_submissions
from fastapi import Request
import time

# Simple in-memory rate limiter for submissions endpoint (Hackathon scale)
submission_rate_limits = {}

@app.get("/api/submissions/{identifier}")
async def get_submissions(identifier: str, request: Request, limit: int = 10, offset: int = 0):
    """
    Fetch past submissions for a user (Mobile or Aadhar).
    Includes rate limiting to prevent spam.
    """
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Rate limit: max 10 requests per minute per IP
    if client_ip in submission_rate_limits:
        requests, window_start = submission_rate_limits[client_ip]
        if current_time - window_start > 60:
            submission_rate_limits[client_ip] = [1, current_time]
        elif requests >= 10:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        else:
            submission_rate_limits[client_ip][0] += 1
    else:
        submission_rate_limits[client_ip] = [1, current_time]

    try:
        results = get_user_submissions(identifier, limit=limit, offset=offset)
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        if isinstance(result, dict) and "error" in result:
             # Pass validation errors back to frontend
             return {"success": False, "error": result["error"]}
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Save error: {e}")
        # Don't fail the request if DB fails, just log it
        return {"success": False, "error": str(e)}

@app.post("/api/fill-form")
async def fill_form(
    scheme: str = Form(...),
    fields: str = Form(...),          # JSON string of field values
    photo: Optional[UploadFile] = File(None),                    # Passport photo
    aadhar_copy: Optional[UploadFile] = File(None),             # Aadhar copy
    income_cert: Optional[UploadFile] = File(None),             # Income certificate
    other_doc_1: Optional[UploadFile] = File(None),             # Any other document
    other_doc_2: Optional[UploadFile] = File(None),
):
    """
    Generate filled PDF form using the real government PDF.
    Accepts:
      - scheme: scheme ID
      - fields: JSON-stringified dict of form field values
      - photo: passport-size photo of the applicant
      - aadhar_copy: scanned Aadhar card image
      - income_cert: income certificate image
      - other_doc_1, other_doc_2: any other supporting documents
    """
    try:
        import json as _json
        parsed_fields = _json.loads(fields)

        if scheme not in SCHEMES:
            raise HTTPException(status_code=400, detail="Invalid scheme")

        # Read photo bytes
        photo_bytes = await photo.read() if photo else None

        # Build extra_docs list from uploaded supporting documents
        extra_docs = []
        doc_map = [
            (aadhar_copy, "Aadhaar Card Copy / आधार कार्ड प्रति"),
            (income_cert, "Income Certificate / आय प्रमाण पत्र"),
            (other_doc_1, "Supporting Document 1 / सहायक दस्तावेज़ 1"),
            (other_doc_2, "Supporting Document 2 / सहायक दस्तावेज़ 2"),
        ]
        for upload_file, label in doc_map:
            if upload_file:
                b = await upload_file.read()
                if b:
                    extra_docs.append({"label": label, "bytes": b})

        pdf_path = await generate_filled_pdf(
            scheme=scheme,
            fields=parsed_fields,
            photo_bytes=photo_bytes,
            extra_docs=extra_docs if extra_docs else None,
        )

        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"{scheme}_official_form.pdf"
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
    Generate speech from text using Amazon Polly (Indian voices).
    Falls back to gTTS if Polly unavailable.
    """
    # Map frontend language codes to Amazon Polly voices (Indian)
    POLLY_VOICES = {
        "hi": "Aditi",     # Hindi female (Indian)
        "hi-IN": "Aditi",
        "en": "Raveena",   # English Indian female
        "en-IN": "Raveena",
        "gu": "Aditi",     # No native Gujarati — use Hindi Aditi
        "gu-IN": "Aditi",
    }

    lang_code = request.language.split("-")[0]

    # ── Try Amazon Polly first ────────────────────────────────────────────────
    try:
        import boto3

        # In Lambda: IAM role provides credentials automatically.
        # Locally: reads AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from .env.
        polly_kwargs = {"service_name": "polly", "region_name": os.getenv("AWS_REGION", "us-east-1")}
        ak = os.getenv("AWS_ACCESS_KEY_ID")
        sk = os.getenv("AWS_SECRET_ACCESS_KEY")
        if ak and sk:
            polly_kwargs["aws_access_key_id"] = ak
            polly_kwargs["aws_secret_access_key"] = sk
        polly = boto3.client(**polly_kwargs)

        voice_id = POLLY_VOICES.get(request.language, POLLY_VOICES.get(lang_code, "Aditi"))
        polly_lang = "hi-IN" if lang_code in ["hi", "gu"] else "en-IN"

        response = polly.synthesize_speech(
            Text=request.text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            LanguageCode=polly_lang,
            Engine="standard"
        )

        audio_stream = response["AudioStream"].read()
        return StreamingResponse(io.BytesIO(audio_stream), media_type="audio/mp3")

    except Exception as polly_err:
        print(f"Polly TTS failed: {polly_err} — falling back to gTTS")

    # ── Fallback: gTTS ────────────────────────────────────────────────────────
    try:
        tld = 'co.in' if lang_code in ['en', 'hi', 'bn', 'gu', 'kn', 'ml', 'mr', 'ta', 'te'] else 'com'
        tts = gTTS(text=request.text, lang=lang_code, tld=tld, slow=False)
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

@app.get("/api/news")
async def get_news():
    """Latest government scheme news feed"""
    news = [
        {"id": 1, "icon": "??", "tag": "PM Kisan", "title": "PM Kisan ?? 19??? ????? ????",
         "body": "2000 ?? ????? ??? ????? ??????? ?? ???? ??? ??? ?? ???",
         "date": "4 ????? 2026", "color": "#22c55e"},
        {"id": 2, "icon": "??", "tag": "Ujjwala", "title": "???????? 3.0  75 ??? ?? ???????",
         "body": "BPL ???????? ?? 75 ??? ?? LPG ??????? ???? ?? ??????",
         "date": "28 ????? 2026", "color": "#f97316"},
        {"id": 3, "icon": "??", "tag": "Ayushman", "title": "????????  70+ ?? 5 ???",
         "body": "70 ??? ?? ??? ?? ??? ????????? ?? 5 ??? ?? ????????? ?????",
         "date": "20 ????? 2026", "color": "#06b6d4"},
        {"id": 4, "icon": "???", "tag": "PM Awas", "title": "PM ????  2 ????? ?? ??",
         "body": "??????? ?????? ??? 2 ????? ?? ????? ?? ????? ?? ???????",
         "date": "15 ????? 2026", "color": "#a855f7"},
        {"id": 5, "icon": "??", "tag": "Sukanya", "title": "???????  ????? ?? 8.2%",
         "body": "??????? ??????? ?? ?? ?????? 8.2% ????? ???????",
         "date": "10 ????? 2026", "color": "#ec4899"},
    ]
    return {"success": True, "news": news}


from pydantic import BaseModel as PydanticBaseModel

class ComplaintRequest(PydanticBaseModel):
    name: str
    mobile: str
    type: str
    description: str

@app.post("/api/complaint")
async def submit_complaint(req: ComplaintRequest):
    """Submit a grievance"""
    import random, string, datetime
    ref_no = "JS-" + "".join(random.choices(string.digits, k=6))
    return {"success": True, "ref_no": ref_no, "message": "Complaint registered!"}
