/**
 * Device Manager Utility
 * Quản lý audio/video devices
 */

/**
 * Load all available media devices
 */
export const loadMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    const videoInputs = devices.filter(d => d.kind === 'videoinput');
    
    return {
      audioDevices: audioInputs,
      videoDevices: videoInputs,
    };
  } catch (error) {
    console.error('[DeviceManager] Error loading devices:', error);
    return {
      audioDevices: [],
      videoDevices: [],
    };
  }
};

/**
 * Get device label with fallback
 */
export const getDeviceLabel = (device: MediaDeviceInfo, prefix: string = 'Device'): string => {
  return device.label || `${prefix} ${device.deviceId.slice(0, 5)}`;
};
