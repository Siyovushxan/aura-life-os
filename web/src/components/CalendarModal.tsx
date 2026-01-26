"use client";
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Modal from './Modal';
import { getLocalTodayStr } from '@/lib/dateUtils';

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDateSelect: (date: string) => void;
    selectedDate: string;
}

export default function CalendarModal({ isOpen, onClose, onDateSelect, selectedDate }: CalendarModalProps) {
    const { t } = useLanguage();
    const [viewDate, setViewDate] = useState(new Date(selectedDate || Date.now()));

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const monthData = useMemo(() => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();

        // Adjust firstDay for Monday start if preferred, but keeping standard for now
        // To make Monday index 0: (firstDay === 0 ? 6 : firstDay - 1)
        const offset = (firstDay === 0 ? 6 : firstDay - 1);

        const days = [];
        for (let i = 0; i < offset; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [currentMonth, currentYear]);

    const changeMonth = (offset: number) => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + offset);
        setViewDate(d);
    };

    const monthNames = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
    ];

    const weekDays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            className="max-w-[400px]"
        >
            <div className="relative pt-2 pb-4">
                {/* Header with Glassmorphism */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md mb-2">
                        <span className="text-xl">📅</span>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                            Sana tanlash
                        </h3>
                    </div>
                </div>

                {/* Month Navigator */}
                <div className="flex justify-between items-center mb-8 px-2">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                    >
                        ←
                    </button>
                    <div className="text-center">
                        <div className="text-lg font-display font-black text-white tracking-tight">
                            {monthNames[currentMonth]}
                        </div>
                        <div className="text-[10px] text-aura-cyan font-black uppercase tracking-widest opacity-50">
                            {currentYear}
                        </div>
                    </div>
                    <button
                        onClick={() => changeMonth(1)}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                    >
                        →
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(d => (
                        <div key={d} className="text-[10px] text-gray-600 font-black uppercase tracking-widest text-center py-2">
                            {d}
                        </div>
                    ))}
                    {monthData.map((d, i) => {
                        if (d === null) return <div key={`empty-${i}`} className="aspect-square" />;

                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSelected = dateStr === selectedDate;
                        const now = new Date();
                        const isToday = d === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();

                        return (
                            <button
                                key={dateStr}
                                onClick={() => { onDateSelect(dateStr); onClose(); }}
                                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-300 relative group border
                                    ${isSelected ? 'bg-aura-cyan border-aura-cyan text-black font-black shadow-[0_0_20px_rgba(0,240,255,0.3)] scale-110 z-10' :
                                        isToday ? 'bg-white/10 border-aura-cyan/30 text-aura-cyan font-bold hover:bg-white/20' :
                                            'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'}
                                `}
                            >
                                {d}
                                {isToday && !isSelected && (
                                    <div className="absolute bottom-1 w-1 h-1 bg-aura-cyan rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Shortcuts */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            onDateSelect(getLocalTodayStr());
                            onClose();
                        }}
                        className="py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        <span>☀️</span> Bugun
                    </button>
                    <button
                        onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const year = tomorrow.getFullYear();
                            const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                            const day = String(tomorrow.getDate()).padStart(2, '0');
                            onDateSelect(`${year}-${month}-${day}`);
                            onClose();
                        }}
                        className="py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        <span>🚀</span> Erta
                    </button>
                </div>
            </div>
        </Modal>
    );
}
