"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    ConfirmationResult,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useRouter } from "next/navigation";
import { setDocument } from "@/services/db";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    signInWithPhone: (phone: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
    verifyOtp: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
    signInWithPhoneAndPass: (phone: string, pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to convert phone to virtual email
const phoneToEmail = (phone: string) => `${phone.replace(/\+/g, '')}@phone.aura.li`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
            // Only update if UID changed to prevent unnecessary re-renders
            setUser(prevUser => {
                if (prevUser?.uid === newUser?.uid && !!prevUser === !!newUser) return prevUser;
                console.log("Auth State Changed:", newUser ? newUser.email : "Guest");
                return newUser;
            });

            if (newUser) {
                // Background sync - don't block state update
                const syncProfile = async () => {
                    try {
                        await setDocument("users", newUser.uid, {
                            uid: newUser.uid,
                            email: newUser.email || "",
                            phoneNumber: newUser.phoneNumber || "",
                            fullName: newUser.displayName || "",
                            displayName: newUser.displayName || "",
                            photoURL: newUser.photoURL || "",
                            lastLogin: new Date().toISOString(),
                        });
                    } catch (err) {
                        console.error("Failed to sync profile:", err);
                    }
                };
                syncProfile();
            }

            setLoading(false);
        });

        // Handle redirect result on page load (Optional but good to keep)
        getRedirectResult(auth).then((result) => {
            if (result?.user) {
                console.log("Successfully logged in via redirect:", result.user.email);
            }
        }).catch((error) => {
            if (error.code !== 'auth/no-auth-event') {
                console.error('Redirect sign-in error:', error);
            }
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUp = async (email: string, pass: string) => {
        await createUserWithEmailAndPassword(auth, email, pass);
    };

    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

    const signInWithPhone = async (phone: string, recaptchaContainerId: string) => {
        try {
            // Cleanup existing verifier to prevent "reCAPTCHA has already been rendered in this element" or duplicate instances
            if (recaptchaVerifierRef.current) {
                try {
                    recaptchaVerifierRef.current.clear();
                    recaptchaVerifierRef.current = null;
                } catch (e) {
                    console.warn("Failed to clear previous reCAPTCHA instance:", e);
                }
            }

            // Clear the container manually just in case
            const container = document.getElementById(recaptchaContainerId);
            if (container) container.innerHTML = '';

            const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
                size: 'normal', // Use 'normal' (visible) for better reliability on localhost
            });
            recaptchaVerifierRef.current = recaptchaVerifier;

            const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
            return confirmationResult;
        } catch (error: any) {
            console.error("Phone Auth Error:", error.code, error.message);
            if (error.code === 'auth/invalid-app-credential') {
                throw new Error("reCAPTCHA xatosi. Iltimos sahifani yangilab qayta urinib ko'ring.");
            } else if (error.code === 'auth/operation-not-allowed') {
                throw new Error("Telefon orqali kirish yoqilmagan. Firebase Consolda uni yoqing.");
            } else if (error.code === 'auth/too-many-requests') {
                throw new Error("SMS yuborish limiti oshib ketdi. Biroz kuting yoki test raqamidan foydalaning.");
            } else if (error.code === 'auth/captcha-check-failed') {
                throw new Error("reCAPTCHA tekshiruvidan o'tib bo'lmadi. Qayta urinib ko'ring.");
            } else if (error.code === 'auth/invalid-phone-number') {
                throw new Error("Telefon raqami noto'g'ri formatda. Iltimos, +998... ko'rinishida to'liq kiriting.");
            }
            throw error;
        }
    };

    const verifyOtp = async (confirmationResult: ConfirmationResult, code: string) => {
        await confirmationResult.confirm(code);
    };

    const signInWithPhoneAndPass = async (phone: string, pass: string) => {
        const email = phoneToEmail(phone);
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const signInWithGoogle = async () => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        try {
            const { signInWithPopup } = await import('firebase/auth');
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            console.log("Google Sign-In Success:", result.user.email);
        } catch (error: any) {
            console.error('Google sign-in error:', error);
            if (error.code === 'auth/popup-blocked') {
                // Fallback to redirect if popup is blocked
                const provider = new GoogleAuthProvider();
                await signInWithRedirect(auth, provider);
            } else {
                throw error;
            }
        } finally {
            setIsAuthenticating(false);
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, logout, signInWithPhone, verifyOtp, signInWithPhoneAndPass }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
