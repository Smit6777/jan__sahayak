import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Scene3D from '../components/Scene3D';
import VoiceInput from '../components/VoiceInput';
import AadharUpload from '../components/AadharUpload';
import AssistantWidget from '../components/AssistantWidget';
import { useVoiceAssistant, AI_STATE } from '../hooks/useVoiceAssistant';
import './FormFiller.css';

const schemes = {
    'pm-kisan': {
        name: 'PM Kisan Samman Nidhi',
        icon: '🌾',
        fields: ['name', 'fatherName', 'aadhar', 'mobile', 'bankAccount', 'ifsc', 'address', 'landArea']
    },
    'vidhva-sahay': {
        name: 'Vidhva Sahay Yojana',
        icon: '🏠',
        fields: ['name', 'aadhar', 'mobile', 'husbandName', 'deathCertNo', 'bankAccount', 'ifsc', 'address']
    },
    'ration-card': {
        name: 'Ration Card Application',
        icon: '🍚',
        fields: ['name', 'aadhar', 'mobile', 'familyMembers', 'income', 'address', 'cardType']
    },
    'ayushman-bharat': {
        name: 'Ayushman Bharat',
        icon: '🏥',
        fields: ['name', 'aadhar', 'mobile', 'familyMembers', 'income', 'address', 'existingDiseases']
    },
    'pm-awas': {
        name: 'PM Awas Yojana',
        icon: '🏗️',
        fields: ['name', 'fatherName', 'aadhar', 'mobile', 'income', 'currentAddress', 'plotSize', 'category']
    },
    'ujjwala': {
        name: 'Ujjwala Yojana',
        icon: '🔥',
        fields: ['name', 'aadhar', 'mobile', 'address', 'bankAccount', 'ifsc', 'bplNumber']
    },
    'sukanya-samriddhi': {
        name: 'Sukanya Samriddhi',
        icon: '👧',
        fields: ['name', 'fatherName', 'motherName', 'daughterName', 'daughterDOB', 'aadhar', 'mobile', 'address', 'bankAccount']
    },
    'kisan-credit': {
        name: 'Kisan Credit Card',
        icon: '💳',
        fields: ['name', 'fatherName', 'aadhar', 'mobile', 'landArea', 'cropType', 'bankAccount', 'ifsc', 'address']
    }
};

const fieldLabels = {
    name: 'Full Name / पूरा नाम',
    fatherName: "Father's Name / पिता का नाम",
    motherName: "Mother's Name / माता का नाम",
    husbandName: "Husband's Name / पति का नाम",
    aadhar: 'Aadhar Number / आधार नंबर',
    mobile: 'Mobile Number / मोबाइल नंबर',
    bankAccount: 'Bank Account / बैंक खाता',
    ifsc: 'IFSC Code',
    address: 'Address / पता',
    currentAddress: 'Current Address',
    landArea: 'Land Area (Hectares)',
    deathCertNo: 'Death Certificate No.',
    familyMembers: 'Family Members',
    income: 'Annual Income',
    cardType: 'Card Type',
    existingDiseases: 'Diseases',
    plotSize: 'Plot Size',
    category: 'Category',
    bplNumber: 'BPL Number',
    daughterName: "Daughter's Name",
    daughterDOB: "Daughter's DOB",
    cropType: 'Crop Type'
};

