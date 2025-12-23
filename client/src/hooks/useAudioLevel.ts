import { useState, useRef, useCallback } from 'react';

/**
 * Hook để monitor audio level từ MediaStreamTrack
 */
export function useAudioLevel() {
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startMonitoring = useCallback((track: MediaStreamTrack) => {
    try {
      // Stop existing monitoring
      stopMonitoring();

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(new MediaStream([track]));
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      function updateLevel() {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        const percentage = Math.min(100, (average / 255) * 100);
        
        setAudioLevel(percentage);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }

      updateLevel();
    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  return {
    audioLevel,
    startMonitoring,
    stopMonitoring,
  };
}
