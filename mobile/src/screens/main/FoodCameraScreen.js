import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../../styles/theme';
import { analyzeImage } from '../../services/groqService';
import { useLanguage } from '../../context/LanguageContext';

export default function FoodCameraScreen({ navigation }) {
    const { t } = useLanguage();
    const [permission, requestPermission] = useCameraPermissions();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const cameraRef = useRef(null);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Kameraga ruxsat kerak</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                    <Text style={styles.permissionButtonText}>RUXSAT BERISH</Text>
                </TouchableOpacity>
            </View>
        );
    }

    async function takePicture() {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ base64: true });
                setCapturedImage(photo.uri);
                processImage(photo.base64);
            } catch (e) {
                Alert.alert("Xatolik", "Rasmga olishda xatolik yuz berdi");
            }
        }
    }

    async function processImage(base64) {
        setIsAnalyzing(true);
        try {
            const result = await analyzeImage(base64, 'uz');
            if (result && result.success) {
                Alert.alert(
                    "Oziqlanish Tahlili",
                    `${result.title}\n\n${result.insight}`,
                    [{ text: "OK", onPress: () => setCapturedImage(null) }]
                );
            } else {
                Alert.alert("Xatolik", "AI tahlil qila olmadi");
                setCapturedImage(null);
            }
        } catch (e) {
            Alert.alert("Xatolik", "Tizim ulanishida xato");
            setCapturedImage(null);
        } finally {
            setIsAnalyzing(false);
        }
    }

    return (
        <View style={styles.container}>
            {capturedImage ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: capturedImage }} style={styles.preview} />
                    {isAnalyzing && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={Theme.colors.cyan} />
                            <Text style={styles.loadingText}>{t.food.analyzing}</Text>
                        </View>
                    )}
                </View>
            ) : (
                <CameraView style={styles.camera} ref={cameraRef}>
                    <View style={styles.overlay}>
                        <View style={styles.targetFrame} />
                        <Text style={styles.guideText}>{t.food.camera}</Text>
                    </View>
                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            )}

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    targetFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: Theme.colors.cyan,
        borderRadius: 40,
        backgroundColor: 'transparent',
    },
    guideText: {
        color: '#FFF',
        marginTop: 24,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    controls: {
        position: 'absolute',
        bottom: 60,
        width: '100%',
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Theme.colors.cyan,
    },
    previewContainer: {
        flex: 1,
    },
    preview: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: Theme.colors.cyan,
        marginTop: 20,
        fontWeight: '900',
        letterSpacing: 2,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        color: '#FFF',
        fontSize: 18,
    },
    message: {
        textAlign: 'center',
        color: '#FFF',
        paddingHorizontal: 40,
        marginTop: 100,
    },
    permissionButton: {
        backgroundColor: Theme.colors.cyan,
        padding: 20,
        borderRadius: 16,
        alignSelf: 'center',
        marginTop: 20,
    },
    permissionButtonText: {
        color: '#000',
        fontWeight: 'bold',
    }
});