export default function FormFiller() {
    const [searchParams, setSearchParams] = useSearchParams();
    const schemeId = searchParams.get('scheme'); // Can be null now
    const scheme = schemeId ? (schemes[schemeId] || schemes['pm-kisan']) : null;

    // Fallback object for UI when no scheme is selected
    const displayScheme = scheme || {
        name: 'AI Assistant',
        icon: '🤖',
        fields: []
    };

    const [inputMode, setInputMode] = useState(searchParams.get('mode') || 'manual');
    const [formData, setFormData] = useState({});
    const [chatInput, setChatInput] = useState("");

    // Voice Assistant Hook
    const {
        state: aiState,
        currentField,
        conversationHistory,
        startConversation,
        processResponse
    } = useVoiceAssistant(
        scheme,
        (field, value) => {
            setFormData(prev => ({ ...prev, [field]: value }));
        },
        // Action: SWITCH_SCHEME
        (newSchemeId) => {
            setSearchParams({ scheme: newSchemeId, mode: 'voice' });
        },
        // Action: DOWNLOAD_PDF
        async () => {
            try {
                // Submit form data to backend to generate PDF
                const response = await fetch('http://localhost:8000/api/fill-form', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scheme: schemeId, fields: formData })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${schemeId}_filled.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    console.error("PDF Download failed");
                }
            } catch (e) {
                console.error("PDF Error:", e);
            }
        }
    );

    // Auto-scroll chat
    const chatEndRef = useRef(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationHistory]);

    const handleVoiceTranscript = (transcript) => {
        processResponse(transcript);
    };

    // Manual Submit Handler
    const handleManualSubmit = async () => {
        try {
            // Validate at least one field is filled?
            // For now, loose validation
            const response = await fetch('http://localhost:8000/api/fill-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheme: schemeId, fields: formData })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${schemeId}_filled.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                alert("✅ Form Submitted! PDF Downloaded.");
            } else {
                alert("❌ Submission Failed. Backend error.");
            }
        } catch (e) {
            console.error("Manual Submit Error:", e);
            alert("❌ Network Error. Is backend running?");
        }
    };

    return (
        <div className="form-filler-page">
            <Scene3D variant="form" />

            <div className="page-content conversation-layout">
                {/* Header */}
                <header className="form-header">
                    <Link to="/" className="back-btn">← Back</Link>
                    <div className="scheme-info">
                        <span className="scheme-icon-large">{displayScheme.icon}</span>
                        <h1>{displayScheme.name}</h1>
                    </div>
                </header>

                <div className="form-container">
                    {/* Mode Selector */}
                    <div className="input-mode-selector">
                        <button className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`} onClick={() => setInputMode('manual')}>⌨️ Manual</button>
                        <button className={`mode-btn ${inputMode === 'voice' ? 'active' : ''}`} onClick={() => setInputMode('voice')}>🤖 AI Assistant (Voice & Chat)</button>
                    </div>

                    {/* --- AI MODE UI --- */}
                    {/* --- VOICE MODE UI (Floating Widget) --- */}
                    {inputMode === 'voice' && (
                        <>
                            {/* Visual Hint for first-time users */}
                            {aiState === 'idle' && (
                                <div className="voice-hint-container">
                                    <motion.div
                                        className="voice-hint-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <h3>👈 Tap the Orb to Start</h3>
                                        <p>I am your new AI Assistant.</p>
                                    </motion.div>
                                </div>
                            )}

                            {/* The Floating Widget */}
                            <AssistantWidget
                                aiState={aiState}
                                onToggle={() => {
                                    if (aiState === 'idle') startConversation('hi-IN');
                                    else window.speechSynthesis.cancel(); // Stop if clicked during speech
                                }}
                            />

                            {/* Conversation Chat Log - Now lighter and centered */}
                            <div className="chat-window-floating">
                                <div className="chat-messages">
                                    {conversationHistory.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            className={`chat-bubble ${msg.sender}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            <div className="bubble-content">{msg.text}</div>
                                        </motion.div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input Bar */}
                                <div className="chat-input-bar">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Type a message or say something..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                processResponse(e.target.value.trim());
                                                setChatInput('');
                                            }
                                        }}
                                    />
                                    <button className="send-btn" onClick={() => {
                                        if (chatInput.trim()) {
                                            processResponse(chatInput.trim());
                                            setChatInput('');
                                        }
                                    }}>
                                        ➤
                                    </button>
                                </div>

                                {/* Invisible Voice Input (Logic only) */}
                                <div style={{ opacity: 0, height: 0, overflow: 'hidden' }}>
                                    <VoiceInput
                                        onTranscript={handleVoiceTranscript}
                                        autoStart={aiState === 'listening'}
                                    />
                                </div>
                            </div>
                        </>
                    )}


                    {/* --- MANUAL MODE UI (Classic Form) --- */}
                    {inputMode === 'manual' && (
                        <div className="manual-form">
                            {/* If in Triage mode (no scheme), show message */}
                            {!scheme && (
                                <div className="triage-message">
                                    <h3>👋 Welcome to Jan-Sahayak</h3>
                                    <p>Please use the Voice Assistant to find the right scheme for you, or select one from the home page.</p>
                                    <button className="btn btn-primary" onClick={() => setInputMode('voice')}>Start Voice Assistant</button>
                                </div>
                            )}

                            {scheme && (
                                <div className="fields-grid">
                                    {scheme.fields.map((field) => (
                                        <div key={field} className="input-group">
                                            <label>{fieldLabels[field]}</label>
                                            <input
                                                className="input-field"
                                                value={formData[field] || ''}
                                                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                                                placeholder="..."
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {scheme && (
                                <button
                                    className="submit-btn"
                                    onClick={handleManualSubmit}
                                >
                                    Submit Form
                                </button>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
}
