# 🇮🇳 Jan-Sahayak — AI-Powered Government Form Assistant

> **Ek Awaaz. Ek Form. Ek Bharat.**
> *One Voice. One Form. One India.*

[![AI for Bharat Hackathon](https://img.shields.io/badge/AI%20for%20Bharat-Hackathon%202026-orange)](https://aibharat.in)
[![Built with AWS Bedrock](https://img.shields.io/badge/Built%20with-AWS%20Bedrock-yellow)](https://aws.amazon.com/bedrock/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)](https://react.dev/)

---

## 🎯 What is Jan-Sahayak?

Jan-Sahayak is a **voice-first AI assistant** that helps rural Indian citizens fill government forms and access government schemes — in their own language, without needing to read or write.

Instead of navigating complex government websites, users just **speak naturally** ("Mujhe khet ki madad chahiye" - I need farming help), and Jan-Sahayak:
1. Identifies the right government scheme
2. Collects all required information through friendly conversation
3. Generates the **official, correctly formatted government PDF** instantly
4. Ready to download, print, and submit

---

## 🏛️ Supported Government Schemes (8 Schemes)

| Scheme | Benefit |
|--------|---------|
| 🌾 PM Kisan Samman Nidhi | ₹6,000/year cash transfer to farmers |
| 🔥 PM Ujjwala Yojana | Free LPG gas connection |
| 🍚 Ration Card Application | Subsidized food grains |
| 🏥 Ayushman Bharat (PMJAY) | ₹5 lakh/year free health insurance |
| 🏗️ PM Awas Yojana | Housing subsidy for poor families |
| 🏠 Vidhva Sahay | ₹1,250/month pension for widows |
| 👧 Sukanya Samriddhi Yojana | Savings scheme for girl child |
| 💳 Kisan Credit Card | Agricultural credit up to ₹3 lakh |

---

## 🗣️ Languages Supported
- **Hindi** (hi-IN)
- **Gujarati** (gu-IN)  
- **English** (en-IN)

---

## 🛠️ Tech Stack

### Frontend
- **React + Vite** — Fast, modern UI
- **Three.js** — 3D animated backgrounds
- **Framer Motion** — Smooth animations
- **Web Speech API** — Browser-native voice recognition + speech synthesis

### Backend
- **FastAPI** — Python REST API
- **AWS Bedrock (Claude 3 Haiku)** — AI conversation + form field extraction
- **PyMuPDF (fitz)** — Exact coordinate PDF generation on real government forms
- **Supabase** — Grievance and submission tracking
- **AWS Lambda** — Serverless deployment

---

## 🏗️ Architecture

```
User (Voice/Text)
       ↓
React Frontend (Browser)
       ↓  REST API
FastAPI Backend (AWS Lambda)
       ↓
AWS Bedrock → Claude 3 Haiku
       ↓ JSON extraction
PyMuPDF PDF Generator
       ↓
Official Government PDF ✅
```

---

## 🚀 How to Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/your-username/jan-sahayak.git
cd jan-sahayak
```

### 2. Frontend
```bash
npm install
npm run dev
# Runs at http://localhost:5173
```

### 3. Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs at http://localhost:8000
```

### 4. Environment Variables
Create `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
DEMO_MODE=false
```

---

## 📄 How PDF Generation Works

Jan-Sahayak downloads the **real official government PDFs** and overlays the user's data at precise coordinates using PyMuPDF:

1. Official form template loaded (e.g., `pm-kisan.pdf`)
2. Field coordinates precisely mapped (X, Y in PDF points)
3. Text inserted at exact positions using Helvetica font
4. For box-grid forms (Ujjwala): one character per box, exact width
5. For checkbox fields (Gender, Category): dynamic X offset to correct box

---

## 🌐 Live Demo

**API (Render):** https://jan-sahayak-api.onrender.com

---

## 📁 Project Structure

```
jan-sahayak/
├── src/
│   ├── pages/
│   │   ├── Home.jsx            # Landing page (3D animated)
│   │   ├── FormFiller.jsx      # Main voice + form UI
│   │   ├── Adhikar.jsx         # Know Your Rights
│   │   ├── Gramvani.jsx        # File Complaints
│   │   └── Shikayat.jsx        # Grievance Tracking
│   ├── hooks/
│   │   └── useVoiceAssistant.js # AI conversation state machine
│   └── config/
│       └── conversationQuestions.js # Multilingual question bank
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── services/
│   │   ├── bedrock_agent.py    # Claude 3 AI extraction
│   │   ├── pdf_generator.py    # PDF coordinate mapping
│   │   └── textract_service.py # Aadhaar OCR
│   └── forms/                  # Downloaded government PDFs
└── README.md
```

---

## 🏆 AI for Bharat Hackathon 2026

Built for the **AI for Bharat Hackathon 2026** using:
- ✅ Amazon Bedrock (Claude 3 Haiku)
- ✅ AWS Lambda (Serverless API)
- ✅ AWS Textract (Document OCR)

> Addressing UN SDG 1 (No Poverty), SDG 10 (Reduced Inequalities), SDG 16 (Strong Institutions)

---

*Made with ❤️ for Bharat*
