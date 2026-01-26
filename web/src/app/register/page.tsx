"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setDocument } from "@/services/db";

export default function RegisterPage() {
    const { t } = useLanguage();
    const { signUp, signInWithGoogle, user } = useAuth();
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState("");
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) {
            setError("Iltimos, to'liq ismingizni kiriting");
            return;
        }
        try {
            await signUp(email, pass);
            // Save the full name to Firestore immediately after signup
            // We need to get the user ID from Firebase Auth
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
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogle = async () => {
        try {
            const result = await signInWithGoogle();
            // Save Google displayName to Firestore
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
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-aura-cyan/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-aura-gold/20 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl z-10 shadow-2xl">
                <h1 className="text-4xl font-display font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">Join AURA</h1>
                <p className="text-gray-400 text-center mb-10">Begin your Life OS journey</p>

                {error && <div className="p-4 mb-6 rounded-2xl bg-aura-red/10 border border-aura-red/30 text-aura-red text-sm animate-shake">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">To'liq Ism / Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-700"
                            placeholder="Ism Familiya"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-700"
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
                            className="w-full p-4 pr-12 rounded-2xl bg-black/40 border border-white/5 focus:border-aura-cyan/50 focus:outline-none transition-all placeholder:text-gray-700"
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

                    <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-aura-cyan to-aura-blue text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                        Create Account
                    </button>
                </form>

                <div className="relative my-10 text-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <span className="relative px-6 bg-[#0a0a0a] text-[10px] uppercase tracking-widest text-gray-600">Secure Registration</span>
                </div>

                <button onClick={handleGoogle} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 font-bold group">
                    <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-black text-xs">G</span>
                    <span>Sign Up with Google</span>
                </button>

                <p className="text-center mt-8 text-sm text-gray-500">
                    Already have an account? <Link href="/login" prefetch={false} className="text-aura-cyan hover:text-white transition-colors font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
