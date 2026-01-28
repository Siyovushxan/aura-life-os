"use client";
import React from 'react';

interface AudioReportProps {
    title?: string;
    text: string;
    onStart?: () => void;
    onEnd?: () => void;
    autoPlay?: boolean;
}

export const AudioReport: React.FC<AudioReportProps> = ({ title = "AI Summary", text }) => {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-fade-in group hover:bg-white/10 transition-all">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10">
                <span className="text-xl">🔈</span>
            </div>
            <div className="flex-1">
                <h4 className="text-white font-bold text-sm tracking-tight">{title}</h4>
                <p className="text-xs text-gray-400 line-clamp-2 mt-1">{text}</p>
            </div>
        </div>
    );
};
