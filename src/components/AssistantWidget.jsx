import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_STATE } from '../hooks/useVoiceAssistant';
import './AssistantWidget.css';

export default function AssistantWidget({ aiState, onToggle }) {
    // Visualizer Bars
    const bars = [1, 2, 3, 4, 5];

    return (
        <div className="assistant-widget-container">
            {/* Main Orb Button */}
            <motion.button
                className={`assistant-orb ${aiState}`}
                onClick={onToggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={
                    aiState === AI_STATE.LISTENING ? {
                        boxShadow: [
                            "0 0 20px rgba(0, 243, 255, 0.4)",
                            "0 0 40px rgba(0, 243, 255, 0.6)",
                            "0 0 20px rgba(0, 243, 255, 0.4)"
                        ]
                    } : aiState === AI_STATE.SPEAKING ? {
                        boxShadow: [
                            "0 0 20px rgba(255, 0, 100, 0.4)",
                            "0 0 50px rgba(255, 0, 100, 0.6)",
                            "0 0 20px rgba(255, 0, 100, 0.4)"
                        ]
                    } : {
                        y: [0, -5, 0] // Idle Float
                    }
                }
                transition={{
                    duration: aiState === AI_STATE.IDLE ? 3 : 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Internal Icon/Visuals */}
                <div className="orb-core">
                    {aiState === AI_STATE.IDLE && <span className="mic-icon">🎙️</span>}

                    {aiState === AI_STATE.LISTENING && (
                        <div className="wave-container">
                            {bars.map((i) => (
                                <motion.div
                                    key={i}
                                    className="wave-bar"
                                    animate={{ height: [10, 25, 10] }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "easeInOut"
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {aiState === AI_STATE.SPEAKING && (
                        <div className="speaking-wave">
                            <div className="pulse-ring"></div>
                        </div>
                    )}
                </div>
            </motion.button>

            {/* Status Label (Tooltip) */}
            <AnimatePresence>
                {aiState !== AI_STATE.IDLE && (
                    <motion.div
                        className="orb-status"
                        initial={{ opacity: 0, y: 10, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 10, x: '-50%' }}
                    >
                        {aiState === AI_STATE.LISTENING ? "Listening..." :
                            aiState === AI_STATE.SPEAKING ? "Speaking..." :
                                "Processing..."}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
