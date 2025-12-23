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
        // Request permissions first - then IMMEDIATELY stop tracks
        console.log('[useMediaDevices] Requesting permission...');
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        
        // CRITICAL: Stop all tracks immediately after getting permission
        permissionStream.getTracks().forEach(track => {
          console.log(`[useMediaDevices] Stopping permission ${track.kind} track`);
          track.stop();
        });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const audio = devices.filter(d => d.kind === 'audioinput');
        const video = devices.filter(d => d.kind === 'videoinput');
        const audioOutput = devices.filter(d => d.kind === 'audiooutput');
        
        setAudioDevices(audio);
        setVideoDevices(video);
        setAudioOutputDevices(audioOutput);
        
        // Set defaults from localStorage or first device
        const savedAudio = localStorage.getItem('livekit-selected-audio');
        const savedVideo = localStorage.getItem('livekit-selected-video');
        const savedOutput = localStorage.getItem('livekit-selected-output');
        
        setSelectedAudioDevice(savedAudio || audio[0]?.deviceId || '');
        setSelectedVideoDevice(savedVideo || video[0]?.deviceId || '');
        setSelectedAudioOutput(savedOutput || audioOutput[0]?.deviceId || '');
      } catch (error) {
        console.error('Failed to enumerate devices:', error);
      }
    }

    loadDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

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
  };
}
