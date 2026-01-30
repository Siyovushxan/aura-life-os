
"use client";
import React from 'react';
import { useAiUsage } from '@/hooks/useAiUsage';

const LimitIndicator = () => {
    const { usage, limit, remaining, loading } = useAiUsage();

    if (loading) return <span className="animate-pulse w-10 h-2 bg-white/10 rounded-full"></span>;

    const percentage = Math.min(100, (usage / limit) * 100);
    const isCritical = remaining <= 2 && limit > 10;
    const isZero = remaining === 0;

    return (
        <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isZero ? 'bg-red-500' : isCritical ? 'bg-orange-500' : 'bg-aura-cyan'}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className={`text-[9px] font-mono font-bold ${isZero ? 'text-red-400' : 'text-gray-400'}`}>
                {usage}/{limit}
            </span>
        </div>
    );
};

interface AiInsightSectionProps {
    onAnalyze: () => void;
    isLoading: boolean;
    insight: any; // Flexible insight object (title, insight, recommendation/text, emoji, etc.)
    title?: string;
    description?: string;
    buttonText?: string;
    color?: 'purple' | 'cyan' | 'green' | 'gold' | 'red' | 'blue';
    children?: React.ReactNode;
}

export const AiInsightSection: React.FC<AiInsightSectionProps> = ({
    onAnalyze,
    isLoading,
    insight,
    title = "AI Maslahat",
    description = "Sun'iy intellekt yordamida chuqur tahlil va tavsiyalar oling.",
    buttonText = "Tahlilni Boshlash",
    color = 'purple',
    children
}) => {

    // Color mappings
    const colorClasses = {
        purple: {
            bg: 'from-aura-purple/20',
            border: 'border-aura-purple/20',
            text: 'text-aura-purple',
            hoverShadow: 'hover:shadow-[0_0_20px_rgba(157,78,221,0.5)]',
            btnBg: 'bg-aura-purple',
            iconBg: 'bg-aura-purple/20'
        },
        cyan: {
            bg: 'from-aura-cyan/20',
            border: 'border-aura-cyan/20',
            text: 'text-aura-cyan',
            hoverShadow: 'hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]',
            btnBg: 'bg-aura-cyan',
            iconBg: 'bg-aura-cyan/20'
        },
        green: {
            bg: 'from-aura-green/20',
            border: 'border-aura-green/20',
            text: 'text-aura-green',
            hoverShadow: 'hover:shadow-[0_0_20px_rgba(0,255,148,0.5)]',
            btnBg: 'bg-aura-green',
            iconBg: 'bg-aura-green/20'
        },
        gold: {
            bg: 'from-aura-gold/20',
            border: 'border-aura-gold/20',
            text: 'text-aura-gold',
            hoverShadow: 'hover:shadow-[0_0_20px_rgba(255,214,0,0.5)]',
            btnBg: 'bg-aura-gold',
            iconBg: 'bg-aura-gold/20'
        },
        red: {
            bg: 'from-aura-red/20',
            border: 'border-aura-red/20',
            text: 'text-aura-red',
            hoverShadow: 'hover:shadow-[0_0_20px_rgba(255,46,46,0.5)]',
            btnBg: 'bg-aura-red',
            iconBg: 'bg-aura-red/20'
        },
        blue: {
            bg: 'from-aura-blue/20',
            border: 'border-aura-blue/20',
            text: 'text-aura-blue',
            hoverShadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]',
            btnBg: 'bg-aura-blue',
            iconBg: 'bg-aura-blue/20'
        }
    };

    const styles = colorClasses[color];

    // Resolve nested data if it exists (for persistence service compatibility)
    const effectiveInsight = insight?.data || insight;
    const effectiveProtocol = effectiveInsight?.protocol || insight?.protocol;
    const effectiveRoadmap = effectiveInsight?.roadmap || insight?.roadmap;
    const effectiveScore = effectiveInsight?.vitalityScore !== undefined ? effectiveInsight.vitalityScore : (insight?.vitalityScore !== undefined ? insight.vitalityScore : undefined);

    return (
        <div className={`w-full p-8 rounded-[2.5rem] bg-gradient-to-br ${styles.bg} via-black/40 to-transparent border ${styles.border} backdrop-blur-3xl relative overflow-hidden group mb-10 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]`}>
            {/* Ambient Background Glows */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 ${styles.btnBg} opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity duration-700`}></div>
            <div className={`absolute -bottom-24 -left-24 w-64 h-64 ${styles.btnBg} opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity duration-700`}></div>

            <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                <div className="flex items-start md:items-center gap-6 flex-1">
                    <div className={`w-16 h-16 rounded-2xl ${styles.iconBg} flex items-center justify-center text-3xl shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10">{isLoading ? '⚙️' : (effectiveInsight?.emoji || insight?.emoji || '🔮')}</span>
                        {isLoading && <div className="absolute inset-0 border-2 border-white/20 border-t-white rounded-2xl animate-spin"></div>}
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col gap-1 mb-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                Asosiy Vazifa
                                <LimitIndicator />
                            </span>
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-display font-black text-white tracking-tight">{title}</h3>
                                {effectiveInsight?.status && (
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${effectiveInsight.status === 'ready' || effectiveInsight.status === 'success' ? 'bg-aura-green/20 text-aura-green border border-aura-green/30' :
                                        effectiveInsight.status === 'warning' ? 'bg-aura-red/20 text-aura-red border border-aura-red/30' :
                                            'bg-aura-gold/20 text-aura-gold border border-aura-gold/30'
                                        }`}>
                                        {effectiveInsight.status}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                                {insight ? (effectiveInsight.insight || effectiveInsight.text || effectiveInsight.recommendation || effectiveInsight.advice || insight.insight || insight.text || "Operatsion tahlil yakunlandi. Protokol tayyor.") : description}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onAnalyze}
                        disabled={isLoading}
                        className={`group/btn relative px-10 py-4 ${styles.btnBg} text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl ${styles.hoverShadow} transition-all duration-300 disabled:opacity-50 active:scale-95 flex items-center gap-3 overflow-hidden`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative z-10">{isLoading ? 'Sinxronizatsiya...' : buttonText}</span>
                        {!isLoading && <span className="relative z-10 group-hover/btn:translate-x-1 transition-transform">→</span>}
                    </button>
                </div>
            </div>

            {insight && (
                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in relative z-10">
                    {/* Protocol / Roadmap Combined Section */}
                    {(effectiveProtocol || effectiveRoadmap) && (
                        <div className="md:col-span-3">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3 ${styles.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${styles.btnBg} animate-pulse`}></span>
                                {effectiveProtocol ? "AURA Vitality Protocol" : "Qo'shimcha Vazifalar (Subtasks)"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(((effectiveProtocol || effectiveRoadmap) as string[]) || []).map((step: string, i: number) => (
                                    <div key={i} className="group/step relative p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 transition-all overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${styles.btnBg} opacity-20 group-hover/step:opacity-100 transition-opacity`}></div>
                                        <div className="flex items-start gap-4">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${styles.iconBg} ${styles.text} flex items-center justify-center text-xs font-black shadow-lg`}>
                                                {i + 1}
                                            </div>
                                            <p className="text-sm text-gray-300 group-hover/step:text-white leading-relaxed transition-colors mt-1 font-medium">{step}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2 space-y-4">
                        <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${styles.text}`}>Kritik Xulosa</h4>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group/opt transition-all hover:bg-white/10 h-full min-h-[120px] flex flex-col justify-center">
                            <div className={`absolute top-0 left-0 w-1 h-full ${styles.btnBg} opacity-50`}></div>
                            <div className={`absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover/opt:scale-125 transition-transform duration-500`}>{effectiveInsight.emoji || insight.emoji || '💡'}</div>
                            <p className="text-base text-gray-200 leading-relaxed font-medium relative z-10">
                                {effectiveInsight.optimization || effectiveInsight.recommendation || effectiveInsight.suggestion || effectiveInsight.text || effectiveInsight.advice ||
                                    (effectiveInsight.insight ? (effectiveInsight.insight.length > 150 ? effectiveInsight.insight.substring(0, 150) + '...' : effectiveInsight.insight) : "Natijalar tahlil qilinmoqda.")}
                            </p>
                            {(effectiveInsight.success_mock || insight.success_mock) && (
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-aura-cyan animate-pulse"></span>
                                    <span className="text-[8px] font-black text-aura-cyan uppercase tracking-widest opacity-50">AURA Simulation Active</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Score / Potential Section */}
                    <div className="space-y-4">
                        <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${styles.text}`}>Samaradorlik</h4>
                        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-center gap-4 h-full min-h-[120px]">
                            {effectiveScore !== undefined ? (
                                <>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Vitality Index</span>
                                        <span className={`text-2xl font-black ${styles.text}`}>{effectiveScore}%</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5 shadow-inner">
                                        <div
                                            className={`h-full ${styles.btnBg} rounded-full transition-all duration-[2s] ease-in-out w-[var(--value)]`}
                                            style={{
                                                '--value': `${effectiveScore}%`,
                                                boxShadow: `0 0 15px ${color === 'cyan' ? 'rgba(0,240,255,0.4)' :
                                                    color === 'purple' ? 'rgba(157,78,221,0.4)' :
                                                        color === 'green' ? 'rgba(0,255,148,0.4)' :
                                                            color === 'gold' ? 'rgba(255,214,0,0.4)' :
                                                                color === 'red' ? 'rgba(255,46,46,0.4)' :
                                                                    'rgba(59,130,246,0.4)'}`
                                            } as React.CSSProperties}
                                        ></div>
                                    </div>
                                </>
                            ) : effectiveInsight.potentialSavings ? (
                                <div className="text-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Potensial Tejov</span>
                                    <div className={`text-2xl font-black ${styles.text} group-hover:scale-110 transition-transform`}>{effectiveInsight.potentialSavings}</div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <span className="text-4xl animate-pulse">💎</span>
                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mt-2">Ma'lumotlar kutilmoqda</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Children for Custom Actions */}
                    {children && (
                        <div className="md:col-span-3 pt-6 animate-slide-up">
                            {children}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
