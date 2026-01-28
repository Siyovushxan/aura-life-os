"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmationResult } from "firebase/auth";

const phoneToEmail = (phone: string) => `${phone.replace(/\+/g, '')}@phone.aura.li`;

export default function LoginPage() {
    const { t } = useLanguage();
    const { signIn, signInWithGoogle, signInWithPhone, verifyOtp, signInWithPhoneAndPass } = useAuth();
    const router = useRouter();

    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
    const [phoneMode, setPhoneMode] = useState<'otp' | 'password'>('password');
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (loginMethod === 'email') {
                await signIn(email, pass);
                router.push("/dashboard");
            } else if (loginMethod === 'phone') {
                if (phoneMode === 'password') {
                    await signInWithPhoneAndPass(phone, pass);
                    router.push("/dashboard");
                } else {
                    // OTP Mode
                    if (!confirmationResult) {
                        const result = await signInWithPhone(phone, 'recaptcha-container');
                        setConfirmationResult(result);
                    } else {
                        await verifyOtp(confirmationResult, otp);
                        router.push("/dashboard");
                    }
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            setError("");
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const { user, loading: authLoading } = useAuth();

    React.useEffect(() => {
        if (user && !authLoading) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white relative overflow-hidden p-4">
            {/* Back Button */}
            <Link
                href="/"
                prefetch={false}
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-20 group"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                {t.common.back || 'Back'}
            </Link>

            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-aura-blue/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-aura-purple/20 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl z-10 shadow-2xl">
                <h1 className="text-4xl font-display font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">Welcome Back</h1>
                <p className="text-gray-400 text-center mb-10">Access your Life OS</p>

                {/* Login Method Toggle */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-8">
                    <button
                        onClick={() => { setLoginMethod('email'); setConfirmationResult(null); setError(""); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${loginMethod === 'email' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                    >
                        EMAIL
                    </button>
                    <button
                        onClick={() => { setLoginMethod('phone'); setConfirmationResult(null); setError(""); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${loginMethod === 'phone' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                    >
                        PHONE
                    </button>
                </div>

                {error && <div className="p-4 mb-6 rounded-2xl bg-aura-red/10 border border-aura-red/30 text-aura-red text-sm animate-shake">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {loginMethod === 'email' ? (
                        <>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-700 font-bold"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Password</label>
                                <input
                                    type={showPass ? "text" : "password"}
                                    required
                                    value={pass}
                                    onChange={(e) => setPass(e.target.value)}
                                    className="w-full p-4 pr-12 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-700 font-bold"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 bottom-4 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPass ? '👁️' : '🔒'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Phone Mode Sub-Toggle */}
                            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-4">
                                <button
                                    type="button"
                                    onClick={() => { setPhoneMode('password'); setConfirmationResult(null); }}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${phoneMode === 'password' ? 'bg-white/10 text-white' : 'text-gray-600'}`}
                                >
                                    WITH PASSWORD
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPhoneMode('otp'); setConfirmationResult(null); }}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${phoneMode === 'otp' ? 'bg-white/10 text-white' : 'text-gray-600'}`}
                                >
                                    WITH SMS (OTP)
                                </button>
                            </div>

                            {phoneMode === 'password' ? (
                                <>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-700 font-bold"
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Password</label>
                                        <input
                                            type={showPass ? "text" : "password"}
                                            required
                                            value={pass}
                                            onChange={(e) => setPass(e.target.value)}
                                            className="w-full p-4 pr-12 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-700 font-bold"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-4 bottom-4 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showPass ? '👁️' : '🔒'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {!confirmationResult ? (
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-700 font-bold"
                                                placeholder="+1 234 567 8900"
                                            />
                                            <p className="text-[10px] text-gray-600 mt-2 ml-1 italic">SMS will be sent for verification</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">OTP Code</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all text-center text-2xl tracking-[0.5em] font-black placeholder:text-gray-700"
                                                placeholder="000000"
                                            />
                                        </div>
                                    )}
                                    <div id="recaptcha-container"></div>
                                </>
                            )}
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-aura-cyan to-aura-blue text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (
                            loginMethod === 'email' ? 'Sign In' : (
                                phoneMode === 'password' ? 'Sign In' : (
                                    confirmationResult ? 'Verify & Sign In' : 'Send OTP Code'
                                )
                            )
                        )}
                    </button>
                </form>

                <div className="relative my-10 text-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <span className="relative px-6 bg-[#0a0a0a] text-[10px] uppercase tracking-widest text-gray-600">Secure Access</span>
                </div>

                <button onClick={handleGoogle} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 font-bold group">
                    <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-black text-xs font-black">G</span>
                    <span>Sign In with Google</span>
                </button>

                <p className="text-center mt-8 text-sm text-gray-500">
                    Don't have an account? <Link href="/register" prefetch={false} className="text-aura-cyan hover:text-white transition-colors font-medium">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
