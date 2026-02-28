# Jan-Sahayak: Voice-First Governance for Bharat

*An AI-powered multilingual assistant designed to bridge the digital divide in rural India by making government schemes accessible through natural conversation.*

---

## 🚀 The Problem
Accessing government schemes in rural India remains a massive challenge due to **complex bureaucracy, language barriers, and low digital literacy**. Typical online forms require users to read formal language, type precisely, and navigate confusing dropdowns. This forces citizens, particularly farmers and widows in distress, to rely on costly middlemen.

## 💡 Our Solution
**Jan-Sahayak** acts as a virtual government worker. Instead of typing into a form, citizens simply speak to our AI in their native language (currently Hindi and Gujarati). 

*   **Intelligent Triage:** If a user says "My crops failed", the AI recommends the *PM Kisan Scheme*.
*   **Conversational Form Filling:** The AI asks for details one by one (Name, Aadhar, Bank Info).
*   **Smart Extraction:** Our backend uses **AWS Bedrock (Claude)** to extract the structured data perfectly from unstructured voice transcripts.
*   **Document OCR:** Users can upload an image of their Aadhar card, which is parsed by **AWS Textract** to auto-fill the digital form.
*   **Final Output:** Generates a beautifully filled PDF application ready for submission.

## 🛠️ Tech Stack & Architecture
Jan-Sahayak follows a scalable, microservices client-server architecture.

### Frontend
*   **React + Vite**: For a fast, responsive Single Page Application.
*   **Framer Motion**: Powers the smooth 3D "Orb" that visualizes the AI listening, processing, and speaking states.
*   **Web Speech API**: Captures user audio and converts it to text in real-time.

### Backend
*   **FastAPI (Python)**: High-performance async API to handle frontend requests.
*   **AWS Bedrock (Claude 3.5 Sonnet)**: The core brain that extracts JSON parameters from messy conversational transcripts.
*   **Amazon Textract**: For precise OCR data extraction from uploaded identity documents.
*   **gTTS**: Server-side Text-to-Speech to generate reliable, accent-appropriate voice responses.
*   **Supabase (PostgreSQL)**: To securely store finalized application submissions.

## ⚙️ Running Locally

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   AWS Account with Bedrock access

### 1. Start the Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt

# Create a .env file based on .env.example
# Add your AWS keys to enable real AI extraction
cp .env.example .env

# Run the server on http://localhost:8000
python main.py
```

### 2. Start the Frontend (React)
```bash
# From the root directory
npm install
npm run dev
# App will run on http://localhost:5173
```

## 🎥 Demonstration Video
[Link to YouTube/Drive Demo Video - To Be Added]

---
**Built for the Hack2skill AI for Bharat Hackathon - Prototype Phase**
