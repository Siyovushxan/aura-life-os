"use client";
import React from 'react';
import { Correlation, ButterflyScoreData } from '@/services/correlationService';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ButterflyEffectWidgetProps {
    correlations?: Correlation[];
    butterflyScore?: ButterflyScoreData | null;
    isAnalyzing?: boolean;
}

export default function ButterflyEffectWidget({
    correlations = [],
    butterflyScore,
    isAnalyzing = false
}: ButterflyEffectWidgetProps) {
    const router = useRouter();
    const { t } = useLanguage();

    const getScoreColor = () => {
        if (!butterflyScore) return 'from-white/10 to-transparent';
        if (butterflyScore.state === 'disconnected') return 'from-aura-red/30 to-aura-red/5';
        if (butterflyScore.state === 'fragmented') return 'from-aura-gold/20 to-aura-gold/5';
        return 'from-aura-cyan/30 to-aura-cyan/5';
    };

    const getScoreGradient = () => {
        if (!butterflyScore) return 'text-gray-500';
        if (butterflyScore.state === 'disconnected') return 'text-aura-red';
        if (butterflyScore.state === 'fragmented') return 'text-aura-gold';
        return 'text-aura-cyan';
    };

    const getStateLabel = () => {
        if (!butterflyScore) return t.butterfly.analyzing;
        const state = butterflyScore.state;
        return t.butterfly.states[state] || state;
    };

    const getStateDescription = () => {
        if (!butterflyScore) return '';
        const state = butterflyScore.state;
        return t.butterfly.descriptions[state] || '';
    };

    const translateModule = (moduleName: string) => {
        const key = moduleName.toLowerCase() as keyof typeof t.sidebar;
        return t.sidebar[key] || moduleName;
    };

    const getInsightText = (correlation: Correlation) => {
        if (correlation.insightKey && (t.butterfly.insights as any)[correlation.insightKey]) {
            const template = (t.butterfly.insights as any)[correlation.insightKey];
            if (typeof template === 'function') {
                return template(correlation.metrics.source.value, correlation.metrics.target.value);
            }
        }
        return correlation.insight; // Fallback to raw insight
    };

    const getActionText = (correlation: Correlation) => {
        if (correlation.actionKey && (t.butterfly.actions as any)[correlation.actionKey]) {
            return (t.butterfly.actions as any)[correlation.actionKey];
        }
        return correlation.action; // Fallback to raw action
    };

    const handleCorrelationClick = (correlation: Correlation) => {
        const module = correlation.modules[0].toLowerCase();
        router.push(`/dashboard/${module}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 rounded-[3.5rem] bg-black/40 backdrop-blur-3xl border border-white/10 relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)]`}
        >
            {/* Pulsing Aura Background */}
            <div className={`absolute -top-24 -right-24 w-96 h-96 blur-[120px] rounded-full transition-colors duration-1000 bg-gradient-to-br ${getScoreColor()} opacity-60 animate-pulse`}></div>
            <div className={`absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full transition-colors duration-1000 bg-gradient-to-br ${getScoreColor()} opacity-20`}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-2 font-display tracking-tight">{t.butterfly.title}</h2>
                        <p className="text-gray-400 text-sm max-w-md">{t.butterfly.subtitle}</p>
                    </div>
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="p-4 bg-white/5 rounded-2xl border border-white/10 text-4xl shadow-xl"
                    >
                        🦋
                    </motion.div>
                </div>

                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-80">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-aura-cyan/20"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-aura-cyan border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
                        </div>
                        <p className="text-gray-400 text-sm animate-pulse font-mono uppercase tracking-widest">{t.butterfly.analyzing}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">

                        {/* LEFT: Gauge & Harmony Score */}
                        <div className="lg:col-span-4 flex flex-col items-center justify-center py-6">
                            <div className="relative group">
                                {/* Glow effect */}
                                <div className={`absolute inset-0 blur-3xl rounded-full opacity-20 transition-colors duration-700 ${getScoreGradient().replace('text-', 'bg-')}`}></div>

                                <div className="relative w-56 h-56 flex items-center justify-center">
                                    <svg className="transform -rotate-90 w-56 h-56">
                                        <defs>
                                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#00F0FF" />
                                                <stop offset="100%" stopColor="#8A2BE2" />
                                            </linearGradient>
                                        </defs>
                                        <circle
                                            cx="112"
                                            cy="112"
                                            r="100"
                                            stroke="rgba(255,255,255,0.05)"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <motion.circle
                                            initial={{ strokeDashoffset: 628 }}
                                            animate={{ strokeDashoffset: 628 * (1 - (butterflyScore?.score || 0) / 100) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            cx="112"
                                            cy="112"
                                            r="100"
                                            stroke="currentColor"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeDasharray="628"
                                            className={`transition-all duration-1000 ${getScoreGradient()}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <motion.span
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={`text-6xl font-bold font-display ${getScoreGradient()}`}
                                        >
                                            {butterflyScore?.score || 0}
                                        </motion.span>
                                        <span className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">
                                            {t.butterfly.lifeHarmony}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-8">
                                <motion.p
                                    layout
                                    className={`text-2xl font-bold tracking-tight mb-2 ${getScoreGradient()}`}
                                >
                                    {getStateLabel()}
                                </motion.p>
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={getStateLabel()}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-sm text-gray-500 max-w-[250px] leading-relaxed italic"
                                    >
                                        {getStateDescription()}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* RIGHT: Correlation Insights list */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                                <h3 className="text-white font-bold text-xl tracking-tight">{t.butterfly.keyInsights}</h3>
                                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                    Real-time Analysis
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {correlations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center px-6">
                                        <span className="text-4xl mb-4">🌟</span>
                                        <p className="text-white font-bold mb-1">{t.butterfly.noCorrelations}</p>
                                        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">{t.butterfly.keepLogging}</p>
                                    </div>
                                ) : (
                                    correlations.slice(0, 3).map((correlation, idx) => (
                                        <motion.div
                                            key={correlation.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleCorrelationClick(correlation)}
                                            className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-aura-cyan/50 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden"
                                        >
                                            {/* Accent line */}
                                            <div className={`absolute top-0 left-0 w-1 h-full ${correlation.type === 'positive' ? 'bg-aura-green' : 'bg-aura-red'}`}></div>

                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${correlation.type === 'positive' ? 'bg-aura-green/10 text-aura-green' : 'bg-aura-red/10 text-aura-red'}`}>
                                                        {correlation.type === 'positive' ? '✓' : '⚠️'}
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 block">
                                                            {translateModule(correlation.modules[0])} → {translateModule(correlation.modules[1])}
                                                        </span>
                                                        <p className="text-white font-bold text-base mt-0.5 group-hover:text-aura-cyan transition-colors">
                                                            {getInsightText(correlation)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] px-2 py-1 rounded-lg bg-aura-purple/20 text-aura-purple font-bold border border-aura-purple/30 whitespace-nowrap">
                                                        {Math.round(correlation.confidence * 100)}% {t.butterfly.confident}
                                                    </span>
                                                </div>
                                            </div>

                                            {(correlation.action || correlation.actionKey) && (
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400">💡</span>
                                                        <p className="text-xs text-gray-400 font-medium italic leading-none">
                                                            {getActionText(correlation)}
                                                        </p>
                                                    </div>
                                                    <button className="flex items-center gap-2 text-[10px] px-4 py-2 rounded-full bg-aura-cyan/10 text-aura-cyan border border-aura-cyan/20 group-hover:bg-aura-cyan group-hover:text-black transition-all font-bold">
                                                        {t.butterfly.fixThis} <span>→</span>
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </motion.div>
    );
}
