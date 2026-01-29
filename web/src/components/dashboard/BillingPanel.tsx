"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { billingService, SubscriptionData } from '@/services/billingService';
import CheckoutModal from './CheckoutModal';

export default function BillingPanel() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [sub, setSub] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutData, setCheckoutData] = useState<{ isOpen: boolean; planId: 'individual' | 'family'; amount: string } | null>(null);
    const [memberCount, setMemberCount] = useState(2);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            billingService.getUserSubscription(user.uid).then(data => {
                setSub(data);
                setLoading(false);
            });
        }
    }, [user]);

    const openCheckout = (planId: 'individual' | 'family') => {
        const amount = planId === 'individual' ? '2.99' : (3.00 + (memberCount * 1.99)).toFixed(2);
        setCheckoutData({ isOpen: true, planId, amount });
    };

    const handleConfirmUpgrade = async () => {
        if (!user || !checkoutData) return;
        
        const { planId } = checkoutData;
        let success = false;

        if (planId === 'individual') {
            success = await billingService.upgradeToIndividual(user.uid);
        } else {
            success = await billingService.upgradeToFamily(user.uid, memberCount);
        }

        if (success) {
            const newData = await billingService.getUserSubscription(user.uid);
            setSub(newData);
            setSuccessMessage(t.billing.upgradeSuccess);
            setTimeout(() => setSuccessMessage(null), 5000);
        }
        setCheckoutData(null);
    };

    if (loading) return <div className="p-8 text-white animate-pulse">Loading subscription data...</div>;

    const familyPrice = (3.00 + (memberCount * 1.99)).toFixed(2);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-aura-green text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_#00FF94] z-[110] animate-bounce">
                    {successMessage}
                </div>
            )}

            {/* Checkout Modal */}
            {checkoutData && (
                <CheckoutModal 
                    isOpen={checkoutData.isOpen}
                    onClose={() => setCheckoutData(null)}
                    onConfirm={handleConfirmUpgrade}
                    planName={checkoutData.planId === 'family' ? 'FAMILY (OILA)' : 'INDIVIDUAL (YAKKA)'}
                    amount={checkoutData.amount}
                />
            )}

            {/* Current Plan Card */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <span className={`px-4 py-1 rounded-full text-black font-black text-[10px] uppercase tracking-widest shadow-lg ${sub?.planId === 'family' ? 'bg-aura-purple text-white' :
                        sub?.planId === 'individual' ? 'bg-aura-cyan text-black' : 'bg-aura-gold text-black'
                        }`}>
                        {sub?.planId ? sub.planId.toUpperCase() : 'FREE TRIAL'}
                    </span>
                </div>

                <div className="relative z-10">
                    <h3 className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-2">{t.billing.currentPlan}</h3>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-5xl font-display font-black text-white italic">
                            {sub?.planId === 'family' ? 'OILA' : sub?.planId === 'individual' ? 'YAKKA' : 'TRIAL'}
                        </span>
                        {sub?.planId !== 'trial' && <span className="text-aura-cyan font-bold mb-2">ACTIVE</span>}
                    </div>
                </div>

                <p className="text-gray-400 text-sm max-w-md">
                    {sub?.planId === 'trial'
                        ? `${t.billing.trialEnds} 7 ${t.billing.daysLeft}.`
                        : `${t.billing.activeUntil}: ${sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd.toDate()).toLocaleDateString() : 'N/A'}`
                    }
                </p>
            </div>

            {/* Upgrade Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Individual Card */}
                <div className={`p-8 rounded-[2rem] border transition-all ${sub?.planId === 'individual' ? 'border-aura-cyan bg-aura-cyan/5' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                    <h4 className="text-xl font-display font-black text-white italic mb-4">INDIVIDUAL</h4>
                    <div className="text-3xl font-black text-white mb-6">$2.99 <span className="text-sm text-gray-500 font-medium">/ {t.billing.perMonth}</span></div>
                    <ul className="space-y-3 mb-8 text-sm text-gray-400">
                        <li className="flex items-center gap-2"> Full Module Access</li>
                        <li className="flex items-center gap-2"> 5 AI Actions / Day</li>
                        <li className="flex items-center gap-2"> Voice Control</li>
                    </ul>
                    <button
                        onClick={() => openCheckout('individual')}
                        disabled={sub?.planId === 'individual'}
                        className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${sub?.planId === 'individual'
                            ? 'bg-white/10 text-gray-500 cursor-default'
                            : 'bg-aura-cyan text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                            }`}
                    >
                        {sub?.planId === 'individual' ? (t.common.current || 'CURRENT') : sub?.planId === 'trial' ? t.billing.upgrade : t.billing.switch}
                    </button>
                </div>

                {/* Family Card */}
                <div className={`p-8 rounded-[2rem] border transition-all ${sub?.planId === 'family' ? 'border-aura-purple bg-aura-purple/5' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                    <h4 className="text-xl font-display font-black text-white italic mb-4">FAMILY</h4>
                    <div className="text-3xl font-black text-white mb-2">${familyPrice} <span className="text-sm text-gray-500 font-medium">/ {t.billing.perMonth}</span></div>

                    {/* Member Slider */}
                    <div className="mb-6 space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase">
                            <span>Members</span>
                            <span className="text-aura-purple">{memberCount} / 15</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="15"
                            value={memberCount}
                            onChange={(e) => setMemberCount(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-aura-purple"
                        />
                    </div>

                    <ul className="space-y-3 mb-8 text-sm text-gray-400">
                        <li className="flex items-center gap-2"> Up to 15 Members</li>
                        <li className="flex items-center gap-2"> Master Dashboard Control</li>
                        <li className="flex items-center gap-2"> Shared Legacy Storage</li>
                    </ul>
                    <button
                        onClick={() => openCheckout('family')}
                        disabled={sub?.planId === 'family'}
                        className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${sub?.planId === 'family'
                            ? 'bg-white/10 text-gray-500 cursor-default'
                            : 'bg-aura-purple text-white hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(188,0,255,0.3)]'
                            }`}
                    >
                        {sub?.planId === 'family' ? (t.common.current || 'CURRENT') : sub?.planId === 'trial' ? t.billing.upgrade : t.billing.switch}
                    </button>
                </div>

            </div>

            {/* Billing History (Mock) */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">{t.billing.history}</h3>
                <div className="text-center py-10 text-gray-600 text-sm italic">
                    {t.billing.noHistory}
                </div>
            </div>
        </div>
    );
}