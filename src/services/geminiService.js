import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API
// Ideally this key should be in a .env file: VITE_GEMINI_API_KEY
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let model = null;

if (API_KEY) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
}

const SCHEMES_CONTEXT = `
You are Jan-Sahayak, a smart government assistant.
Your goal is to help users find the right scheme and fill forms.
Available Schemes:
1. "pm-kisan" (PM Kisan Samman Nidhi): For farmers needing financial support.
2. "vidhva-sahay" (Vidhva Sahay Yojana): For widows needing pension.
3. "ration-card" (Ration Card): For food security and subsidized grains.
4. "ayushman-bharat" (Ayushman Bharat): For health insurance.
5. "pm-awas" (PM Awas Yojana): For housing support.

INSTRUCTIONS:
- If the user describes a problem, RECOMMEND the best scheme.
- If the user asks to "download" or "submit", trigger the DOWNLOAD_PDF action.
- ALWAYS response in this JSON format:
{
  "text": "Your conversational response here (in the user's language)",
  "action": "NONE" | "SWITCH_SCHEME" | "DOWNLOAD_PDF",
  "scheme": "scheme-id-from-list-above" (optional, required for SWITCH_SCHEME)
}
- Do NOT output markdown. Output pure JSON.
`;

export const getGeminiResponse = async (history, userInput) => {
    if (!model) {
        console.warn("Gemini API Key is missing.");
        return null;
    }

    try {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SCHEMES_CONTEXT }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will act as Jan-Sahayak and output strict JSON." }]
                },
                ...history.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(userInput + " (Respond in JSON)");
        const responseText = await result.response.text();

        // Clean markdown code blocks if present
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", responseText);
            return { text: responseText, action: "NONE" }; // Fallback
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return null;
    }
};
