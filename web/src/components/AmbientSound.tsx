"use client";
import React, { useState, useRef } from 'react';

interface AmbientSoundProps {
    variant?: 'compact' | 'full';
}

const SOUNDS = [
    { id: 'rain', label: '🌧️ Yomg\'ir', file: '/sounds/rain.mp3' },
    { id: 'whitenoise', label: '📻 Oq Shovqin', file: '/sounds/whitenoise.mp3' },
    { id: 'fire', label: '🔥 O\'choq', file: '/sounds/fire.mp3' },
];

export default function AmbientSound({ variant = 'compact' }: AmbientSoundProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSound, setCurrentSound] = useState(SOUNDS[0]);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {
                // Audio play failed (often due to autoplay restrictions)
                console.log("Audio autoplay blocked");
            });
        }
        setIsPlaying(!isPlaying);
    };

    const changeSound = (sound: typeof SOUNDS[0]) => {
        setCurrentSound(sound);
        if (audioRef.current) {
            audioRef.current.src = sound.file;
            if (isPlaying) {
                audioRef.current.play();
            }
        }
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (audioRef.current) {
            audioRef.current.volume = vol;
        }
    };

    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-2">
                <audio
                    ref={audioRef}
                    src={currentSound.file}
                    loop
                    preload="metadata"
                />
                <button
                    onClick={togglePlay}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isPlaying
                        ? 'bg-aura-cyan/20 text-aura-cyan border border-aura-cyan/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                        }`}
                >
                    {isPlaying ? '🔊 Ovoz ON' : '🔇 Ovoz OFF'}
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <audio
                ref={audioRef}
                src={currentSound.file}
                loop
                preload="metadata"
            />

            <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">🎧 Ambient Ovoz</h3>
                <button
                    onClick={togglePlay}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying
                        ? 'bg-aura-cyan text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                >
                    {isPlaying ? '⏸️' : '▶️'}
                </button>
            </div>

            {/* Sound Selection */}
            <div className="flex gap-2">
                {SOUNDS.map(sound => (
                    <button
                        key={sound.id}
                        onClick={() => changeSound(sound)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${currentSound.id === sound.id
                            ? 'bg-aura-purple/20 text-aura-purple border border-aura-purple/30'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                            }`}
                    >
                        {sound.label}
                    </button>
                ))}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">🔈</span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolume}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-aura-cyan"
                />
                <span className="text-gray-500 text-sm">🔊</span>
            </div>
        </div>
    );
}
