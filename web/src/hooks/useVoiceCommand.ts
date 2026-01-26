
import { useState, useRef } from 'react';
import { transcribeAudio, parseCommand } from '@/services/groqService';

export const useVoiceCommand = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setTranscript(''); // Clear previous
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = async (): Promise<any> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current) return resolve(null);

            mediaRecorderRef.current.onstop = async () => {
                setIsProcessing(true);
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // 1. Transcribe (Whisper)
                const text = await transcribeAudio(blob);
                setTranscript(text);

                // 2. Parse Intent (Llama 3)
                const intent = await parseCommand(text);

                setIsProcessing(false);
                setIsRecording(false);

                // Stop tracks
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                resolve({ text, intent });
            };

            mediaRecorderRef.current.stop();
        });
    };

    return {
        isRecording,
        isProcessing,
        transcript,
        startRecording,
        stopRecording
    };
};
