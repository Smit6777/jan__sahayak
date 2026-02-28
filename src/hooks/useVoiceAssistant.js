import { useState, useRef, useCallback } from 'react';
import { conversationConfig, SCHEME_FIELD_ORDER, FIELD_QUESTIONS, PHRASES } from '../config/conversationQuestions';

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

    // Get the ordered field list for this scheme
    const getFieldOrder = useCallback(() => {
        if (!scheme) return [];
        return SCHEME_FIELD_ORDER[scheme.id] || scheme.fields || [];
    }, [scheme]);

    // Get question text for a field in the current language
    const getQuestion = (fieldKey) => {
        const langCode = language.split('-')[0]; // 'hi', 'gu', 'en'
        return FIELD_QUESTIONS[fieldKey]?.[langCode]
            || FIELD_QUESTIONS[fieldKey]?.hi
            || `Please tell me your ${fieldKey}`;
    };

    // Action: Ask the next question by step index
    const askNextQuestion = (stepIndex, lang) => {
        const fields = getFieldOrder();
        if (stepIndex >= fields.length) return;
        const fieldKey = fields[stepIndex];
        const question = getQuestion(fieldKey);
        speak(question);
    };

    // Action: Process Response — one field at a time
    const processResponse = async (transcript) => {
        if (!transcript) return;
        setState(AI_STATE.PROCESSING);
        addHistory('user', transcript);

        // ── TRIAGE MODE (no scheme selected yet) ───────────────────────────
        if (state === AI_STATE.TRIAGE) {
            try {
                const response = await fetch('https://jan-sahayak-api.onrender.com/api/recommend-scheme', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript, language })
                });
                const data = await response.json();
                if (data.success) {
                    speak(data.message, () => { if (onSchemeChange) onSchemeChange(data.scheme_id); });
                } else {
                    speak(data.message);
                }
            } catch (e) {
                speak(PHRASES.retry[language.split('-')[0]] || PHRASES.retry.hi);
            }
            return;
        }

        // ── FORM FILLING MODE — step-by-step ───────────────────────────────
        const fields = getFieldOrder();
        const fieldKey = fields[currentStep];
        const langCode = language.split('-')[0];

        // Clean the transcript to extract the field value
        const value = extractValue(transcript, fieldKey);

        if (value && value.length >= 1) {
            // ✅ Got a valid answer — save it
            const newData = { ...collectedData, [fieldKey]: value };
            setCollectedData(newData);
            if (onFieldUpdate) onFieldUpdate(fieldKey, value);

            const ackFn = PHRASES.gotIt[langCode] || PHRASES.gotIt.hi;
            const ack = typeof ackFn === 'function' ? ackFn(value) : ackFn;

            const nextStep = currentStep + 1;

            if (nextStep < fields.length) {
                // More questions remain
                speak(ack, () => {
                    setCurrentStep(nextStep);
                    askNextQuestion(nextStep, language);
                });
            } else {
                // ✅ All fields collected!
                setState(AI_STATE.COMPLETED);
                const doneMsg = PHRASES.done[langCode] || PHRASES.done.hi;
                speak(doneMsg);

                // Auto-save to Supabase
                try {
                    await fetch('https://jan-sahayak-api.onrender.com/api/save-form', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            scheme: scheme?.id || 'unknown',
                            mobile: newData.mobile || '',
                            aadhar: newData.aadhar || '',
                            fields: newData,
                            status: 'completed'
                        })
                    });
                    console.log('✅ Saved to Supabase');
                } catch (e) {
                    console.warn('Supabase save failed (non-critical):', e);
                }

                // Trigger PDF download
                if (onDownload) setTimeout(onDownload, 2000);
            }
        } else {
            // ❌ Couldn't understand — gently retry
            const retryMsg = PHRASES.retry[langCode] || PHRASES.retry.hi;
            speak(retryMsg, () => {
                // Re-ask the same question
                askNextQuestion(currentStep, language);
            });
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
