import { useState, useRef, useCallback } from 'react';
import { conversationConfig, SCHEME_FIELD_ORDER, FIELD_QUESTIONS, PHRASES } from '../config/conversationQuestions';
import API_BASE from '../config/api';

// States
export const AI_STATE = {
    IDLE: 'idle',
    SPEAKING: 'speaking',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    CONFIRMING: 'confirming', // New state for validation
    COMPLETED: 'completed',
    TRIAGE: 'triage'
};

export function useVoiceAssistant(scheme, onFieldUpdate, onSchemeChange, onDownload) {
    const [state, setState] = useState(AI_STATE.IDLE);
    const [currentStep, setCurrentStep] = useState(0);
    const [language, setLanguage] = useState('hi-IN');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [currentSpeech, setCurrentSpeech] = useState(''); // Text currently being spoken (for subtitles)

    // ── Refs so async callbacks always read latest values (fixes stale closure bugs) ──
    const stateRef = useRef(AI_STATE.IDLE);
    const currentStepRef = useRef(0);
    const languageRef = useRef('hi-IN');
    const collectedDataRef = useRef({});
    const schemeRef = useRef(scheme);
    schemeRef.current = scheme;

    const setStateAndRef = (s) => { stateRef.current = s; setState(s); };
    const setStepAndRef = (n) => { currentStepRef.current = n; setCurrentStep(n); };

    // ── Greeting ─────────────────────────────────────────────────────────────
    const getDynamicGreeting = (lang) => {
        const h = new Date().getHours();
        const greetings = {
            'hi-IN': h < 12 ? 'सुप्रभात!' : h < 17 ? 'नमस्ते!' : 'शुभ सन्ध्या!',
            'gu-IN': h < 12 ? 'સુપ્રભાત!' : h < 17 ? 'નમસ્તે!' : 'શુભ સાંજ!',
            'en-IN': h < 12 ? 'Good Morning!' : h < 17 ? 'Good Afternoon!' : 'Good Evening!'
        };
        const time = greetings[lang] || 'नमस्ते!';
        const base = conversationConfig.greetings[lang] || conversationConfig.greetings['hi-IN'];
        return `${time} ${base}`;
    };

    // ── SPEAK  ────────────────────────────────────────────────────────────────
    // Uses browser Web Speech API — instant, no backend needed, no autoplay issues.
    // Optionally tries backend TTS first for better quality if user has interacted.
    const speak = useCallback((text, onEnd) => {
        if (!text) { if (onEnd) onEnd(); return; }

        console.log(`🔊 Speaking: "${text.slice(0, 60)}..."`);
        setStateAndRef(AI_STATE.SPEAKING);
        setCurrentSpeech(text); // Track for subtitles
        addHistory('ai', text);

        // Cancel any previous speech
        window.speechSynthesis?.cancel();
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        const lang = languageRef.current;

        // Helper: browser fallback TTS (always works)
        const browserSpeak = () => {
            if (!window.speechSynthesis) {
                setStateAndRef(AI_STATE.LISTENING);
                if (onEnd) onEnd();
                return;
            }
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = lang;
            utter.rate = 0.88;
            utter.pitch = 1.1;
            utter.volume = 1;

            // Force resume in case browser TTS became stuck/suspended
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }

            // Retry fetching voices in case they loaded late
            let voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                console.warn("Voices still empty... trying to fetch again.");
                // Some browsers need a slight delay
            }

            // Pick best available female voice for the language
            const langCode = lang.split('-')[0];

            // Heuristic to find a female Indian voice (Google Hindi is female by default, 
            // others might have 'female', 'woman', or 'girl' in the name)
            const isFemale = (v) => {
                const n = v.name.toLowerCase();
                return n.includes('female') || n.includes('woman') || n.includes('girl') || n.includes('zira') || n.includes('google हिन्दी');
            };

            const best =
                voices.find(v => v.lang === lang && isFemale(v)) ||
                voices.find(v => v.lang.startsWith(langCode) && isFemale(v)) ||
                voices.find(v => v.lang === lang) ||
                voices.find(v => v.lang.startsWith(langCode)) ||
                voices[0]; // fallback to whatever is first

            if (best) {
                utter.voice = best;
                console.log(`🎤 TTS PLAYING: Voice=${best.name}, Lang=${best.lang}, Volume=${utter.volume}`);
            } else {
                console.warn(`🎤 TTS WARNING: No voices found! (voices.length=${voices.length})`);
                // Continue anyway; the browser might use its default system voice implicitly
            }

            let finished = false;
            const finishSpeech = () => {
                if (finished) return;
                finished = true;
                setCurrentSpeech('');
                setStateAndRef(AI_STATE.LISTENING);
                if (onEnd) onEnd();
            };

            utter.onend = finishSpeech;
            utter.onerror = (e) => {
                console.warn("TTS Error:", e);
                finishSpeech();
            };

            // Failsafe timer (3 to 10 seconds based on text length)
            setTimeout(() => finishSpeech(), Math.max(3000, text.length * 100));

            window.speechSynthesis.speak(utter);
        };

        // Initialize voices early to prevent Chrome empty array bug
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }
        window.speechSynthesis.getVoices();

        const playBackendAudio = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/speak`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, language: lang })
                });

                if (!response.ok) throw new Error('Backend TTS failed');

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new window.Audio(url);

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    setCurrentSpeech('');
                    setStateAndRef(AI_STATE.LISTENING);
                    if (onEnd) onEnd();
                };

                audio.onerror = () => {
                    console.warn("Backend mp3 playback failed, falling back to browser TTS");
                    browserSpeak();
                };

                window.currentAudio = audio;
                await audio.play();
            } catch (err) {
                console.error("Failed to fetch backend audio:", err);
                browserSpeak(); // Fallback to browser
            }
        };

        // Enforce backend-first TTS for ultimate reliability
        playBackendAudio();
    }, []);

    const addHistory = (sender, text) => {
        setConversationHistory(prev => [...prev, { sender, text, timestamp: Date.now() }]);
    };

    // ── Field helpers ─────────────────────────────────────────────────────────
    const getFieldOrder = useCallback(() => {
        const s = schemeRef.current;
        if (!s) return [];
        return SCHEME_FIELD_ORDER[s.id] || s.fields || [];
    }, []);

    const getQuestion = (fieldKey) => {
        const langCode = languageRef.current.split('-')[0];
        return FIELD_QUESTIONS[fieldKey]?.[langCode]
            || FIELD_QUESTIONS[fieldKey]?.hi
            || `Please tell me your ${fieldKey}`;
    };

    const askNextQuestion = (stepIndex) => {
        const fields = getFieldOrder();
        if (stepIndex >= fields.length) return;
        speak(getQuestion(fields[stepIndex]));
    };

    // ── Start Conversation ────────────────────────────────────────────────────
    const startConversation = (lang = 'hi-IN') => {
        languageRef.current = lang;
        setLanguage(lang);
        setConversationHistory([]);
        setStepAndRef(0);
        collectedDataRef.current = {};

        if (!schemeRef.current) {
            setStateAndRef(AI_STATE.TRIAGE);
            const helpMsg = {
                'hi-IN': PHRASES.greeting.hi(''),
                'gu-IN': PHRASES.greeting.gu(''),
                'en-IN': PHRASES.greeting.en('')
            }[lang] || PHRASES.greeting.hi('');
            speak(`${helpMsg}`);
            return;
        }

        const greeting = getDynamicGreeting(lang);
        const schemeGreeting = PHRASES.greeting[lang.split('-')[0]]?.(schemeRef.current?.name) || greeting;
        speak(schemeGreeting, () => askNextQuestion(0));
    };

    // ── Process User Response ─────────────────────────────────────────────────
    const processResponse = async (transcript) => {
        if (!transcript) return;

        const currentState = stateRef.current;  // FIX: read ref not stale state
        setStateAndRef(AI_STATE.PROCESSING);
        addHistory('user', transcript);

        // Artificial "Thinking" delay for UX
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

        // TRIAGE MODE — recommend a scheme
        if (currentState === AI_STATE.TRIAGE || !schemeRef.current) {
            try {
                const response = await fetch(`${API_BASE}/api/recommend-scheme`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript, language: languageRef.current })
                });
                const data = await response.json();
                if (data.success) {
                    speak(data.message, () => { if (onSchemeChange) onSchemeChange(data.scheme_id); });
                } else {
                    const langCode = languageRef.current.split('-')[0];
                    speak(PHRASES.retry[langCode] || PHRASES.retry.hi);
                }
            } catch {
                const langCode = languageRef.current.split('-')[0];
                speak(PHRASES.retry[langCode] || PHRASES.retry.hi);
            }
            return;
        }

        // FORM FILLING — Smart Agent Mode
        const fields = getFieldOrder();
        const step = currentStepRef.current;
        const fieldKey = fields[step];
        const langCode = languageRef.current.split('-')[0];

        try {
            // Bypass API for quick Yes/No confirmation state
            if (currentState === AI_STATE.CONFIRMING) {
                const cleanedTranscript = transcript.toLowerCase().trim();
                const isYes = /^(yes|haan|ha|ji|ok|okay|theek|barabar|ha chalse|saru)$/i.test(cleanedTranscript);
                
                if (isYes) {
                    setStateAndRef(AI_STATE.COMPLETED);
                    const doneMsg = PHRASES.done[langCode] || PHRASES.done.hi;
                    speak(doneMsg);

                    fetch(`${API_BASE}/api/save-form`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            scheme: schemeRef.current?.id || 'unknown',
                            mobile: collectedDataRef.current.mobile || '',
                            aadhar: collectedDataRef.current.aadhar || '',
                            fields: collectedDataRef.current,
                            status: 'completed'
                        })
                    }).catch(() => {});
                    if (onDownload) setTimeout(onDownload, 2000);
                } else {
                    setStateAndRef(AI_STATE.COMPLETED);
                    const noConfirmMsg = PHRASES.confirmNo[langCode] || PHRASES.confirmNo.hi;
                    speak(noConfirmMsg);
                }
                return;
            }

            // Call intelligent backend agent
            const response = await fetch(`${API_BASE}/api/extract-from-voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, scheme: schemeRef.current?.id, language: languageRef.current })
            });
            const extData = await response.json();

            let newExtractedData = false;
            let lastExtractedValue = "";

            if (extData.success && extData.fields) {
                const updatedData = { ...collectedDataRef.current };
                Object.entries(extData.fields).forEach(([k, v]) => {
                    // Accept missing form fields
                    if (fields.includes(k) && v) {
                        updatedData[k] = v;
                        if (onFieldUpdate) onFieldUpdate(k, v);
                        newExtractedData = true;
                        lastExtractedValue = v;
                    }
                });
                collectedDataRef.current = updatedData;
            } else {
                // Fallback to local regex if LLM misses it
                const localValue = extractValue(transcript, fieldKey);
                if (localValue && localValue.length >= 1) {
                    collectedDataRef.current = { ...collectedDataRef.current, [fieldKey]: localValue };
                    if (onFieldUpdate) onFieldUpdate(fieldKey, localValue);
                    newExtractedData = true;
                    lastExtractedValue = localValue;
                }
            }

            if (newExtractedData) {
                // Determine NEXT missing field dynamically
                let nextMissingIndex = -1;
                for (let i = 0; i < fields.length; i++) {
                    if (!collectedDataRef.current[fields[i]]) {
                        nextMissingIndex = i;
                        break;
                    }
                }
                
                if (nextMissingIndex !== -1) {
                    setStepAndRef(nextMissingIndex);
                    const ackFn = PHRASES.gotIt[langCode] || PHRASES.gotIt.hi;
                    const ack = typeof ackFn === 'function' ? ackFn(lastExtractedValue) : ackFn;
                    speak(ack + " " + getQuestion(fields[nextMissingIndex]));
                } else {
                    setStateAndRef(AI_STATE.CONFIRMING);
                    const confirmMsg = PHRASES.confirmationPrompt[langCode] || PHRASES.confirmationPrompt.hi;
                    speak(confirmMsg);
                }
            } else {
                const retryMsg = extData.message || PHRASES.retry[langCode] || PHRASES.retry.hi;
                speak(retryMsg, () => askNextQuestion(step));
            }
        } catch (e) {
            console.error("Extraction API Error", e);
            const retryMsg = PHRASES.retry[langCode] || PHRASES.retry.hi;
            speak(retryMsg, () => askNextQuestion(step));
        }
    };

    const extractValue = (text, fieldType) => {
        if (!text) return null;
        if (fieldType === 'mobile') {
            return text.match(/\d{10}/)?.[0] || (text.replace(/\D/g, '').length === 10 ? text.replace(/\D/g, '') : null);
        }
        if (fieldType === 'aadhar') {
            return text.match(/\d{4}\s?\d{4}\s?\d{4}/)?.[0] || null;
        }
        const cleaned = text
            .replace(/(my name is|mera naam|naam|hai|is|hain|ji)\b/gi, '')
            .replace(/\s+/g, ' ').trim();
        
        // Let confirmation words bypass simple extraction filters
        if (stateRef.current === AI_STATE.CONFIRMING) {
            return cleaned; 
        }

        if (/^(tell|call|what|how|why|can|help|hello|hi)$/i.test(cleaned) || cleaned.length < 2) return null;
        return cleaned;
    };

    return {
        state,
        currentStep,
        conversationHistory,
        startConversation,
        processResponse,
        language,
        currentSpeech  // For SubtitleBar display
    };
}
