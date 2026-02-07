import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Supported Indian Languages
const LANGUAGES = [
    { code: 'hi-IN', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
    { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
    { code: 'mr-IN', name: 'मराठी (Marathi)', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'te-IN', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'bn-IN', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
    { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
    { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
    { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
];

export default function VoiceInput({ onTranscript, disabled, autoStart }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [selectedLang, setSelectedLang] = useState('hi-IN'); // Default Hindi
    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Auto-start listening if prop is true
    useEffect(() => {
        if (autoStart && !isListening) {
            toggleListening();
        }
    }, [autoStart]);

    const transcriptRef = useRef(''); // Ref to access latest transcript in callbacks

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Stop after one sentence for turn-taking
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = selectedLang;

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                transcriptRef.current = '';
                setTranscript('');
            };

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += t;
                    } else {
                        interimTranscript += t;
                    }
                }

                const full = finalTranscript || interimTranscript;
                setTranscript(full);
                transcriptRef.current = full;
            };

            recognitionRef.current.onerror = (event) => {
                console.warn("Voice Error:", event.error);
                if (event.error === 'no-speech') {
                    // Critical Fix: If no speech detected, don't just die. Restart listening visually.
                    // But we won't toggle isListening off, effectively "retrying"
                    return;
                }
                setError(`Voice error: ${event.error}`);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                // Auto-submit if we have text
                const text = transcriptRef.current.trim();

                if (text && onTranscript) {
                    setIsListening(false);
                    console.log("🎤 Speech ended, sending:", text);
                    onTranscript(text, selectedLang);
                } else if (isListening) {
                    // If we are still "technically" listening but it stopped (e.g. no-speech), restart it!
                    console.log("🔄 No speech detected, restarting listener...");
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        setIsListening(false); // Safety break
                    }
                } else {
                    setIsListening(false);
                }
            };
        } else {
            setError('Voice recognition not supported in this browser');
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [selectedLang, onTranscript]);

    const startAudioVisualization = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            const updateLevel = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average / 255);
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
        } catch (err) {
            console.error('Audio visualization error:', err);
        }
    };

    const toggleListening = async () => {
        if (isListening) {
            recognitionRef.current?.stop();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            setAudioLevel(0);

            // Send transcript when stopping
            if (transcript && onTranscript) {
                onTranscript(transcript, selectedLang);
            }
        } else {
            setTranscript('');
            setError(null);
            recognitionRef.current?.start();
            await startAudioVisualization();
        }
        setIsListening(!isListening);
    };

    // Get current language name
    const currentLangName = LANGUAGES.find(l => l.code === selectedLang)?.name || 'Hindi';

    // Generate wave bars for visualization
    const waveBars = Array.from({ length: 20 }, (_, i) => {
        const delay = i * 0.05;
        const baseHeight = 20 + Math.sin(i * 0.5) * 10;
        return { delay, baseHeight };
    });

    return (
        <div className="voice-input-container">
            {/* Language Selector */}
            <div className="language-selector">
                <label>🌐 Select Language / भाषा चुनें:</label>
                <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    disabled={isListening}
                    className="lang-select"
                >
                    {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                        </option>
                    ))}
                </select>
            </div>

            <motion.button
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                disabled={disabled || error === 'Voice recognition not supported in this browser'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    boxShadow: isListening
                        ? `0 0 ${30 + audioLevel * 50}px rgba(236, 72, 153, ${0.5 + audioLevel * 0.3})`
                        : undefined
                }}
            >
                <span className="voice-icon">{isListening ? '🎙️' : '🎤'}</span>
                <span className="voice-label">
                    {isListening
                        ? `Listening in ${currentLangName}... Tap to stop`
                        : `Tap to speak in ${currentLangName}`}
                </span>
            </motion.button>

            {/* Audio Visualization */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        className="audio-visualizer"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                    >
                        {waveBars.map((bar, i) => (
                            <motion.div
                                key={i}
                                className="wave-bar"
                                animate={{
                                    height: bar.baseHeight + audioLevel * 60,
                                    backgroundColor: `hsl(${320 + i * 3}, 80%, ${50 + audioLevel * 20}%)`
                                }}
                                transition={{ duration: 0.1 }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transcript Display */}
            <AnimatePresence>
                {transcript && (
                    <motion.div
                        className="transcript-box"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="transcript-header">
                            <span>🗣️ You said ({currentLangName}):</span>
                            <span className="female-voice-badge">👩 Female AI Voice</span>
                        </div>
                        <p className="transcript-text">{transcript}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Display */}
            {error && (
                <div className="voice-error">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Debug / Test Audio Button */}
            <button
                onClick={async () => {
                    try {
                        console.log("Testing Audio...");
                        const response = await fetch('http://localhost:8000/api/speak', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: "Hello, testing audio one two three.", language: "en-IN" })
                        });
                        const blob = await response.blob();
                        const audio = new Audio(URL.createObjectURL(blob));
                        await audio.play();
                        console.log("Audio test playing...");
                    } catch (e) {
                        console.error("Test failed:", e);
                        alert("Audio Test Failed: " + e.message);
                    }
                }}
                style={{ marginTop: 10, fontSize: 10, opacity: 0.7 }}
            >
                🔊 Test Sound
            </button>

            <div className="voice-instructions">
                <p>💡 Examples:</p>
                <p>हिंदी: "मेरा नाम राजेश कुमार है, आधार नंबर 1234 5678 9012"</p>
                <p>ગુજરાતી: "મારું નામ રાજેશ કુમાર છે, આધાર નંબર 1234 5678 9012"</p>
            </div>
        </div>
    );
}
