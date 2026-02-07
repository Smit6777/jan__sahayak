# Jan Sahayak - System Design

## 1. High-Level Architecture
Jan Sahayak follows a client-server architecture with a clear separation of concerns, designed for scalability and modularity.

```mermaid
graph TD
    User[User (Voice/Text)] --> Frontend[React Frontend (Vite)]
    Frontend --> |REST API| Backend[FastAPI Backend]
    
    subgraph Frontend Logic
        Audio[Web Speech API]
        UI[Framer Motion UI]
        State[React State / Context]
    end
    
    subgraph Backend Services
        Router[FastAPI Router]
        Agent[Smart Agent (Gemini/Claude)]
        OCR[OCR Service (Textract)]
        PDF[PDF Generator (ReportLa)]
        DB_Adapter[Database Adapter]
    end
    
    Backend --> |LLM Queries| AI_Provider[Google Gemini / AWS Bedrock]
    Backend --> |Image Processing| AWS_OCR[AWS Textract]
    Backend --> |Persistence| DB[(Supabase / PostgreSQL)]
```

## 2. Component Details

### Frontend (`src/`)
*   **`App.jsx`**: Main entry point, handles routing (React Router).
*   **`components/AssistantWidget.jsx`**: core visual component for the AI assistant (Orb animation).
*   **`hooks/useVoiceAssistant.js`**: Custom hook managing the conversation state machine (Idle -> Listening -> Processing -> Speaking).
*   **`lib/speech.js`**: Wrapper around `window.speechSynthesis` and `webkitSpeechRecognition`.

### Backend (`backend/`)
*   **`main.py`**: FastAPI entry point, defines API routes (`/api/chat`, `/api/extract-from-voice`).
*   **`services/bedrock_agent.py`**: Core AI logic. Uses LLM to extract JSON from unstructured voice transcripts. Validates data.
*   **`services/textract_service.py`**: Handles image uploads and extracts text using OCR.
*   **`services/pdf_generator.py`**: Maps collected JSON data to standard government form templates.

## 3. Data Flow (Voice Form Filling)
1.  **Input**: User speaks ("My name is Rajesh").
2.  **Capture**: Frontend captures audio -> converts to text (STT).
3.  **Processing**: Text sent to Backend (`/api/extract-from-voice`).
4.  **Extraction**: Backend uses LLM to identify intent/entities (Name="Rajesh").
5.  **Response**: Backend returns JSON `{ "field": "name", "value": "Rajesh", "status": "success" }`.
6.  **Update**: Frontend updates state, visuals show confirmation.
7.  **Feedback**: Frontend plays TTS confirmation ("Got it, Rajesh").

## 4. Database Schema (Supabase)
**Table: `submissions`**
*   `id`: UUID (Primary Key)
*   `scheme_id`: String (e.g., 'pm-kisan')
*   `form_data`: JSONB (Stores dynamic fields: name, aadhar, etc.)
*   `status`: Enum ('pending', 'submitted', 'rejected')
*   `created_at`: Timestamp
*   `user_voice_log`: JSONB (Optional: Audit trail of conversation)

## 5. Security & Privacy
*   **Data Minimization**: Only collect required fields.
*   **Encryption**: HTTPS for all API calls.
*   **No Persistent Voice**: Audio is processed and discarded; not stored permanently unless opted-in for audit.

## 6. Future Scalability
*   **Regional Language Expansion**: Add support for 22 scheduled languages using specialized models (Bhashini).
*   **Offline Mode**: Implement local-first architecture (PWA) with on-device lightweight models (TensorFlow.js) for basic form filling without internet.
