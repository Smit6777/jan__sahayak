import { useState, useRef, useEffect } from 'react';
import { conversationConfig } from '../config/conversationQuestions';

// States
export const AI_STATE = {
    IDLE: 'idle',
    SPEAKING: 'speaking',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    TRIAGE: 'triage'
};

export function useVoiceAssistant(scheme, onFieldUpdate, onSchemeChange, onDownload) {
    const [state, setState] = useState(AI_STATE.IDLE);
    const [currentStep, setCurrentStep] = useState(0);
    const [language, setLanguage] = useState('hi-IN'); // Default
    const [conversationHistory, setConversationHistory] = useState([]);
    const [collectedData, setCollectedData] = useState({});

    // Refs for speech synthesis to avoid re-renders
    const synthesisRef = useRef(window.speechSynthesis);
    const utteranceRef = useRef(null);

    // Current Field Context
    const currentField = scheme?.fields[currentStep];

    // Helper: Dynamic Time-based Greeting
    const getDynamicGreeting = (lang) => {
        const hour = new Date().getHours();
        let timePhrase = "";

        if (lang === 'en-IN') {
            if (hour < 12) timePhrase = "Good Morning!";
            else if (hour < 17) timePhrase = "Good Afternoon!";
            else timePhrase = "Good Evening!";
        } else if (lang === 'hi-IN') {
            if (hour < 12) timePhrase = "सुप्रभात!";
            else timePhrase = "नमस्ते!";
        } else {
            timePhrase = conversationConfig.greetings[lang].split('!')[0] + "!";
        }

        const baseGreeting = conversationConfig.greetings[lang];
        return `${timePhrase} ${baseGreeting.split('!').slice(1).join('!')}`;
    };

    // Helper: Get random conversational filler
    const getFiller = (lang, type = 'acknowledge') => {
        const fillers = {
            'en-IN': {
                acknowledge: ["Got it.", "Okay.", "Noted.", "Great."],
                thinking: ["Hmm...", "Let me see..."]
            },
            'hi-IN': {
                acknowledge: ["जी ठीक है।", "समझ गयी।", "लिख लिया।"],
                thinking: ["हम्म...", "एक मिनट रुकिए..."]
            },
            'gu-IN': {
                acknowledge: ["હા બરાબર.", "લખી લીધું.", "સારું."],
                thinking: ["હમ...", "એક મિનિટ..."]
            }
        };
        const list = fillers[lang]?.[type] || fillers['en-IN'][type];
        return list[Math.floor(Math.random() * list.length)];
    };

    // Action: Speak with Server-Side TTS
    const speak = async (text, onEnd) => {
        if (!text) return;
        console.log(`🔊 Requesting Audio: "${text}"`);

        // Cancel any existing speech/audio
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        setState(AI_STATE.SPEAKING);
        addHistory('ai', text);

        try {
            console.log(`📡 Fetching audio from backend...`);
            const response = await fetch('https://jan-sahayak-api.onrender.com/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language })
            });

            if (!response.ok) throw new Error(`Server returned ${response.status}`);

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            window.currentAudio = audio;

            audio.onended = () => {
                console.log("✅ Audio Finished Playing");
                setState(AI_STATE.LISTENING);
                URL.revokeObjectURL(audioUrl);
                if (onEnd) onEnd();
            };

            audio.onerror = (e) => {
                console.error("❌ Audio Playback Error (Check Codec/Autoplay):", e);
                setState(AI_STATE.LISTENING);
                if (onEnd) onEnd();
            };

            // Attempt to play
            // Attempt to resume AudioContext if it exists and is suspended
            if (window.audioContext && window.audioContext.state === 'suspended') {
                window.audioContext.resume().then(() => {
                    console.log('AudioContext resumed successfully');
                }).catch(e => {
                    console.error('Error resuming AudioContext:', e);
                });
            }
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("❌ Autoplay prevented:", error);
                    // Fallback because browser blocked audio
                    fallbackSpeak(text, onEnd);
                });
            }

        } catch (error) {
            console.error("❌ Backend TTS Failed (Is 'python backend/main.py' running?):", error);
            console.error("Server unreachable");
            console.warn("Falling back to browser voice...");
            fallbackSpeak(text, onEnd);
        }
    };

    // Backup: Client-Side Fallback
    const fallbackSpeak = (text, onEnd) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.onend = () => {
            setState(AI_STATE.LISTENING);
            if (onEnd) onEnd();
        };
        utterance.onerror = () => {
            setState(AI_STATE.LISTENING);
            if (onEnd) onEnd();
        };
        window.speechSynthesis.speak(utterance);
    };

    const addHistory = (sender, text) => {
        setConversationHistory(prev => [...prev, { sender, text, timestamp: Date.now() }]);
    };

    // Action: Start Conversation
    const startConversation = async (lang = 'hi-IN') => {
        setLanguage(lang);
        setState(AI_STATE.PROCESSING);
        setConversationHistory([]);
        setCurrentStep(0);

        // If no scheme is selected, start in TRIAGE mode
        if (!scheme) {
            console.log("🚀 Starting in TRIAGE mode");
            setState(AI_STATE.TRIAGE);
            const greeting = getDynamicGreeting(lang);
            const helpMsg = lang === 'hi-IN'
                ? "मैं आपकी कैसे सहायता कर सकती हूँ? (How can I help you?)"
                : "How can I help you today?";

            await speak(`${greeting} ${helpMsg}`);
            return;
        }

        const greeting = getDynamicGreeting(lang);
        await speak(greeting, () => {
            askNextQuestion(0, lang);
        });
    };

    // Action: Ask Question
    const askNextQuestion = (stepIndex, lang) => {
        const fieldName = scheme.fields[stepIndex];
        const question = conversationConfig.questions[lang][fieldName] || `Please tell me your ${fieldName}`;
        speak(question);
    };

    // Action: Process Response
    const processResponse = async (transcript) => {
        console.log(`🎤 Received Transcript: "${transcript}"`);
        if (!transcript) return;

        setState(AI_STATE.PROCESSING);
        addHistory('user', transcript);

        // --- TRIAGE MODE ---
        if (state === AI_STATE.TRIAGE) {
            console.log("🕵️ Analyzing user problem...");
            try {
                const response = await fetch('https://jan-sahayak-api.onrender.com/api/recommend-scheme', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript, language })
                });
                const data = await response.json();
                console.log("💡 Recommendation:", data);

                if (data.success) {
                    speak(data.message, () => {
                        if (onSchemeChange) onSchemeChange(data.scheme_id);
                    });
                } else {
                    speak(data.message); // Ask for clarification
                }
            } catch (e) {
                console.error("Recommend Error:", e);
                speak("Sorry, I am having trouble connecting to the server.");
            }
            return;
        }

        // --- CONVERSATIONAL CHECK ---
        // Enhanced regex to catch more natural language vs raw data
        const isQuestionOrChat = /^(what|how|why|can|could|will|do|does|tell|help|hello|hi|hey|bot|ai|i need|reply|namaste|good|ok|thanks)/i.test(transcript);

        // Also if the transcript is long (> 4 words) it's likely a sentence, not typically a single field value unless it's an address
        const isLongSentence = transcript.split(' ').length > 4;

        // Address field is the exception where we expect long inputs
        const isAddressField = currentField === 'address';

        // Attempt Extraction
        const cleanedValue = extractValue(transcript, currentField);
        console.log(`🔍 Extracted Field [${currentField}]: "${cleanedValue}"`);

        // PRIORITY DECISION MATRIX:
        // 1. If it looks like a question/chat -> Chat
        // 2. If valid value AND (not a long sentence OR is address) -> Form Fill
        // 3. Otherwise -> Chat (Fallback to AI for clarity)

        if (cleanedValue && !isQuestionOrChat && (!isLongSentence || isAddressField)) {
            console.log("✅ Valid field data found. Acknowledging...");
            const newData = { ...collectedData, [currentField]: cleanedValue };
            setCollectedData(newData);
            if (onFieldUpdate) onFieldUpdate(currentField, cleanedValue);

            const filler = getFiller(language, 'acknowledge');
            const ack = `${filler} ${conversationConfig.verifications[language].gotIt} ${cleanedValue}`;

            speak(ack, () => {
                if (currentStep < scheme.fields.length - 1) {
                    setCurrentStep(prev => {
                        const next = prev + 1;
                        askNextQuestion(next, language);
                        return next;
                    });
                } else {
                    setState(AI_STATE.COMPLETED);
                    speak(conversationConfig.questions[language].done);
                }
            });
        }
        else {
            // FALLBACK TO AI (Chat)
            console.log("⚠️ Input ambiguous or conversational. Asking Backend AI for Intent...");
            try {
                const response = await fetch('https://jan-sahayak-api.onrender.com/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript, language, scheme: scheme ? 'general' : 'triage' })
                });

                const aiResponse = await response.json();
                console.log(`🤖 Backend AI Response:`, aiResponse);

                if (aiResponse && aiResponse.text) {
                    const { text, action, scheme: targetScheme } = aiResponse;

                    speak(text, () => {
                        if (action === 'SWITCH_SCHEME' && targetScheme) {
                            console.log(`🔄 Switching Scheme to: ${targetScheme}`);
                            if (onSchemeChange) onSchemeChange(targetScheme);
                        } else if (action === 'DOWNLOAD_PDF') {
                            console.log(`📄 Triggering PDF Download`);
                            if (onDownload) onDownload();
                        } else {
                            // If it was just a side-chat, assume we might stay on the current step or need to re-prompt
                            // But asking repeatedly is annoying. Let's just wait for next input.
                            // UNLESS the AI response was "I didn't understand", then maybe we re-prompt?
                            // For now, let's just stay in listening state.
                        }
                    });
                } else {
                    console.warn("🤖 Gemini returned empty response.");
                    speak(conversationConfig.verifications[language].retry);
                }
            } catch (err) {
                console.error("❌ AI Fallback Error:", err);
                speak(conversationConfig.verifications[language].retry);
            }
        }
    };

    const extractValue = (text, fieldType) => {
        if (!text) return null;
        if (fieldType === 'mobile') return text.match(/\d{10}/)?.[0] || text.replace(/\D/g, '');
        if (fieldType === 'aadhar') return text.match(/\d{4}\s?\d{4}\s?\d{4}/)?.[0] || text.replace(/\D/g, '');

        // Name Cleaning
        let cleanText = text.replace(/(my name is|mera naam|naam|hai|is)/gi, '').trim();
        // Reject if it's just a common command word or too short
        if (/^(tell|call|what|how|why|can|ok|yes|no|stop|help)$/i.test(cleanText) || cleanText.length < 3) {
            return null;
        }
        return cleanText;
    };

    return {
        state,
        currentStep,
        currentField,
        conversationHistory,
        startConversation,
        processResponse,
        language
    };
}
