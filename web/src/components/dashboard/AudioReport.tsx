"use client";
import React, { useState, useEffect } from 'react';

interface AudioReportProps {
    title?: string;
    text: string;
    onStart?: () => void;
    onEnd?: () => void;
    autoPlay?: boolean;
}

export const AudioReport: React.FC<AudioReportProps> = ({ title = "AI Summary", text, onStart, onEnd, autoPlay = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (!text) return;
        const synth = window.speechSynthesis;
        const u = new SpeechSynthesisUtterance(text);

        // Try to find a good voice (standardizing on a clear one if possible)
        // voices are loaded asynchronously
        const setVoice = () => {
            const voices = synth.getVoices();
            // AURA uses Uz, En, Ru. For Uz we often fallback to default or Turkish/Russian for similar phonetics if Uz is missing.
            // For now, let's keep it simple.
        };

        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = setVoice;
        }
        setVoice();

        u.onstart = () => {
            setIsPlaying(true);
            onStart?.();
        };
        u.onend = () => {
            setIsPlaying(false);
            onEnd?.();
        };
        u.onerror = () => setIsPlaying(false);

        setUtterance(u);

        if (autoPlay) {
            synth.speak(u);
        }

        return () => {
            synth.cancel();
        };
    }, [text, autoPlay, onStart, onEnd]);

    const handlePlay = () => {
        if (utterance) {
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-fade-in group hover:bg-white/10 transition-all">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-aura-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)] animate-pulse' : 'bg-white/10'}`}>
                {isPlaying ? <span className="animate-bounce">🔊</span> : '🔈'}
            </div>
            <div className="flex-1">
                <h4 className="text-white font-bold text-sm tracking-tight">{title}</h4>
                <p className="text-[10px] text-gray-500 line-clamp-1 italic">"{text}"</p>
            </div>
            <div className="flex gap-2">
                {!isPlaying ? (
                    <button
                        onClick={handlePlay}
                        className="px-4 py-2 rounded-xl bg-aura-cyan text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-[0_4px_15px_rgba(0,240,255,0.3)]"
                    >
                        Listen
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        className="px-4 py-2 rounded-xl bg-aura-red text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform active:scale-95"
                    >
                        Stop
                    </button>
                )}
            </div>
        </div>
    );
};
