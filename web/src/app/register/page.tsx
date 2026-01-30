"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setDocument } from "@/services/db";
import { ConfirmationResult } from "firebase/auth";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const phoneToEmail = (phone: string) => `${phone.replace(/\+/g, '')}@phone.aura.li`;

export default function RegisterPage() {
    const { t } = useLanguage();
    const { signUp, signInWithGoogle, signInWithPhone, verifyOtp } = useAuth();
    const router = useRouter();

    const [registrationMethod, setRegistrationMethod] = useState<'email' | 'phone'>('email');
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const normalizePhone = (p: string) => {
        let clean = p.replace(/\D/g, ''); // Remove non-digits
        if (clean.length === 9) clean = '998' + clean; // For UZ: 9 digits -> +998...
        return clean ? '+' + clean : p;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!fullName.trim()) {
            setError(t.auth.setError);
            setLoading(false);
            return;
        }

        try {
            if (registrationMethod === 'email') {
                await signUp(email, pass);
                const { getAuth } = await import('firebase/auth');
                const auth = getAuth();
                const newUser = auth.currentUser;
                if (newUser) {
                    await setDocument("users", newUser.uid, {
                        uid: newUser.uid,
                        email: email,
                        fullName: fullName.trim(),
                        displayName: fullName.trim(),
                        memberSince: new Date().toISOString(),
                        plan: "Free"
                    });
                }
                router.push("/dashboard");
            } else if (registrationMethod === 'phone' && !confirmationResult) {
                // First step: Send OTP
                if (!pass || pass.length < 6) {
                    setError("Iltimos, xavfsiz parol kiriting (kamida 6 ta belgi)");
                    setLoading(false);
                    return;
                }

                const normalizedPhone = normalizePhone(phone);
                console.log("[Register] Sending OTP to:", normalizedPhone);
                const result = await signInWithPhone(normalizedPhone, 'recaptcha-container');
                setConfirmationResult(result);
            } else if (registrationMethod === 'phone' && confirmationResult) {
                // Second step: Verify OTP
                await verifyOtp(confirmationResult, otp);

                const { getAuth, signOut } = await import('firebase/auth');
                const auth = getAuth();
                const phoneUser = auth.currentUser;
                const verifiedPhone = phoneUser?.phoneNumber || normalizePhone(phone);

                await signOut(auth);

                // Create the real account using virtual email + provided password
                const virtualEmail = phoneToEmail(verifiedPhone);
                await signUp(virtualEmail, pass);

                const newUser = auth.currentUser;
                if (newUser) {
                    await setDocument("users", newUser.uid, {
                        uid: newUser.uid,
                        phoneNumber: verifiedPhone,
                        email: virtualEmail,
                        fullName: fullName.trim(),
                        displayName: fullName.trim(),
                        memberSince: new Date().toISOString(),
                        plan: "Free"
                    });
                }
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            await signInWithGoogle();
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const googleUser = auth.currentUser;
            if (googleUser) {
                await setDocument("users", googleUser.uid, {
                    uid: googleUser.uid,
                    email: googleUser.email || "",
                    fullName: googleUser.displayName || "",
                    displayName: googleUser.displayName || "",
                    photoURL: googleUser.photoURL || "",
                    memberSince: new Date().toISOString(),
                    plan: "Free"
                });
            }
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white relative overflow-hidden p-4 font-sans">
            <LanguageSwitcher />

            {/* Back Button */}
            <Link
                href="/"
                prefetch={false}
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-20 group"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                {t.auth.back}
            </Link>

            {/* Background Effects */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-aura-cyan/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-aura-gold/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl z-20 shadow-2xl relative">
                <h1 className="text-4xl font-display font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                    {t.auth.joinAura}
                </h1>
                <p className="text-gray-400 text-center mb-10">{t.auth.beginJourney}</p>

                {/* Registration Method Toggle */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-8">
                    <button
                        onClick={() => { setRegistrationMethod('email'); setConfirmationResult(null); setError(""); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${registrationMethod === 'email' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                    >
                        {t.auth.email}
                    </button>
                    <button
                        onClick={() => { setRegistrationMethod('phone'); setConfirmationResult(null); setError(""); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${registrationMethod === 'phone' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                    >
                        {t.auth.phone}
                    </button>
                </div>

                {error && <div className="p-4 mb-6 rounded-2xl bg-aura-red/10 border border-aura-red/30 text-aura-red text-sm animate-shake">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2 ml-1">{t.auth.fullName}</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-500 font-bold text-white"
                            placeholder={t.auth.fullNamePlaceholder}
                        />
                    </div>

                    {registrationMethod === 'email' ? (
                        <>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2 ml-1">{t.auth.email}</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-500 font-bold text-white"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2 ml-1">{t.auth.password}</label>
                                <input
                                    type={showPass ? "text" : "password"}
                                    required
                                    value={pass}
                                    onChange={(e) => setPass(e.target.value)}
                                    className="w-full p-4 pr-12 rounded-2xl bg-black/40 border border-white/10 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-500 font-bold text-white"
                                    placeholder={t.auth.passwordPlaceholder}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 bottom-4 text-gray-500 hover:text-white transition-colors z-10"
                                >
                                    {showPass ? '👁️' : '🔒'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {!confirmationResult ? (
                                <>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2 ml-1">{t.auth.phone}</label>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-500 font-bold text-white"
                                            placeholder={t.auth.phonePlaceholder}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2 ml-1 italic">{t.auth.countryCodeNotice}</p>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2 ml-1">{t.auth.setPass}</label>
                                        <input
                                            type={showPass ? "text" : "password"}
                                            required
                                            value={pass}
                                            onChange={(e) => setPass(e.target.value)}
                                            className="w-full p-4 pr-12 rounded-2xl bg-black/40 border border-white/10 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-500 font-bold text-white"
                                            placeholder={t.auth.passwordPlaceholder}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-4 bottom-4 text-gray-500 hover:text-white transition-colors z-10"
                                        >
                                            {showPass ? '👁️' : '🔒'}
                                        </button>
                                    </div>
                                    <div id="recaptcha-container"></div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2 ml-1">{t.auth.otpCode}</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 focus:border-aura-cyan/50 focus:outline-none transition-all text-center text-2xl tracking-[0.5em] font-black placeholder:text-gray-700 text-white"
                                        placeholder="000000"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setConfirmationResult(null); setOtp(""); }}
                                        className="text-[10px] text-aura-cyan hover:text-white mt-2 ml-1 uppercase tracking-widest transition-colors"
                                    >
                                        {t.auth.changeNumber}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-aura-cyan to-aura-blue text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50"
                    >
                        {loading ? t.auth.processing : (registrationMethod === 'email' ? t.auth.createAccount : (confirmationResult ? t.auth.verifyAndJoin : t.auth.sendOtp))}
                    </button>
                </form>

                <div className="relative my-10 text-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <span className="relative px-6 bg-[#0a0a0a] text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t.auth.secureRegistration}</span>
                </div>

                <button onClick={handleGoogle} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 font-bold group">
                    <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-black text-xs font-black">G</span>
                    <span>{t.auth.signUpGoogle}</span>
                </button>

                <p className="text-center mt-8 text-sm text-gray-500">
                    {t.auth.haveAccount} <Link href="/login" prefetch={false} className="text-aura-cyan hover:text-white transition-colors font-medium">{t.auth.signIn}</Link>
                </p>
            </div>
        </div>
    );
}
