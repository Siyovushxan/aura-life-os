"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { paymentService } from '@/services/paymentService';
import { StripePaymentWrapper } from './StripePaymentForm';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    planName: string;
    amount: string;
    planId: 'individual' | 'family';
}

type PaymentMethod = 'card' | 'click' | 'payme';

export default function CheckoutModal({ isOpen, onClose, onConfirm, planName, amount, planId }: CheckoutModalProps) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [method, setMethod] = useState<PaymentMethod>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    useEffect(() => {
        if (method === 'card' && user && isOpen) {
            loadStripeIntent();
        }
    }, [method, user, isOpen]);

    const loadStripeIntent = async () => {
        if (!user) return;
        setIsProcessing(true);
        setError(null);
        try {
            const numAmount = parseFloat(amount);
            const secret = await paymentService.createStripePaymentIntent(numAmount, user.uid, planId);
            if (secret) setClientSecret(secret);
            else setError('Failed to initialize Stripe');
        } catch (err) {
            setError('Payment initialization error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePay = async () => {
        if (method === 'click' && user) {
            window.location.href = paymentService.generateClickUrl(parseFloat(amount), user.uid, planId);
        } else if (method === 'payme' && user) {
            window.location.href = paymentService.generatePaymeUrl(parseFloat(amount), user.uid, planId);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-aura-purple/10 via-transparent to-cyan-500/10 pointer-events-none"></div>

            <div className="w-full max-w-xl bg-white/[0.03] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-gray-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center z-10 font-bold"
                >
                    ✕
                </button>

                <div className="p-10 md:p-14">
                    <div className="mb-10 text-center md:text-left">
                        <span className="text-[10px] font-black text-aura-purple uppercase tracking-[0.3em] mb-3 block">CHECKOUT PROCESS</span>
                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-3">
                            {t.billing.checkoutTitle || "TO'LOV MA'LUMOTLARI"}
                        </h3>
                        <p className="text-gray-400 text-lg">
                            {planName} — <span className="text-white font-black">${amount}</span>
                        </p>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        {[
                            { id: 'card', icon: '💳', label: 'CARD' },
                            { id: 'click', icon: '🔵', label: 'CLICK' },
                            { id: 'payme', icon: '💚', label: 'PAYME' }
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMethod(m.id as PaymentMethod)}
                                className={`p-6 rounded-[2rem] border transition-all duration-300 group flex flex-col items-center gap-2 ${method === m.id
                                        ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/30 shadow-xl scale-[1.05]'
                                        : 'bg-white/5 border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100">{m.icon}</div>
                                <div className="text-[10px] text-white font-black tracking-widest">{m.label}</div>
                            </button>
                        ))}
                    </div>

                    {/* Payment Form Container */}
                    <div className="bg-black/40 rounded-[2.5rem] p-8 border border-white/5 min-h-[200px] flex flex-col justify-center">
                        {method === 'card' ? (
                            <div className="animate-fade-in">
                                {isProcessing && !clientSecret && (
                                    <div className="py-12 text-center">
                                        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-aura-purple border-r-transparent mb-6 shadow-[0_0_20px_rgba(188,0,255,0.4)]"></div>
                                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">INITIALIZING STRIPE...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl mb-4 text-center">
                                        <p className="text-red-400 text-sm font-bold uppercase">{error}</p>
                                    </div>
                                )}

                                {clientSecret && !isProcessing && (
                                    <StripePaymentWrapper
                                        clientSecret={clientSecret}
                                        onSuccess={() => { onConfirm(); onClose(); }}
                                        onClose={onClose}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="text-center animate-fade-in py-6">
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/5 mb-8">
                                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                        {method === 'click' ? 'Click.uz' : 'Payme'} to'lov tizimi orqali xavfsiz to'lov sahifasiga yo'naltirilasiz.
                                    </p>
                                    <div className="text-6xl animate-bounce">
                                        {method === 'click' ? '🔵' : '💚'}
                                    </div>
                                </div>

                                <button
                                    onClick={handlePay}
                                    className="w-full px-8 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black rounded-3xl transition-all text-sm tracking-[0.2em] shadow-[0_20px_40px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 uppercase"
                                >
                                    PROCEED TO PAYMENT
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Security Badge */}
                    <div className="mt-10 flex items-center justify-center gap-3 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                        <span className="text-base text-aura-green">🛡️</span>
                        <span>{t.billing.securePayment || "100% SECURE ENCRYPTED PAYMENT"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
