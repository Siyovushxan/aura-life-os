"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseCommand } from '@/services/groqService';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const QUICK_ACTIONS = [
    { label: "Moliya", icon: "💰", path: "/dashboard/finance" },
    { label: "Vazifalar", icon: "📋", path: "/dashboard/tasks" },
    { label: "Fokus", icon: "🎯", path: "/dashboard/focus" },
    { label: "Salomatlik", icon: "❤️", path: "/dashboard/health" },
    { label: "Ovqat", icon: "🍽️", path: "/dashboard/food" },
    { label: "Oila", icon: "👨‍👩‍👧", path: "/dashboard/family" },
    { label: "Sozlamalar", icon: "⚙️", path: "/dashboard/settings" },
];

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // Auto-focus when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setQuery('');
            setResult(null);
        }
    }, [isOpen]);

    // Filter quick actions
    const filteredActions = query.length > 0
        ? QUICK_ACTIONS.filter(a =>
            a.label.toLowerCase().includes(query.toLowerCase())
        )
        : QUICK_ACTIONS;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsProcessing(true);

        // Check for navigation commands first
        const navMatch = filteredActions.find(a =>
            a.label.toLowerCase() === query.toLowerCase()
        );

        if (navMatch) {
            router.push(navMatch.path);
            onClose();
            return;
        }

        // AI Command Parsing
        try {
            const intent = await parseCommand(query);

            if (intent.module === 'finance') {
                router.push('/dashboard/finance');
                setResult(`Moliya: ${JSON.stringify(intent.data)}`);
            } else if (intent.module === 'tasks') {
                router.push('/dashboard/tasks');
                setResult(`Vazifa: ${intent.data?.title || query}`);
            } else if (intent.module === 'focus') {
                router.push(`/dashboard/focus`);
            } else if (intent.module === 'health') {
                router.push('/dashboard/health');
            } else {
                setResult("Tushunmadim. Qayta urinib ko'ring.");
            }
        } catch (error) {
            setResult("Xatolik yuz berdi.");
        }

        setIsProcessing(false);
    };

    const handleQuickAction = (path: string) => {
        router.push(path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-black/90 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <form onSubmit={handleSubmit} className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400">⌘</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buyruq yozing... (masalan: 'Moliya' yoki '50 dollar taksi')"
                            className="flex-1 bg-transparent text-white text-lg focus:outline-none placeholder-gray-500"
                        />
                        {isProcessing && (
                            <span className="text-aura-cyan animate-pulse">AI...</span>
                        )}
                    </div>
                </form>

                {/* Quick Actions */}
                <div className="p-4 max-h-[50vh] overflow-y-auto">
                    {result && (
                        <div className="mb-4 p-3 rounded-lg bg-aura-cyan/10 border border-aura-cyan/30 text-aura-cyan text-sm">
                            {result}
                        </div>
                    )}

                    <div className="text-xs text-gray-500 uppercase mb-3">Tezkor harakatlar</div>
                    <div className="grid grid-cols-2 gap-2">
                        {filteredActions.map(action => (
                            <button
                                key={action.path}
                                onClick={() => handleQuickAction(action.path)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-aura-cyan/30 transition-all text-left"
                            >
                                <span className="text-2xl">{action.icon}</span>
                                <span className="text-white font-medium">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 flex justify-between text-xs text-gray-500">
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd> bajarish
                    </span>
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd> yopish
                    </span>
                </div>
            </div>
        </div>
    );
}
