"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSpeech } from '@/services/speechService';

interface AudioReportProps {
    title?: string;
    text: string;
    onStart?: () => void;
    onEnd?: () => void;
    autoPlay?: boolean;
}

// Simple session-level cache to prevent re-fetching the same text
const speechCache: Record<string, string> = {};

export const AudioReport: React.FC<AudioReportProps> = ({ title = "AI Summary", text, onStart, onEnd, autoPlay = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Initial setup and cleanup
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handlePlay = async () => {
        if (!text) return;
        setIsLoading(true);

        try {
            // 1. Try High-Quality Cloud TTS
            let audioSource = speechCache[text];

            if (!audioSource) {
                const cloudAudio = await getSpeech(text);
                if (cloudAudio) {
                    audioSource = cloudAudio;
                    speechCache[text] = cloudAudio;
                }
            }

            if (audioSource) {
                if (!audioRef.current) {
                    audioRef.current = new Audio();
                    audioRef.current.onplay = () => {
                        setIsPlaying(true);
                        onStart?.();
                    };
                    audioRef.current.onended = () => {
                        setIsPlaying(false);
                        onEnd?.();
                    };
                    audioRef.current.onerror = () => {
                        setIsPlaying(false);
                        // Fallback logic could be repeated here if cloud fails mid-stream
                    };
                }
                audioRef.current.src = audioSource;
                audioRef.current.play();
                setIsLoading(false);
                return;
            }

            // 2. Fallback to Browser TTS
            console.log("[AURA Audio] Falling back to browser TTS...");
            const synth = window.speechSynthesis;
            const u = new SpeechSynthesisUtterance(text);

            u.onstart = () => {
                setIsPlaying(true);
                onStart?.();
            };
            u.onend = () => {
                setIsPlaying(false);
                onEnd?.();
            };
            u.onerror = () => setIsPlaying(false);

            synthesisRef.current = u;
            synth.speak(u);

        } catch (error) {
            console.error("[AudioReport] Playback error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-fade-in group hover:bg-white/10 transition-all">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-aura-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)] animate-pulse' : 'bg-white/10'}`}>
                {isPlaying ? <span className="animate-bounce text-xl">🔊</span> : <span className="text-xl">🔈</span>}
            </div>
            <div className="flex-1">
                <h4 className="text-white font-bold text-sm tracking-tight">{title}</h4>
                <p className="text-[10px] text-gray-500 line-clamp-1 italic">"{text}"</p>
            </div>
            <div className="flex gap-2">
                {!isPlaying ? (
                    <button
                        onClick={handlePlay}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-xl bg-aura-cyan text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-[0_4px_15px_rgba(0,240,255,0.3)] ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isLoading ? 'Loading...' : 'Listen'}
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
