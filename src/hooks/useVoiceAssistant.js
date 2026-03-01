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
    const [language, setLanguage] = useState('hi-IN');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [collectedData, setCollectedData] = useState({});

    // ── FIX #1 & #2: Use refs so async callbacks always read the latest values ──
    const stateRef = useRef(AI_STATE.IDLE);
    const currentStepRef = useRef(0);
    const languageRef = useRef('hi-IN');
    const collectedDataRef = useRef({});
    const schemeRef = useRef(scheme);
    schemeRef.current = scheme; // keep in sync

    const setStateAndRef = (s) => {
        stateRef.current = s;
        setState(s);
    };

    const setStepAndRef = (n) => {
        currentStepRef.current = n;
        setCurrentStep(n);
    };

    // ── FIX #3: Gujarati time-based greeting ─────────────────────────────────
    const getDynamicGreeting = (lang) => {
        const hour = new Date().getHours();

        if (lang === 'en-IN') {
            const time = hour < 12 ? "Good Morning!" : hour < 17 ? "Good Afternoon!" : "Good Evening!";
            return `${time} ${conversationConfig.greetings[lang]}`;
        } else if (lang === 'hi-IN') {
            const time = hour < 12 ? "सुप्रभात!" : "नमस्ते!";
            return `${time} ${conversationConfig.greetings[lang]}`;
        } else if (lang === 'gu-IN') {
            // FIX: explicit Gujarati time phrase
            const time = hour < 12 ? "સુપ્રભાત!" : hour < 17 ? "નમસ્તે!" : "શુભ સાંજ!";
            return `${time} ${conversationConfig.greetings[lang]}`;
        }
        // fallback
        return conversationConfig.greetings[lang] || conversationConfig.greetings['hi-IN'];
    };

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
        const list = fillers[lang]?.[type] || fillers['hi-IN'][type];
        return list[Math.floor(Math.random() * list.length)];
    };

    // ── TTS: try backend, fall back to browser speech synthesis ─────────────
    const speak = useCallback(async (text, onEnd) => {
        if (!text) {
            if (onEnd) onEnd();
            return;
        }
        console.log(`🔊 Speaking: "${text}"`);

        // Stop any currently playing audio
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio.onended = null;
            window.currentAudio = null;
        }
        window.speechSynthesis?.cancel();

        setStateAndRef(AI_STATE.SPEAKING);
        addHistory('ai', text);

        const lang = languageRef.current;

        // ── Try backend TTS first ────────────────────────────────────────────
        try {
            const response = await fetch('https://jan-sahayak-api.onrender.com/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language: lang })
            });

            if (!response.ok) throw new Error(`Backend TTS returned ${response.status}`);

            const blob = await response.blob();
            if (!blob || blob.size === 0) throw new Error('Empty audio blob');

            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            window.currentAudio = audio;

            await new Promise((resolve) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    window.currentAudio = null;
                    resolve();
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(audioUrl);
                    window.currentAudio = null;
                    resolve(); // don't reject, just continue
                };
                audio.play().catch(() => {
                    // Autoplay blocked — fall through to browser TTS
                    URL.revokeObjectURL(audioUrl);
                    window.currentAudio = null;
                    resolve();
                });
            });

            setStateAndRef(AI_STATE.LISTENING);
            if (onEnd) onEnd();
            return;

        } catch (err) {
            console.warn('⚠️ Backend TTS failed, using browser voice:', err.message);
        }

        // ── Fallback: Browser Web Speech API ────────────────────────────────
        fallbackSpeak(text, lang, onEnd);
    }, []);

    const fallbackSpeak = (text, lang, onEnd) => {
        if (!window.speechSynthesis) {
            setStateAndRef(AI_STATE.LISTENING);
            if (onEnd) onEnd();
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang || 'hi-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;

        // Pick a female voice if available
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v =>
            v.lang.startsWith(lang.split('-')[0]) && v.name.toLowerCase().includes('female')
        ) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (femaleVoice) utterance.voice = femaleVoice;

        utterance.onend = () => {
            setStateAndRef(AI_STATE.LISTENING);
            if (onEnd) onEnd();
        };
        utterance.onerror = () => {
            setStateAndRef(AI_STATE.LISTENING);
            if (onEnd) onEnd();
        };
        window.speechSynthesis.speak(utterance);
    };

    const addHistory = (sender, text) => {
        setConversationHistory(prev => [...prev, { sender, text, timestamp: Date.now() }]);
    };

    // ── Get field order for current scheme ─────────────────────────────────
    const getFieldOrder = useCallback(() => {
        const s = schemeRef.current;
        if (!s) return [];
        return SCHEME_FIELD_ORDER[s.id] || s.fields || [];
    }, []);

    // ── Get question in correct language ────────────────────────────────────
    const getQuestion = (fieldKey) => {
        const langCode = languageRef.current.split('-')[0];
        return FIELD_QUESTIONS[fieldKey]?.[langCode]
            || FIELD_QUESTIONS[fieldKey]?.hi
            || `Please tell me your ${fieldKey}`;
    };

    // ── Ask next question by step index ─────────────────────────────────────
    const askNextQuestion = (stepIndex, lang) => {
        const fields = getFieldOrder();
        if (stepIndex >= fields.length) return;
        const fieldKey = fields[stepIndex];
        const question = getQuestion(fieldKey);
        speak(question);
    };

    // ── Start Conversation ───────────────────────────────────────────────────
    const startConversation = async (lang = 'hi-IN') => {
        languageRef.current = lang;
        setLanguage(lang);
        setConversationHistory([]);
        setStepAndRef(0);
        collectedDataRef.current = {};
        setCollectedData({});

        if (!schemeRef.current) {
            // TRIAGE mode
            console.log('🚀 TRIAGE mode');
            setStateAndRef(AI_STATE.TRIAGE);
            const greeting = getDynamicGreeting(lang);
            const helpMsg = lang === 'hi-IN'
                ? 'मैं आपकी कैसे सहायता कर सकती हूँ? आप किस सरकारी योजना के लिए फॉर्म भरना चाहते हैं?'
                : lang === 'gu-IN'
                    ? 'હું આપની કઈ રીતે સહાય કરી શકું? આપ કઈ સરકારી યોજના માટે ફોર્મ ભરવા ઇચ્છો છો?'
                    : 'How can I help you? Which government scheme would you like to apply for?';
            await speak(`${greeting} ${helpMsg}`);
            return;
        }

        const greeting = getDynamicGreeting(lang);
        await speak(greeting, () => {
            askNextQuestion(0, lang);
        });
    };

    // ── Process User Response ────────────────────────────────────────────────
    const processResponse = async (transcript) => {
        if (!transcript) return;

        // ── FIX #1: Use stateRef instead of stale `state` closure ────────────
        const currentState = stateRef.current;
        setStateAndRef(AI_STATE.PROCESSING);
        addHistory('user', transcript);

        // ── TRIAGE MODE ───────────────────────────────────────────────────────
        if (currentState === AI_STATE.TRIAGE || currentState === AI_STATE.IDLE) {
            try {
                const response = await fetch('https://jan-sahayak-api.onrender.com/api/recommend-scheme', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript, language: languageRef.current })
                });
                const data = await response.json();
                if (data.success) {
                    // FIX #7: await speak in TRIAGE
                    await speak(data.message, () => {
                        if (onSchemeChange) onSchemeChange(data.scheme_id);
                    });
                } else {
                    await speak(data.message || PHRASES.retry[languageRef.current.split('-')[0]] || PHRASES.retry.hi);
                }
            } catch (e) {
                console.error('TRIAGE fetch failed:', e);
                await speak(PHRASES.retry[languageRef.current.split('-')[0]] || PHRASES.retry.hi);
            }
            return;
        }

        // ── FORM FILLING MODE — step-by-step ──────────────────────────────────
        const fields = getFieldOrder();
        // FIX #2: Read currentStepRef not stale `currentStep`
        const step = currentStepRef.current;
        const fieldKey = fields[step];
        const langCode = languageRef.current.split('-')[0];

        const value = extractValue(transcript, fieldKey);

        if (value && value.length >= 1) {
            const newData = { ...collectedDataRef.current, [fieldKey]: value };
            collectedDataRef.current = newData;
            setCollectedData(newData);
            if (onFieldUpdate) onFieldUpdate(fieldKey, value);

            const ackFn = PHRASES.gotIt[langCode] || PHRASES.gotIt.hi;
            const ack = typeof ackFn === 'function' ? ackFn(value) : ackFn;

            const nextStep = step + 1;

            if (nextStep < fields.length) {
                setStepAndRef(nextStep);
                await speak(ack, () => {
                    askNextQuestion(nextStep, languageRef.current);
                });
            } else {
                // All fields done!
                setStateAndRef(AI_STATE.COMPLETED);
                const doneMsg = PHRASES.done[langCode] || PHRASES.done.hi;
                await speak(doneMsg);

                // Auto-save to Supabase (non-blocking)
                fetch('https://jan-sahayak-api.onrender.com/api/save-form', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scheme: schemeRef.current?.id || 'unknown',
                        mobile: newData.mobile || '',
                        aadhar: newData.aadhar || '',
                        fields: newData,
                        status: 'completed'
                    })
                }).then(() => console.log('✅ Saved')).catch(e => console.warn('Save failed:', e));

                if (onDownload) setTimeout(onDownload, 2000);
            }
        } else {
            const retryMsg = PHRASES.retry[langCode] || PHRASES.retry.hi;
            await speak(retryMsg, () => {
                askNextQuestion(step, languageRef.current);
            });
        }
    };

    const extractValue = (text, fieldType) => {
        if (!text) return null;
        if (fieldType === 'mobile') {
            const match = text.match(/\d{10}/);
            return match ? match[0] : text.replace(/\D/g, '').slice(0, 10) || null;
        }
        if (fieldType === 'aadhar') {
            const match = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
            return match ? match[0] : text.replace(/\D/g, '').slice(0, 12) || null;
        }
        // General text: clean filler words
        let cleaned = text
            .replace(/(my name is|mera naam|naam|hai|is|hain|ji)/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (/^(tell|call|what|how|why|can|ok|yes|no|stop|help|hello|hi)$/i.test(cleaned) || cleaned.length < 2) {
            return null;
        }
        return cleaned;
    };

    // Current field label for UI
    const currentField = schemeRef.current?.fields[currentStepRef.current];

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
