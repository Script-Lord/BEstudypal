'use client';
import { useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';

export function useVoiceInput() {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise(resolve => {
      const rec = recorderRef.current;
      if (!rec || rec.state === 'inactive') {
        resolve(null);
        return;
      }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        chunksRef.current = [];
        recorderRef.current = null;
        resolve(blob.size > 0 ? blob : null);
      };
      rec.stop();
      rec.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    });
  }, []);

  const toggleRecording = useCallback(async (onResult: (text: string) => void) => {
    setError(null);

    if (recording) {
      const blob = await stopRecording();
      if (!blob) {
        setError('No audio captured');
        return;
      }
      setTranscribing(true);
      try {
        const { text } = await api.transcribeAudio(blob);
        const trimmed = text.trim();
        if (!trimmed) {
          setError("Couldn't hear anything — try again");
          return;
        }
        onResult(trimmed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Transcription failed');
      } finally {
        setTranscribing(false);
      }
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      rec.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      setError('Microphone access denied');
    }
  }, [recording, stopRecording]);

  const clearError = useCallback(() => setError(null), []);

  return { recording, transcribing, error, toggleRecording, clearError };
}
