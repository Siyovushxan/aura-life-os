"use client";
import React from 'react';
import { useFocus } from '@/context/FocusContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export const FocusOverlay: React.FC = () => {
    const { isActive, timeLeft, duration, isPaused, taskName, distractions } = useFocus();
    const pathname = usePathname();

    // Don't show overlay on the Focus page itself
    if (!isActive || pathname === '/dashboard/focus') return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

    return (
        <Link href="/dashboard/focus">
            <div className="fixed bottom-8 right-8 z-[100] group">
                <div className={`p-4 rounded-2xl bg-black/80 backdrop-blur-xl border-2 transition-all flex items-center gap-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-105 active:scale-95 ${distractions > 2 ? 'border-aura-red shadow-[0_0_20px_rgba(255,46,46,0.2)]' : 'border-aura-purple shadow-[0_0_20px_rgba(112,0,255,0.2)]'}`}>

                    {/* Ring */}
                    <div className="relative w-12 h-12">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="50%" cy="50%" r="20" fill="none" stroke="#222" strokeWidth="4" />
                            <circle
                                cx="50%" cy="50%" r="20"
                                fill="none"
                                stroke={distractions > 2 ? '#FF2E2E' : '#7000FF'}
                                strokeWidth="4"
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={(2 * Math.PI * 20) * (1 - progress / 100)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                            {isPaused ? '⏸' : Math.ceil(timeLeft / 60)}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">{formatTime(timeLeft)}</span>
                            {distractions > 0 && <span className="text-aura-red text-[10px] font-black">⚠️ {distractions}</span>}
                        </div>
                        <div className="text-[10px] text-gray-500 max-w-[120px] truncate uppercase tracking-widest font-bold">
                            {taskName || 'Focus Session'}
                        </div>
                    </div>

                    {/* Expand Hint */}
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-aura-purple flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        ↗
                    </div>
                </div>
            </div>
        </Link>
    );
};
