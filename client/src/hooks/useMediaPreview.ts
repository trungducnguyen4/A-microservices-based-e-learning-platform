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
 * Tắt cam/mic thực sự bằng cách stop tracks (để tắt đèn laptop)
 */
export function useMediaPreview(options: UseMediaPreviewOptions) {
  const videoRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const cleanupInProgressRef = useRef(false);

  const cleanup = useCallback(() => {
    console.log('[useMediaPreview] Cleanup starting...');
    cleanupInProgressRef.current = true;
    
    // Stop video track
    if (videoTrackRef.current && videoTrackRef.current.readyState === 'live') {
      console.log('[useMediaPreview] Stopping video track');
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    
    // Stop audio track
    if (audioTrackRef.current && audioTrackRef.current.readyState === 'live') {
      console.log('[useMediaPreview] Stopping audio track');
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      console.log(`[useMediaPreview] Stopping ${tracks.length} remaining tracks`);
      
      tracks.forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      
      streamRef.current = null;
    }

    if (videoRef.current) {
      const videoElement = videoRef.current.querySelector('video');
      if (videoElement) {
        console.log('[useMediaPreview] Removing video element');
        videoElement.srcObject = null;
        videoElement.remove();
      }
    }
    
    cleanupInProgressRef.current = false;
    console.log('[useMediaPreview] Cleanup complete');
  }, []);

  const startPreview = useCallback(async () => {
    const { isCameraOn, isMicOn, selectedAudioDevice, selectedVideoDevice, onAudioTrack } = options;
    
    // Wait for cleanup to finish if in progress
    if (cleanupInProgressRef.current) {
      console.log('[useMediaPreview] Waiting for cleanup to finish...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Stop old tracks first
    if (videoTrackRef.current && videoTrackRef.current.readyState === 'live') {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current && audioTrackRef.current.readyState === 'live') {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    
    // Clear video element if camera is off
    if (!isCameraOn && videoRef.current) {
      const videoElement = videoRef.current.querySelector('video');
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
      }
    }
    
    // If both camera and mic are off, don't request anything
    if (!isCameraOn && !isMicOn) {
      console.log('[useMediaPreview] Both camera and mic OFF, skipping getUserMedia');
      return;
    }

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
      
      console.log('[useMediaPreview] Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log(`[useMediaPreview] Got stream with ${stream.getTracks().length} tracks`);
      
      // Store track references
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      if (videoTrack) {
        videoTrackRef.current = videoTrack;
        console.log(`[useMediaPreview] Video track: enabled=${videoTrack.enabled}, readyState=${videoTrack.readyState}`);
      }
      if (audioTrack) {
        audioTrackRef.current = audioTrack;
        console.log(`[useMediaPreview] Audio track: enabled=${audioTrack.enabled}, readyState=${audioTrack.readyState}`);
      }

      // Handle video track
      if (isCameraOn && videoRef.current && videoTrack) {
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true;
        videoElement.className = 'w-full h-full object-cover';
        videoElement.style.transform = 'scaleX(-1)'; // Mirror effect
        
        videoRef.current.innerHTML = '';
        videoRef.current.appendChild(videoElement);
        console.log('[useMediaPreview] Video element attached');
      }

      // Handle audio track
      if (isMicOn && onAudioTrack) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          onAudioTrack(audioTrack);
          console.log('[useMediaPreview] Audio track passed to callback');
        }
      }
    } catch (error) {
      console.error('[useMediaPreview] Failed to start media preview:', error);
    }
  }, [options, cleanup]);

  return {
    videoRef,
    startPreview,
    cleanup,
  };
}
