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
    let cancelled = false;

    const safeSetPermissions = (next: MediaPermissions) => {
      if (cancelled) return;
      setPermissions(prev => {
        if (
          prev.camera === next.camera &&
          prev.microphone === next.microphone &&
          prev.isChecking === next.isChecking
        ) {
          return prev;
        }
        return next;
      });
    };

    const check = async () => {
      const next = await checkPermissions();
      if (next) safeSetPermissions(next);
    };

    // Initial check
    void check();

    // Re-check when user returns to tab/app (mobile browsers especially)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void check();
    };
    const onFocus = () => void check();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const checkPermissions = async (): Promise<MediaPermissions | null> => {
    try {
      // Check if Permissions API is available
      if (!navigator.permissions) {
        if (import.meta.env.DEV) {
          console.warn('[useMediaPermissions] Permissions API not available');
        }

        // On some mobile browsers (notably iOS Safari), calling getUserMedia without
        // a user gesture can fail and can cause repeated prompts/errors if polled.
        // We keep state as 'prompt' here and only request via user action.
        return {
          camera: 'prompt',
          microphone: 'prompt',
          isChecking: false,
        };
      }

      // Query permissions
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (import.meta.env.DEV) {
        console.log('[useMediaPermissions] Permissions:', {
          camera: cameraPermission.state,
          microphone: micPermission.state,
        });
      }

      // Listen for permission changes
      cameraPermission.onchange = () => {
        setPermissions(prev => ({ ...prev, camera: cameraPermission.state }));
      };

      micPermission.onchange = () => {
        setPermissions(prev => ({ ...prev, microphone: micPermission.state }));
      };

      return {
        camera: cameraPermission.state,
        microphone: micPermission.state,
        isChecking: false,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[useMediaPermissions] Error checking permissions:', error);
      }

      // Avoid aggressive fallback checks; user-triggered requestPermissions is safer.
      return {
        camera: 'unknown',
        microphone: 'unknown',
        isChecking: false,
      };
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

      if (import.meta.env.DEV) {
        console.log('[useMediaPermissions] Permissions (fallback):', {
          camera: cameraState,
          microphone: micState,
        });
      }
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
      const next = await checkPermissions();
      if (next) setPermissions(next);
      
      return true;
    } catch (error) {
      console.error('[useMediaPermissions] Error requesting permissions:', error);
      const next = await checkPermissions();
      if (next) setPermissions(next);
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
