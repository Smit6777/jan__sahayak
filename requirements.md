# Jan Sahayak - AI-Powered Government Form Filler

## Project Overview
Jan Sahayak is an AI-powered multilingual assistant designed to help Indian citizens, particularly in rural areas, easily access and apply for government schemes (like PM Kisan, Vidhva Sahay, etc.). It abstracts away the complexity of complex bureaucracy through a simple voice-based interface.

## Core Requirements

### 1. Functional Requirements
*   **Voice-First Interface**:
    *   The system must accept voice input in Indian languages (Hindi, English, etc.).
    *   The system must provide voice feedback (Text-to-Speech) to guide the user.
*   **Multilingual Support**:
    *   Support for Hindi (hi-IN) and English (en-IN).
    *   Extensible to other regional languages (Gujarati, Tamil, etc.).
*   **Intelligent Form Filling**:
    *   **Field Extraction**: Automatically extract relevant form data (Name, Aadhar, Mobile, etc.) from natural conversation.
    *   **Context Awareness**: Understand the intent (e.g., "I need money for farming" -> Recommends PM Kisan Scheme).
*   **Scheme Recommendation**:
    *   Analyze user distress/need description to suggest the most appropriate government scheme.
*   **Document Processing (OCR)**:
    *   Upload images of Aadhar cards to automatically extract and pre-fill details using OCR (AWS Textract/Google Vision).
*   **PDF Generation**:
    *   Generate a filled standard PDF application form based on the collected data.
*   **Demo Mode**:
    *   Allow full functionality without live API keys for evaluation purposes (simulated AI responses).

### 2. Non-Functional Requirements
*   **Accessibility**: High contrast UI and large elements for elderly/low-literacy users.
*   **Performance**: Fast voice processing (< 2 seconds latency).
*   **Scalability**: Microservices ready architecture (Frontend/Backend separation).
*   **Offline Tolerance**: Graceful error handling for poor network conditions.

## Technical Stack
*   **Frontend**: React + Vite + TailwindCSS + Framer Motion (Animations).
*   **Backend**: Python (FastAPI).
*   **AI/ML**:
    *   **LLM**: Google Gemini / AWS Bedrock (Claude) for natural language understanding.
    *   **TTS/STT**: Web Speech API + gTTS/Server-side TTS.
    *   **OCR**: AWS Textract (or simulated).
*   **Database**: Supabase / PostgreSQL (for form submissions).

## User Flow
1.  **Landing**: User opens app -> Greetings in local language.
2.  **Triage**: User states problem ("My crops failed").
3.  **Recommendation**: AI suggests "PM Kisan Scheme".
4.  **Application**: AI asks question-by-question (Name? Aadhar? Bank?).
5.  **Voice Input**: User answers via voice.
6.  **Verification**: AI confirms details.
7.  **Completion**: Form submitted -> PDF Generated.
