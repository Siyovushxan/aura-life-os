"use client";
import React from 'react';

interface PremiumEmptyStateProps {
    title: string;
    description: string;
    icon?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    loading?: boolean;
    className?: string;
}

export function PremiumEmptyState({
    title,
    description,
    icon = "✨",
    action,
    loading = false,
    className = ""
}: PremiumEmptyStateProps) {
    return (
        <div className={`relative overflow-hidden p-12 flex flex-col items-center justify-center text-center rounded-[3rem] border border-white/5 bg-black/20 ${className}`}>
            {/* Neural Background Effect */}
            <div className="neural-mesh animate-neural-pulse opacity-20"></div>

            <div className="relative z-10 flex flex-col items-center max-w-sm space-y-6">
                {/* Visual Anchor */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Pulsing Outer Rings */}
                    <div className="absolute inset-0 bg-aura-cyan/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute inset-4 border border-aura-cyan/30 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-6 border border-white/10 rounded-full"></div>

                    {/* Icon Sphere */}
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-aura-purple to-aura-cyan flex items-center justify-center text-4xl shadow-2xl">
                        <span className={loading ? "animate-bounce" : ""}>{icon}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter italic">
                        {title}
                    </h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Dynamic Action */}
                {action && !loading && (
                    <button
                        onClick={action.onClick}
                        className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-2xl"
                    >
                        {action.label}
                    </button>
                )}

                {loading && (
                    <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-aura-cyan animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-aura-cyan animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-aura-cyan animate-bounce"></span>
                    </div>
                )}
            </div>

            {/* Subtle Light Scan Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-20 w-full animate-scan pointer-events-none opacity-20"></div>

            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
            `}</style>
        </div>
    );
}
