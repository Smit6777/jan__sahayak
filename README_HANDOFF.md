# Jan-Sahayak - Project Handoff 🚀

## Project Overview
**Jan-Sahayak** is an AI-powered government form filling assistant designed for Indian citizens. It features voice input (Hindi/English), Aadhar OCR, and automated PDF generation, all wrapped in a futuristic "Cyberpunk/GovTech" UI.

**Location:** `C:\Users\smitm\new\jan-sahayak\`

## 📂 Key Folders & Files
*   **Frontend:** `src/` (React, Vite, Three.js)
    *   `src/pages/Home.jsx` - Landing page with 3D animations.
    *   `src/pages/FormFiller.jsx` - Main form logic (Voice + AI).
    *   `src/components/Scene3D.jsx` - 3D Background elements.
    *   `src/index.css` - Global theme variables (Neon/Dark).
*   **Backend:** `backend/` (FastAPI, Python)
    *   `backend/main.py` - API Server & Endpoints.
    *   `backend/services/` - Logic for Bedrock, Database, PDF.
    *   `backend/.env` - Credentials (Supabase, AWS).

## 🛠️ How to Run

### 1. Frontend (UI)
```bash
cd jan-sahayak
npm run dev
# Opens at http://localhost:5173
```

### 2. Backend (API)
```bash
cd jan-sahayak/backend
python main.py
# Runs at http://localhost:8000
```

## 🔐 Credentials
Your `backend/.env` is configured with:
*   **Supabase:** Connected (`orixhn...`)
*   **AWS:** set to `DEMO_MODE=true` (Update if needed)

## 📝 Recent Changes
*   **Visual Overhaul:** Dark/Neon theme applied.
*   **Database:** Form submissions saved to Supabase.
*   **AI:** "Thinking..." state animation added.

---
*Created by Antigravity GenAI Assistant*
