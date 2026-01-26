"use client";
import React from 'react';

interface ReadOnlyBannerProps {
    title: string;
    description: string;
}

export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({ title, description }) => {
    return (
        <div className="w-full p-6 rounded-[2rem] bg-gradient-to-r from-aura-red/20 via-aura-red/5 to-transparent border border-aura-red/30 mb-8 animate-fade-in flex items-center gap-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-aura-red/20 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(255,46,46,0.3)]">
                🔒
            </div>
            <div>
                <h3 className="text-xl font-display font-bold text-aura-red tracking-tight">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
};
