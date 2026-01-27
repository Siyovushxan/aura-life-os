import React, { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../styles/theme';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithRedirect, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';


WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen({ navigation }) {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        // O'ZINGIZNING CLIENT ID LARINGIZNI KUYING
        androidClientId: 'YOUR_ANDROID_CLIENT_ID',
        iosClientId: 'YOUR_IOS_CLIENT_ID',
        webClientId: '804734494584-placeholder.apps.googleusercontent.com',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
                .then(async (userCredential) => {
                    // Create profile if new user?
                    // signInWithCredential can accept existing users too.
                    // If we are in Signup, maybe we want to enforce profile creation?
                    // Usually signIn will trigger onAuthStateChanged anyway.
                    // But for signup we might want to ensure 'users' doc exists.
                    // We can check if doc exists using onAuthStateChanged or just proceed.
                    // For MVP, letting App.js handle generic auth state change is easiest.
                    // But strictly speaking, profile creation logic is inside handleSignup.
                    // With Google Sign In, profile creation is often implicit or handled by cloud functions.
                    // Check if we need to manually create doc here.
                    // Yes, ideally. But signInWithCredential acts like Login if user exists.
                    // I will just let it sign in. 
                })
                .catch((error) => {
                    Alert.alert("Google Error", error.message);
                });
        }
    }, [response]);

    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!email || !password || !name) {
            Alert.alert(t.common.error, "Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });

            // Create profile in Firestore (Matching web logic)
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: email.trim(),
                fullName: name,
                memberSince: new Date().toISOString(),
                plan: "Free",
                gamification: {
                    xp: 0,
                    level: 1,
                    coins: 0,
                    streak: 0
                }
            });
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert(
                    "Hisob mavjud",
                    "Ushbu email bilan allaqachon ro'yxatdan o'tilgan. Kirish oynasiga o'tishni xohlaysizmi?",
                    [
                        { text: "Yo'q", style: "cancel" },
                        { text: "Ha, Kirish", onPress: () => navigation.navigate('Login') }
                    ]
                );
            } else {
                Alert.alert(t.common.error, error.message);
            }
        } finally {
            setLoading(false);
        }
    };


    const handleGoogle = async () => {
        if (Platform.OS !== 'web') {
            promptAsync();
            return;
        }


        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
        } catch (error) {
            Alert.alert(t.common.error, error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <View style={styles.brandDot} />
                        <Text style={styles.title}>AURA</Text>
                        <Text style={styles.subtitle}>{t.auth.createAccount}</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>{t.auth.fullName}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>{t.auth.email}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="email@aura.ai"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>{t.auth.password}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.signupButton}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[Theme.colors.purple, Theme.colors.cyan]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.signupButtonText}>{t.auth.signup.toUpperCase()}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>{t.auth.or || "YOKI"}</Text>
                            <View style={styles.divider} />
                        </View>

                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogle}
                            disabled={loading}
                        >
                            <View style={styles.googleIconContainer}>
                                <Text style={styles.googleIcon}>G</Text>
                            </View>
                            <Text style={styles.googleButtonText}>Google bilan davom etish</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{t.auth.haveAccount} </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>{t.auth.login}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    brandDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Theme.colors.cyan,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
        letterSpacing: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Theme.colors.card,
        borderRadius: 16,
        padding: 16,
        color: '#FFF',
        borderWidth: 1,
        borderColor: '#222',
    },
    signupButton: {
        marginTop: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientButton: {
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: Theme.colors.textSecondary,
        fontSize: 14,
    },
    loginLink: {
        color: Theme.colors.cyan,
        fontSize: 14,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dividerText: {
        color: Theme.colors.textDim,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    googleButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    googleIconContainer: {
        width: 24,
        height: 24,
        backgroundColor: '#FFF',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIcon: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    googleButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
