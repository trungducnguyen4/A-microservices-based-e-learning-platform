import { useState, useEffect } from 'react';
import { loadMediaDevices } from '@/utils/deviceManager';
import { loadMediaPreferences, saveMediaPreferences } from '@/services/livekitService';

/**
 * Hook để quản lý danh sách thiết bị media (mic, camera, speaker)
 */
export function useMediaDevices() {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');

  useEffect(() => {
    async function loadDevices() {
      try {
        // Try to request permissions first - but handle denial gracefully
        try {
          console.log('[useMediaDevices] Requesting permission...');
          const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          
          // CRITICAL: Stop all tracks immediately after getting permission
          permissionStream.getTracks().forEach(track => {
            console.log(`[useMediaDevices] Stopping permission ${track.kind} track`);
            track.stop();
          });
        } catch (permError: any) {
          // Permission denied - that's OK, we can still enumerate devices (they'll just have generic labels)
          console.warn('[useMediaDevices] ⚠️ Permission denied, will enumerate devices without labels:', permError.name);
        }
        
        // Enumerate devices (works even without permission, just no labels)
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Filter out devices with empty deviceId (can happen when permission denied)
        const audio = devices.filter(d => d.kind === 'audioinput' && d.deviceId && d.deviceId.trim() !== '');
        const video = devices.filter(d => d.kind === 'videoinput' && d.deviceId && d.deviceId.trim() !== '');
        const audioOutput = devices.filter(d => d.kind === 'audiooutput' && d.deviceId && d.deviceId.trim() !== '');
        
        setAudioDevices(audio);
        setVideoDevices(video);
        setAudioOutputDevices(audioOutput);
        
        // Set defaults from localStorage or first device (only if valid deviceId exists)
        const savedAudio = localStorage.getItem('livekit-selected-audio');
        const savedVideo = localStorage.getItem('livekit-selected-video');
        // KHÔNG lưu speaker vào localStorage - luôn reset về default khi reload
        
        // Only set if we have valid devices, otherwise set to empty string (safe fallback)
        setSelectedAudioDevice((savedAudio && audio.some(d => d.deviceId === savedAudio)) ? savedAudio : (audio[0]?.deviceId || ''));
        setSelectedVideoDevice((savedVideo && video.some(d => d.deviceId === savedVideo)) ? savedVideo : (video[0]?.deviceId || ''));
        setSelectedAudioOutput(audioOutput[0]?.deviceId || ''); // Always use default speaker
      } catch (error) {
        console.error('[useMediaDevices] Failed to enumerate devices:', error);
        // Set empty arrays on complete failure
        setAudioDevices([]);
        setVideoDevices([]);
        setAudioOutputDevices([]);
      }
    }

    loadDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  // Reset to default devices (first device in each list)
  const resetToDefaults = () => {
    const defaultAudio = audioDevices[0]?.deviceId || '';
    const defaultVideo = videoDevices[0]?.deviceId || '';
    const defaultOutput = audioOutputDevices[0]?.deviceId || '';
    
    setSelectedAudioDevice(defaultAudio);
    setSelectedVideoDevice(defaultVideo);
    setSelectedAudioOutput(defaultOutput);
    
    // Clear localStorage
    localStorage.removeItem('livekit-selected-audio');
    localStorage.removeItem('livekit-selected-video');
    localStorage.removeItem('livekit-selected-output');
    
    console.log('[useMediaDevices] Reset to defaults:', { defaultAudio, defaultVideo, defaultOutput });
  };

  return {
    audioDevices,
    videoDevices,
    audioOutputDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    selectedAudioOutput,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
    setSelectedAudioOutput,
    resetToDefaults,
  };
}
