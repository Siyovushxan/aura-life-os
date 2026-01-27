import React, { useState } from 'react';
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
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../styles/theme';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginScreen({ navigation }) {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Xatolik", "Email va parolni kiriting");
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Auth state listener in App.js will handle navigation
        } catch (error) {
            Alert.alert("Xatolik", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        console.log("Starting Google Login via Popup...");
        try {
            const provider = new GoogleAuthProvider();
            // Force select account to ensure prompt appears
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await signInWithPopup(auth, provider);
            console.log("Login Success:", result.user.email);
        } catch (error) {
            console.error("Google Auth Error:", error.code, error.message);
            Alert.alert("Xatolik", "Google orqali kirishda muammo yuz berdi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <View style={styles.brandContainer}>
                        <View style={styles.brandDot} />
                        <Text style={styles.brandText}>AURA</Text>
                    </View>
                    <Text style={styles.title}>{t.auth.welcome}</Text>
                    <Text style={styles.subtitle}>{t.auth.continueEvolution}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{t.auth.email}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="email@aura.ai"
                            placeholderTextColor={Theme.colors.textDim}
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
                            placeholderTextColor={Theme.colors.textDim}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[Theme.colors.cyan, Theme.colors.purple]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.loginButtonText}>KIRISH</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>YOKI</Text>
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
                        <Text style={styles.googleButtonText}>Google bilan kirish</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Hisobingiz yo'qmi? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.signupLink}>Ro'yxatdan o'tish</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 48,
        alignItems: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    brandDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Theme.colors.cyan,
    },
    brandText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
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
    loginButton: {
        marginTop: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientButton: {
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
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
    signupLink: {
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
