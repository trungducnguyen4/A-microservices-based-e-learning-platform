import { useRef, useCallback } from 'react';

interface UseMediaPreviewOptions {
  isCameraOn: boolean;
  isMicOn: boolean;
  selectedAudioDevice: string;
  selectedVideoDevice: string;
  onAudioTrack?: (track: MediaStreamTrack) => void;
}

/**
 * Hook để quản lý video/audio preview
 */
export function useMediaPreview(options: UseMediaPreviewOptions) {
  const videoRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      const videoElement = videoRef.current.querySelector('video');
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
      }
    }
  }, []);

  const startPreview = useCallback(async () => {
    const { isCameraOn, isMicOn, selectedAudioDevice, selectedVideoDevice, onAudioTrack } = options;

    cleanup();

    try {
      const constraints: MediaStreamConstraints = {
        audio: isMicOn ? {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
        } : false,
        video: isCameraOn ? {
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Handle video track
      if (isCameraOn && videoRef.current) {
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true;
        videoElement.className = 'w-full h-full object-cover';
        videoElement.style.transform = 'scaleX(-1)'; // Mirror effect
        
        videoRef.current.innerHTML = '';
        videoRef.current.appendChild(videoElement);
      }

      // Handle audio track
      if (isMicOn && onAudioTrack) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          onAudioTrack(audioTrack);
        }
      }
    } catch (error) {
      console.error('Failed to start media preview:', error);
    }
  }, [options, cleanup]);

  return {
    videoRef,
    startPreview,
    cleanup,
  };
}
