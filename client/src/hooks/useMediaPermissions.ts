import { useState, useEffect } from 'react';

export interface MediaPermissions {
  camera: PermissionState;
  microphone: PermissionState;
  isChecking: boolean;
}

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

/**
 * Hook để kiểm tra quyền truy cập camera và microphone
 * Giống như Google Meet - nếu không có quyền thì disable button
 */
export function useMediaPermissions() {
  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: 'unknown',
    microphone: 'unknown',
    isChecking: true,
  });

  useEffect(() => {
    checkPermissions();

    // Listen for permission changes (nếu user thay đổi trong browser settings)
    const interval = setInterval(checkPermissions, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkPermissions = async () => {
    try {
      // Check if Permissions API is available
      if (!navigator.permissions) {
        console.warn('[useMediaPermissions] Permissions API not available');
        // Fallback: Try to get media to test permissions
        await checkPermissionsViaGetUserMedia();
        return;
      }

      // Query permissions
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      setPermissions({
        camera: cameraPermission.state,
        microphone: micPermission.state,
        isChecking: false,
      });

      console.log('[useMediaPermissions] Permissions:', {
        camera: cameraPermission.state,
        microphone: micPermission.state,
      });

      // Listen for permission changes
      cameraPermission.onchange = () => {
        setPermissions(prev => ({
          ...prev,
          camera: cameraPermission.state,
        }));
      };

      micPermission.onchange = () => {
        setPermissions(prev => ({
          ...prev,
          microphone: micPermission.state,
        }));
      };
    } catch (error) {
      console.warn('[useMediaPermissions] Error checking permissions:', error);
      // Fallback: Try to get media to test permissions
      await checkPermissionsViaGetUserMedia();
    }
  };

  /**
   * Fallback method: Try to get media to test permissions
   * This is used when Permissions API is not available
   */
  const checkPermissionsViaGetUserMedia = async () => {
    try {
      // Try camera
      let cameraState: PermissionState = 'unknown';
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraStream.getTracks().forEach(track => track.stop());
        cameraState = 'granted';
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          cameraState = 'denied';
        } else if (err.name === 'NotFoundError') {
          cameraState = 'granted'; // Device not found, but permission is granted
        } else {
          cameraState = 'prompt';
        }
      }

      // Try microphone
      let micState: PermissionState = 'unknown';
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStream.getTracks().forEach(track => track.stop());
        micState = 'granted';
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          micState = 'denied';
        } else if (err.name === 'NotFoundError') {
          micState = 'granted'; // Device not found, but permission is granted
        } else {
          micState = 'prompt';
        }
      }

      setPermissions({
        camera: cameraState,
        microphone: micState,
        isChecking: false,
      });

      console.log('[useMediaPermissions] Permissions (fallback):', {
        camera: cameraState,
        microphone: micState,
      });
    } catch (error) {
      console.error('[useMediaPermissions] Error in fallback check:', error);
      setPermissions({
        camera: 'unknown',
        microphone: 'unknown',
        isChecking: false,
      });
    }
  };

  /**
   * Request permissions - sẽ prompt user nếu chưa có
   */
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Recheck permissions after request
      await checkPermissions();
      
      return true;
    } catch (error) {
      console.error('[useMediaPermissions] Error requesting permissions:', error);
      await checkPermissions();
      return false;
    }
  };

  return {
    ...permissions,
    requestPermissions,
    hasCameraPermission: permissions.camera === 'granted',
    hasMicrophonePermission: permissions.microphone === 'granted',
    isCameraDenied: permissions.camera === 'denied',
    isMicrophoneDenied: permissions.microphone === 'denied',
  };
}
