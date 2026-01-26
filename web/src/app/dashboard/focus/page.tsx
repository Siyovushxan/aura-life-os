"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Pause,
    X,
    Volume2,
    VolumeX,
    CloudRain,
    Trees,
    Music,
    Coffee,
    Waves,
    ChevronLeft,
    ShieldCheck,
    AlertTriangle,
    Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFocus } from '@/context/FocusContext';
import {
    getFocusHistory,
    getTodayFocusStats,
    FocusSession
} from '@/services/focusService';
import { unlockScreenTime, getFamilyMembers } from '@/services/familyService';

const DURATIONS = [5, 10, 15, 20, 25];

export default function FocusDashboard() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { clearNotification } = useNotifications();
    const searchParams = useSearchParams();
    const taskId = searchParams.get('taskId');
    const taskNameFromURL = searchParams.get('taskName');

    const {
        isActive: isRunning,
        isPaused,
        timeLeft,
        duration: sessionDuration,
        distractions,
        startSession,
        pauseSession,
        resumeSession,
        endSession,
        taskName: activeTaskName
    } = useFocus();

    const [nextDuration, setNextDuration] = useState(25);
    const [activeSound, setActiveSound] = useState<'rain' | 'forest' | 'lofi' | 'cafe' | 'ocean'>('rain');
    const [isMuted, setIsMuted] = useState(false);
    const [history, setHistory] = useState<FocusSession[]>([]);
    const [todayStats, setTodayStats] = useState({ totalMinutes: 0, sessions: 0, completed: 0 });
    const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const SOUNDS = {
        rain: {
            url: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/rain.mp3',
            label: "YOMG'IR",
            icon: <CloudRain className="w-4 h-4" />
        },
        forest: {
            url: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/birds.mp3',
            label: "O'RMON",
            icon: <Trees className="w-4 h-4" />
        },
        lofi: {
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
            label: "LOFI",
            icon: <Music className="w-4 h-4" />
        },
        cafe: {
            url: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/cafe.mp3',
            label: "KAFE",
            icon: <Coffee className="w-4 h-4" />
        },
        ocean: {
            url: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/ocean.mp3',
            label: "OKEAN",
            icon: <Waves className="w-4 h-4" />
        }
    };

    // Audio Playback Controller
    useEffect(() => {
        let isCancelled = false;

        const playAudio = async () => {
            if (!audioRef.current || isCancelled) return;
            try {
                // Ensure we are in a valid state to play
                if (isRunning && !isMuted) {
                    await audioRef.current.play();
                } else {
                    audioRef.current.pause();
                }
            } catch (err) {
                // Ignore AbortError as it is expected when switching sounds quickly
                if ((err as Error).name !== 'AbortError') {
                    console.error("Audio playback error:", err);
                }
            }
        };

        if (isRunning && !isMuted) {
            if (!audioRef.current) {
                audioRef.current = new Audio(SOUNDS[activeSound].url);
                audioRef.current.loop = true;
            } else if (audioRef.current.src !== SOUNDS[activeSound].url) {
                audioRef.current.src = SOUNDS[activeSound].url;
            }
            playAudio();
        } else {
            audioRef.current?.pause();
        }

        return () => {
            isCancelled = true;
            // audioRef.current?.pause(); // Don't pause here to avoid cutting off sound transitions abruptly
        };
    }, [isRunning, activeSound, isMuted]);

    // Global cleanup
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (user) {
            clearNotification('tasks');
            getFocusHistory(user.uid).then(setHistory);
            getTodayFocusStats(user.uid).then(setTodayStats);
        }
    }, [user, isRunning]);

    const handleStart = async () => {
        if (!user) return;

        // Initialize and play audio immediately on user click to satisfy browser autoplay policy
        if (!audioRef.current) {
            audioRef.current = new Audio(SOUNDS[activeSound].url);
            audioRef.current.loop = true;
        } else if (audioRef.current.src !== SOUNDS[activeSound].url) {
            audioRef.current.src = SOUNDS[activeSound].url;
        }

        if (!isMuted) {
            audioRef.current.play().catch(e => console.error("Manual audio start failed:", e));
        }

        await startSession(nextDuration, taskId || undefined, taskNameFromURL || undefined);
    };

    const handleGiveUp = async () => {
        if (!isConfirmingEnd) {
            setIsConfirmingEnd(true);
            return;
        }
        await endSession('failed');
        setIsConfirmingEnd(false);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans selection:bg-aura-purple/30 overflow-hidden relative">

            {/* Zen Background Layers */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-aura-purple/5 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-aura-cyan/5 rounded-full blur-[120px] animate-pulse delay-700"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150"></div>
                <div className={`absolute inset-0 bg-black/60 transition-opacity duration-1000 ${isRunning ? 'opacity-90' : 'opacity-40'}`}></div>
            </div>

            {/* Navigation Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-20 p-8 flex items-center justify-between"
            >
                <Link
                    href="/dashboard/tasks/"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group backdrop-blur-xl"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white">Vazifalar</span>
                </Link>

                <div className="flex flex-col items-center">
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="text-[9px] font-black uppercase tracking-[0.5em] text-aura-purple"
                    >
                        Ultra Focus Mode
                    </motion.span>
                    <h1 className="text-xs font-black tracking-[0.3em] text-white uppercase mt-1">DIQQAT SESSIYASI</h1>
                </div>

                <div className="w-32 flex justify-end">
                    {activeTaskName && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-aura-purple animate-pulse shadow-[0_0_8px_#A855F7]" />
                            <span className="text-[9px] font-black text-gray-300 uppercase truncate max-w-[100px]">{activeTaskName}</span>
                        </div>
                    )}
                </div>
            </motion.header>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center -mt-10 px-6">

                <div className="relative w-full max-w-4xl flex flex-col items-center">

                    {/* Duration Selector */}
                    <AnimatePresence>
                        {!isRunning && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5 backdrop-blur-2xl"
                            >
                                {DURATIONS.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setNextDuration(d)}
                                        className={`w-12 h-10 rounded-xl flex flex-col items-center justify-center transition-all duration-500 ${nextDuration === d
                                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-sm font-black">{d}</span>
                                        <span className="text-[7px] font-bold uppercase opacity-50">min</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Timer Display */}
                    <motion.div
                        layout
                        className="relative flex flex-col items-center"
                    >
                        {/* Immersive Timer Glow */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-aura-purple/10 rounded-full blur-[80px] transition-opacity duration-1000 ${isRunning ? 'opacity-100' : 'opacity-0'}`} />

                        <div className={`text-[8rem] md:text-[10rem] font-black leading-none tabular-nums tracking-tighter transition-all duration-1000 select-none ${!isRunning ? 'text-white/10 blur-[1px] scale-95' : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]'}`}>
                            {formatTime(isRunning ? timeLeft : nextDuration * 60)}
                        </div>

                        {/* Status Indicators */}
                        <AnimatePresence>
                            {isRunning && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex flex-col items-center gap-2 mt-2"
                                >
                                    <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-2xl transition-all duration-500 ${distractions > 0
                                        ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                        : 'bg-aura-purple/10 border-aura-purple/30 text-aura-purple shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                        }`}>
                                        <div className="relative">
                                            {distractions > 0 ? <AlertTriangle className="w-3 h-3 animate-pulse" /> : <ShieldCheck className="w-3 h-3" />}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider">
                                            {distractions > 0 ? `Buzilish: ${distractions}` : 'Fokus Faol'}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Desktop Hover Hint */}
                    {!isRunning && (
                        <motion.div
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="mt-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest"
                        >
                            Vaqtni tanlang va sessiyani boshlang
                        </motion.div>
                    )}

                    {/* Primary Button Container */}
                    <div className="mt-8 relative flex items-center justify-center w-full max-w-md">
                        {!isRunning ? (
                            <motion.button
                                layoutId="mainAction"
                                whileHover={{ scale: 1.02, backgroundColor: '#ffffff' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleStart}
                                className="w-full py-5 rounded-[2rem] bg-white text-black font-black text-lg uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all duration-300 relative z-10"
                            >
                                BOSHLASH
                            </motion.button>
                        ) : (
                            <motion.div
                                layoutId="mainAction"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-3 bg-white/5 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl"
                            >
                                <button
                                    onClick={isPaused ? resumeSession : pauseSession}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden group ${isPaused
                                        ? 'bg-aura-green text-black scale-110 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />}
                                </button>

                                <div className="flex flex-col gap-1.5">
                                    <button
                                        onClick={handleGiveUp}
                                        className={`px-6 py-3 rounded-full font-black uppercase tracking-widest text-[9px] transition-all duration-500 ${isConfirmingEnd
                                            ? 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] px-8'
                                            : 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                                            }`}
                                    >
                                        {isConfirmingEnd ? "HA, TO'XTATISH" : "Tugatish"}
                                    </button>
                                    {isConfirmingEnd && (
                                        <button
                                            onClick={() => setIsConfirmingEnd(false)}
                                            className="text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                                        >
                                            YO'Q, DAVOM ETAMAN
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Stats/History Preview when not running */}
                    <AnimatePresence>
                        {!isRunning && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-12 w-full grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Bugungi Vaqt</span>
                                    <span className="text-2xl font-black">{todayStats.totalMinutes}</span>
                                    <span className="text-[7px] font-bold text-aura-purple uppercase tracking-widest mt-0.5">daqiqa</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Bajarilgan</span>
                                    <span className="text-2xl font-black">{todayStats.completed}</span>
                                    <span className="text-[7px] font-bold text-aura-cyan uppercase tracking-widest mt-0.5">seans</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">O'rtacha Diqqat</span>
                                    <span className="text-2xl font-black">{history.length > 0 ? (100 - (history.reduce((acc, s) => acc + (s.distractions || 0), 0) / history.length) * 10).toFixed(0) : 100}%</span>
                                    <span className="text-[7px] font-bold text-aura-green uppercase tracking-widest mt-0.5">sifat</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* History List */}
                    <AnimatePresence>
                        {!isRunning && history.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 w-full max-w-xl"
                            >
                                <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-4 text-center">Oxirgi Sessiyalar</h2>
                                <div className="space-y-2">
                                    {history.slice(0, 3).map((session, i) => (
                                        <div key={session.id || i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${session.status === 'completed' ? 'bg-aura-green' : 'bg-red-500'} shadow-[0_0_8px_currentColor]`} />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{session.taskName || "Deep Work"}</span>
                                                    <span className="text-[8px] text-gray-500 font-mono">{new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.duration} min</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {session.distractions > 0 && (
                                                    <span className="text-[7px] font-bold text-red-500/50 border border-red-500/10 px-1.5 py-0.5 rounded-full uppercase">
                                                        {session.distractions}
                                                    </span>
                                                )}
                                                <span className={`text-[8px] font-black uppercase ${session.status === 'completed' ? 'text-aura-green' : 'text-red-500/50'}`}>
                                                    {session.status === 'completed' ? '✓' : '✗'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Immersive Sound Control Bar */}
            <AnimatePresence>
                {isRunning && (
                    <motion.footer
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 w-fit"
                    >
                        <div className="flex items-center gap-2 p-3 bg-black/60 backdrop-blur-[40px] border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-110">
                            {/* Mute Button */}
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${!isMuted ? 'bg-aura-cyan text-black shadow-[0_0_30px_rgba(0,240,255,0.4)]' : 'bg-white/5 text-gray-500 border border-white/5'
                                    }`}
                            >
                                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6 animate-pulse" />}
                            </button>

                            <div className="w-px h-10 bg-white/10 mx-2" />

                            {/* Sound Presets */}
                            <div className="flex gap-1 pr-2">
                                {(Object.keys(SOUNDS) as Array<keyof typeof SOUNDS>).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => { setActiveSound(key); setIsMuted(false); }}
                                        className={`px-5 py-3 rounded-full flex items-center gap-3 transition-all duration-500 ${activeSound === key && !isMuted
                                            ? 'bg-white text-black font-black scale-105 shadow-xl'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={activeSound === key && !isMuted ? 'text-black' : 'text-gray-500'}>
                                            {SOUNDS[key].icon}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.1em] hidden md:inline">{SOUNDS[key].label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.footer>
                )}
            </AnimatePresence>

            {/* Footer Stats Toast */}
            {!isRunning && history.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-3"
                >
                    <div className="w-8 h-[1px] bg-gray-800" />
                    Oxirgi Sessiya: {history[0].duration} daqiqa
                    <div className="w-8 h-[1px] bg-gray-800" />
                </motion.div>
            )}

            {/* Subtle Gradient Overlays */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-2000 ${isRunning ? 'opacity-30' : 'opacity-10'}`}>
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-aura-purple/10 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-aura-cyan/10 to-transparent" />
            </div>

        </div>
    );
}
