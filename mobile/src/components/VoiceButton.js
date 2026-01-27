import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Audio } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { Theme } from '../styles/theme';
import { transcribeAudio, parseCommand } from '../services/groqService';

export default function VoiceButton({ module = 'home', onCommand, color = Theme.colors.purple }) {
    const [recording, setRecording] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
        };
    }, [recording]);

    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert("Xatolik", "Mikrofonga ruxsat berilmagan");
                return;
            }

            const recording = await Audio.recordAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!recording) return;

        setRecording(undefined);
        setIsRecording(false);
        setIsProcessing(true);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            // Convert to Base64
            const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const transcript = await transcribeAudio(base64Audio, 'uz', module);

            if (transcript.startsWith("ERROR:")) {
                Alert.alert("Xatolik", transcript);
            } else {
                const command = await parseCommand(transcript, module);
                onCommand(command);
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
            Alert.alert("Xatolik", "Ovozni qayta ishlashda xatolik yuz berdi");
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={isProcessing}
            style={[
                styles.button,
                { backgroundColor: isRecording ? Theme.colors.red : 'rgba(255,255,255,0.05)' },
                isRecording && styles.buttonActive
            ]}
        >
            <View style={styles.glow} />
            {isProcessing ? (
                <ActivityIndicator color={Theme.colors.cyan} />
            ) : (
                <Text style={[styles.emoji, { color: isRecording ? '#FFF' : color }]}>
                    {isRecording ? "🔴" : "🎙️"}
                </Text>
            )}
            {isRecording && <View style={styles.pulseRing} />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    buttonActive: {
        borderColor: Theme.colors.red,
        shadowColor: Theme.colors.red,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    emoji: {
        fontSize: 20,
    },
    glow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    pulseRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 45, 85, 0.3)',
        // No native infinite animation without Animated/Reanimated, keeping it simple for now
    }
});
