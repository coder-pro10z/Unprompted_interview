import { useState, useRef, useEffect, useCallback } from 'react';

export function useSpeechSession({ speechDuration = 60, apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/review-speech' }) {
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'recording' | 'processing' | 'review'
  const [timeRemaining, setTimeRemaining] = useState(speechDuration);
  const [videoStream, setVideoStream] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Initialize camera and microphone
  const startRecording = useCallback(async (topic, enableAiReview = true, contextMode = 'general') => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });

      setVideoStream(stream);
      setSessionState('recording');
      setTimeRemaining(speechDuration);

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
        setVideoStream(null);

        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedUrl(URL.createObjectURL(videoBlob));
        
        if (!enableAiReview) {
          setSessionState('review');
          return;
        }

        setSessionState('processing');

        // Send to backend
        const formData = new FormData();
        formData.append('media', videoBlob, 'speech.webm');
        formData.append('topic', topic);
        formData.append('durationSeconds', speechDuration);
        formData.append('contextMode', contextMode);

        try {
          const res = await fetch(apiUrl, { method: 'POST', body: formData });
          const feedback = await res.json();
          setAiFeedback(feedback);
          setSessionState('review');
        } catch (err) {
          console.error(err);
          setSessionState('idle');
        }
      };

      recorder.start(1000);

      // Start countdown
      const endTime = Date.now() + speechDuration * 1000;
      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          recorder.stop();
        }
      }, 100);
    } catch (err) {
      console.error('Camera/Mic permission denied:', err);
    }
  }, [speechDuration, apiUrl]);

  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetSession = useCallback(() => {
    stopRecording();
    setSessionState('idle');
    setAiFeedback(null);
    setRecordedUrl(null);
    setTimeRemaining(speechDuration);
  }, [stopRecording, speechDuration]);

  return {
    sessionState,
    timeRemaining,
    videoStream,
    recordedUrl,
    aiFeedback,
    startRecording,
    stopRecording,
    resetSession,
  };
}
