"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { billingService, SubscriptionData } from '@/services/billingService';
import CheckoutModal from './CheckoutModal';
import { useSearchParams } from 'next/navigation';
import { db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { getDailyInsight } from '@/lib/cloudFunctions';

export default function BillingPanel() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const searchParams = useSearchParams();

    const [sub, setSub] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutData, setCheckoutData] = useState<{ isOpen: boolean; planId: 'individual' | 'family'; amount: string } | null>(null);
    const [memberCount, setMemberCount] = useState(2);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [usageCount, setUsageCount] = useState(0);
    const [neuralPlan, setNeuralPlan] = useState<{ insight: string; emoji: string } | null>(null);
    const [neuralLoading, setNeuralLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let usageUnsub: (() => void) | undefined;

        if (user) {
            // Real-time listener for user document (contains subscription)
            unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.data();
                    setSub(userData.subscription || null);
                    setLoading(false);
                }
            });

            // Real-time listener for daily AI usage
            const today = new Date().toISOString().split('T')[0];
            usageUnsub = onSnapshot(doc(db, "usage", user.uid, "daily", today), (snapshot) => {
                if (snapshot.exists()) {
                    setUsageCount(snapshot.data().count || 0);
                } else {
                    setUsageCount(0);
                }
            });

            // Initial history fetch
            billingService.getPaymentHistory(user.uid).then(data => {
                setHistory(data);
                setHistoryLoading(false);
            });

            // Fetch Neural Plan (Daily Insight)
            getDailyInsight({ uid: user.uid }).then(res => {
                if (typeof res === 'string') {
                    setNeuralPlan({ insight: res, emoji: '🧠' });
                } else if (res && (res as any).insight) {
                    const data = res as any;
                    setNeuralPlan({
                        insight: data.insight,
                        emoji: data.emoji || '🧠'
                    });
                }
                setNeuralLoading(false);
            }).catch(err => {
                console.error("Neural Plan Error:", err);
                setNeuralLoading(false);
                setNeuralPlan({
                    insight: "Strategik tahlilingiz tayyor. Faollikni oshiring.",
                    emoji: "🎯"
                });
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
            if (usageUnsub) usageUnsub();
        };
    }, [user]);

    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'success' && user) {
            setSuccessMessage(t.billing.upgradeSuccess);
            setTimeout(() => setSuccessMessage(null), 5000);

            billingService.getPaymentHistory(user.uid).then(data => {
                setHistory(data);
                setHistoryLoading(false);
            });
        }
    }, [searchParams, user, t.billing.upgradeSuccess]);

    const openCheckout = (planId: 'individual' | 'family') => {
        const amount = planId === 'individual' ? '2.99' : (3.00 + (memberCount * 1.99)).toFixed(2);
        setCheckoutData({ isOpen: true, planId, amount });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-aura-purple border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentLimit = sub?.planId === 'individual' ? 50 : sub?.planId === 'family' ? 250 : 3;

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Success Alert */}
            {successMessage && (
                <div className="fixed top-24 right-8 z-[100] bg-aura-green text-white px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(0,255,157,0.4)] flex items-center gap-3 animate-slide-in">
                    <span className="text-2xl">✨</span>
                    <span className="font-bold tracking-wide uppercase text-sm">{successMessage}</span>
                </div>
            )}

            {/* HEADER & CURRENT PLAN HERO */}
            <div className="relative overflow-hidden p-8 md:p-12 rounded-[3rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-aura-purple/10 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[80px] -ml-32 -mb-32 rounded-full"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter mb-4">
                            {t.billing.title || "BILLING & SUBSCRIPTION"}
                        </h1>
                        <p className="text-gray-400 max-w-md">
                            {sub?.planId === 'trial'
                                ? "Loyiha imkoniyatlaridan to'liq foydalanish uchun tarifingizni yangilang."
                                : "AURA platformasining premium a'zosi."}
                        </p>
                    </div>

                    {sub && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] min-w-[300px] shadow-inner">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">CURRENT PLAN</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${sub.status === 'active' ? 'bg-aura-green/20 text-aura-green' : 'bg-red-500/20 text-red-500'}`}>
                                    {sub.status.toUpperCase()}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tight mb-2">
                                {sub.planId === 'individual' ? 'AURA PERSONAL' : sub.planId === 'family' ? 'AURA LEGACY' : 'SINROV (TRIAL)'}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {t.billing.activeUntil || "Active until"}: <span className="text-white font-medium">
                                    {sub.currentPeriodEnd?.toDate
                                        ? sub.currentPeriodEnd.toDate().toLocaleDateString()
                                        : new Date(sub.currentPeriodEnd).toLocaleDateString()}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI USAGE TRACKER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-between relative overflow-hidden group transition-all hover:bg-white/[0.05]">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((usageCount / currentLimit) * 100, 100)}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="absolute bottom-0 left-0 h-1 bg-aura-purple shadow-[0_0_15px_#bc00ff]"
                        aria-hidden="true"
                    />
                    <div className="relative z-10">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">AI DAILY QUOTA</div>
                        <div className="text-2xl font-black text-white tracking-tight">Active Usage</div>
                    </div>
                    <div className="relative z-10 text-right">
                        <div className="text-3xl font-black text-white">{usageCount} <span className="text-gray-600">/ {currentLimit}</span></div>
                        <div className="text-[10px] font-bold text-aura-purple uppercase tracking-tighter">Requests Today</div>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between col-span-2 group hover:bg-indigo-500/15 transition-all cursor-default relative overflow-hidden">
                    <div className="flex gap-6 items-center relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            {neuralLoading ? '🧠' : (neuralPlan?.emoji || '🧠')}
                        </div>
                        <div>
                            <div className="text-white font-black uppercase text-sm italic tracking-tight mb-1">AURA Strategic Neural Plan</div>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={neuralLoading ? 'loading' : 'content'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-gray-400 text-xs leading-relaxed max-w-lg"
                                >
                                    {neuralLoading
                                        ? "Sizning raqamli hayot strategiyangiz tahlil qilinib, limitlaringizga moslashtirilmoqda..."
                                        : (neuralPlan?.insight || "Tahlil yakunlandi.")}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="hidden md:block relative z-10">
                        {neuralLoading ? (
                            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-black shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                            >
                                AI
                            </motion.div>
                        )}
                    </div>

                    {/* Subtle Background Decoration */}
                    {!neuralLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.05 }}
                            className="absolute right-0 top-0 w-full h-full pointer-events-none"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 blur-[80px] rounded-full -mr-32 -mt-32"></div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* PRICING PLANS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Individual Card */}
                <div className={`group relative p-10 rounded-[3rem] transition-all duration-500 border overflow-hidden ${sub?.planId === 'individual'
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.1)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-cyan-500/30'
                    }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">AURA PERSONAL</h3>
                                <p className="text-gray-500 text-sm">Sizning shaxsiy raqamli ongingiz</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-white tracking-tighter">$2.99</div>
                                <div className="text-gray-600 text-[10px] font-bold uppercase">per month</div>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10">
                            {[
                                "Full Module Access",
                                "AI Actions / Day: 50",
                                "Voice Control Enabled",
                                "Personal Strategic Analysis"
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-gray-300">
                                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-500">✔</div>
                                    <span className="text-sm font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => openCheckout('individual')}
                            disabled={sub?.planId === 'individual'}
                            title={sub?.planId === 'individual' ? "Siz allaqachon ushbu tarifdasiz" : "Tarifni yangilash"}
                            aria-label="Upgrade to AURA PERSONAL"
                            className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${sub?.planId === 'individual'
                                ? 'bg-white/5 text-gray-600 cursor-default'
                                : 'bg-cyan-500 text-white hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                                }`}
                        >
                            {sub?.planId === 'individual' ? (t.common.current || 'CURRENT') : t.billing.switch}
                        </button>
                    </div>
                </div>

                {/* Family Card */}
                <div className={`group relative p-10 rounded-[3rem] transition-all duration-500 border overflow-hidden ${sub?.planId === 'family'
                    ? 'bg-aura-purple/10 border-aura-purple/50 shadow-[0_0_50px_rgba(188,0,255,0.1)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-aura-purple/30'
                    }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-aura-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">AURA LEGACY</h3>
                                <p className="text-gray-500 text-sm">Butun oila a'zolari uchun</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-white tracking-tighter">${(3.00 + (memberCount * 1.99)).toFixed(2)}</div>
                                <div className="text-gray-600 text-[10px] font-bold uppercase">per month</div>
                            </div>
                        </div>

                        {/* Member Slider */}
                        <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/5">
                            <div className="flex justify-between mb-4">
                                <label htmlFor="member-count-slider" className="text-gray-400 text-xs font-bold uppercase cursor-pointer">A'ZOLAR SONI</label>
                                <span className="text-aura-purple font-black">{memberCount}</span>
                            </div>
                            <input
                                id="member-count-slider"
                                type="range"
                                min="2"
                                max="15"
                                value={memberCount}
                                onChange={(e) => setMemberCount(parseInt(e.target.value))}
                                aria-label="Family member count"
                                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-aura-purple"
                            />
                            <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold">
                                <span>2 MEMBERS</span>
                                <span>15 MAX</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10">
                            {[
                                `Up to ${memberCount} Family Members`,
                                "Master Dashboard Control",
                                "Shared Legacy Storage",
                                "AI Actions / Day: 250"
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-gray-300">
                                    <div className="w-5 h-5 rounded-full bg-aura-purple/20 flex items-center justify-center text-[10px] text-aura-purple">✔</div>
                                    <span className="text-sm font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => openCheckout('family')}
                            disabled={sub?.planId === 'family'}
                            title={sub?.planId === 'family' ? "Siz allaqachon ushbu tarifdasiz" : "Tarifni yangilash"}
                            aria-label="Upgrade to AURA LEGACY"
                            className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${sub?.planId === 'family'
                                ? 'bg-white/5 text-gray-600 cursor-default'
                                : 'bg-aura-purple text-white hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(188,0,255,0.3)]'
                                }`}
                        >
                            {sub?.planId === 'family' ? (t.common.current || 'CURRENT') : t.billing.switch}
                        </button>
                    </div>
                </div>
            </div>

            {/* PAYMENT HISTORY */}
            <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">{t.billing.history}</h3>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">📑</div>
                </div>

                {historyLoading ? (
                    <div className="flex flex-col items-center py-12 gap-4">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest animate-pulse">Yuklanmoqda...</span>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-16 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
                        <div className="text-4xl mb-4 opacity-20">💳</div>
                        <p className="text-gray-600 text-sm font-medium italic">
                            {t.billing.noHistory || "Hali to'lovlar amalga oshirilmagan"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((record) => (
                            <div key={record.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-black/40 flex flex-col items-center justify-center border border-white/5">
                                        <span className="text-[10px] font-black text-gray-500 uppercase">
                                            {record.createdAt?.toDate
                                                ? record.createdAt.toDate().toLocaleString('default', { month: 'short' })
                                                : new Date(record.createdAt).toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-black text-white">
                                            {record.createdAt?.toDate
                                                ? record.createdAt.toDate().getDate()
                                                : new Date(record.createdAt).getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">TRANS_ID: {record.id.substring(0, 8)}</div>
                                        <div className="text-white font-bold uppercase">{record.planId} SUBSCRIPTION</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-white mb-1 tracking-tight">${record.amount}</div>
                                    <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${record.status === 'succeeded' ? 'bg-aura-green/10 text-aura-green' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                        {record.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {checkoutData && (
                <CheckoutModal
                    isOpen={checkoutData.isOpen}
                    onClose={() => setCheckoutData(null)}
                    onConfirm={() => {
                        setCheckoutData(null);
                    }}
                    planName={checkoutData.planId === 'individual' ? 'AURA PERSONAL' : 'AURA LEGACY'}
                    amount={checkoutData.amount}
                    planId={checkoutData.planId}
                />
            )}
        </div>
    );
}