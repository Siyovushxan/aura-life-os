"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    planName: string;
    amount: string;
}

export default function CheckoutModal({ isOpen, onClose, onConfirm, planName, amount }: CheckoutModalProps) {
    const { t } = useLanguage();
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handlePay = () => {
        setIsProcessing(true);
        // Simulate payment delay
        setTimeout(() => {
            setIsProcessing(false);
            onConfirm();
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <div className="p-8">
                    <h3 className="text-xl font-display font-black text-white italic mb-2 uppercase tracking-tight">
                        {t.billing.checkoutTitle}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        {planName} — <span className="text-white font-bold">${amount}</span>
                    </p>

                    <div className="space-y-4">
                        {/* Card Number */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.billing.cardNumber}</label>
                            <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="4444 4444 4444 4444"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-aura-cyan focus:outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Expiry */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.billing.expiry}</label>
                                <input
                                    type="text"
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="MM/YY"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-aura-cyan focus:outline-none transition-all"
                                />
                            </div>
                            {/* CVV */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.billing.cvv}</label>
                                <input
                                    type="password"
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    placeholder="***"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-aura-cyan focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center gap-2 py-4 text-xs text-gray-500 justify-center">
                            <span className="text-aura-green text-sm">🔒</span>
                            {t.billing.securePayment}
                        </div>

                        {/* Pay Button */}
                        <button
                            onClick={handlePay}
                            disabled={isProcessing || !cardNumber || !expiry || !cvv}
                            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${isProcessing
                                    ? 'bg-white/10 text-gray-500 animate-pulse'
                                    : 'bg-aura-cyan text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                                }`}
                        >
                            {isProcessing ? t.billing.processing : t.billing.payNow}
                        </button>
                    </div>
                </div>

                {/* Footer Logo Decoration */}
                <div className="h-2 bg-gradient-to-r from-aura-purple via-aura-cyan to-aura-green opacity-50" />
            </div>
        </div>
    );
}
