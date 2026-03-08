import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_STATE } from '../hooks/useVoiceAssistant';
import './AssistantWidget.css';

export default function AssistantWidget({ aiState, onToggle }) {
    // Determine the color theme based on the state
    const theme = {
        [AI_STATE.IDLE]: { bg: 'bg-primary/20', icon: 'text-primary', shadow: 'rgba(0,255,136,0.3)' },
        [AI_STATE.LISTENING]: { bg: 'bg-red-500/20', icon: 'text-red-500', shadow: 'rgba(239,68,68,0.5)' },
        [AI_STATE.PROCESSING]: { bg: 'bg-purple-500/20', icon: 'text-purple-400', shadow: 'rgba(168,85,247,0.5)' },
        [AI_STATE.SPEAKING]: { bg: 'bg-green-400/20', icon: 'text-green-400', shadow: 'rgba(74,222,128,0.5)' },
        [AI_STATE.TRIAGE]: { bg: 'bg-yellow-400/20', icon: 'text-yellow-400', shadow: 'rgba(250,204,21,0.5)' },
        [AI_STATE.COMPLETED]: { bg: 'bg-blue-400/20', icon: 'text-blue-400', shadow: 'rgba(96,165,250,0.5)' },
    }[aiState] || { bg: 'bg-primary/20', icon: 'text-primary', shadow: 'rgba(0,255,136,0.3)' };

    return (
        <div className="assistant-widget-container">
            {/* Main Orb Button */}
            <motion.button
                className={`w-16 h-16 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md relative overflow-hidden transition-colors duration-500 ${theme.bg}`}
                onClick={onToggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: [
                        `0 0 15px ${theme.shadow}`,
                        `0 0 30px ${theme.shadow}`,
                        `0 0 15px ${theme.shadow}`
                    ],
                    y: aiState === AI_STATE.IDLE ? [0, -5, 0] : 0
                }}
                transition={{
                    duration: aiState === AI_STATE.IDLE ? 3 : 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* ── Internal Visuals ── */}
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                    {/* IDLE / COMPLETED / TRIAGE */}
                    {(aiState === AI_STATE.IDLE || aiState === AI_STATE.COMPLETED || aiState === AI_STATE.TRIAGE) && (
                        <svg className={`w-6 h-6 ${theme.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}

                    {/* LISTENING: Siri-style waveform */}
                    {aiState === AI_STATE.LISTENING && (
                        <div className="flex items-center gap-[3px] h-6">
                            {[3, 5, 8, 5, 3].map((h, i) => (
                                <motion.div
                                    key={i}
                                    className={`w-[3px] rounded-full bg-red-400`}
                                    animate={{ height: [`${h}px`, `${h * 2.5}px`, `${h}px`], opacity: 1 }}
                                    transition={{ duration: 0.4 + i * 0.05, delay: i * 0.04, repeat: Infinity }}
                                />
                            ))}
                        </div>
                    )}

                    {/* SPEAKING: Solid pulse + expanding rings */}
                    {aiState === AI_STATE.SPEAKING && (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <motion.div
                                className="w-4 h-4 rounded-full bg-green-400"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-green-400/50"
                                animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-green-400/30"
                                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                                transition={{ duration: 1.5, delay: 0.4, repeat: Infinity }}
                            />
                        </div>
                    )}

                    {/* PROCESSING: Gemini-style thinking dots */}
                    {aiState === AI_STATE.PROCESSING && (
                        <div className="flex items-center gap-1">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-purple-400"
                                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.button>

            {/* Status Tooltip */}
            <AnimatePresence>
                {aiState !== AI_STATE.IDLE && (
                    <motion.div
                        className="orb-status absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-surface/90 border border-white/10 text-xs font-semibold text-white/90 shadow-xl backdrop-blur-md"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    >
                        {aiState === AI_STATE.LISTENING && "Listening..."}
                        {aiState === AI_STATE.SPEAKING && "Speaking..."}
                        {aiState === AI_STATE.PROCESSING && "Thinking..."}
                        {aiState === AI_STATE.COMPLETED && "Done!"}
                        {aiState === AI_STATE.TRIAGE && "Which Scheme?"}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
