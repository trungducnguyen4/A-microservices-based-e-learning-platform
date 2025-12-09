/**
 * LiveKit Service
 * Xử lý các API calls và operations liên quan đến LiveKit
 */

const CLASSROOM_SERVICE_URL = 'http://localhost:4000';

export interface TokenResponse {
  token: string;
  url: string;
  displayName: string;
  userInfo?: any;
}

export interface GetTokenParams {
  room: string;
  user: string;
  userId?: string;
  role?: string;
}

/**
 * Get LiveKit token từ ClassroomService
 * @param params - Parameters cho token request
 * @returns Promise với token và connection info
 */
export const getLivekitToken = async (params: GetTokenParams): Promise<TokenResponse> => {
  try {
    const queryParams = new URLSearchParams({
      room: params.room,
      user: params.user,
    });
    
    if (params.userId) {
      queryParams.append('userId', params.userId);
    }
    
    if (params.role) {
      queryParams.append('role', params.role);
    } else {
      queryParams.append('role', 'guest');
    }
    
    const resp = await fetch(`${CLASSROOM_SERVICE_URL}/getToken?${queryParams.toString()}`);
    
    if (!resp.ok) {
      throw new Error("Failed to get token from server");
    }
    
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error('[LivekitService] Error getting token:', error);
    throw new Error('Unable to get LiveKit token');
  }
};

/**
 * Save media preferences to localStorage
 */
export const saveMediaPreferences = (
  cameraEnabled: boolean,
  micEnabled: boolean,
  audioDeviceId?: string,
  videoDeviceId?: string
) => {
  localStorage.setItem("livekit-camera-enabled", cameraEnabled.toString());
  localStorage.setItem("livekit-mic-enabled", micEnabled.toString());
  
  if (audioDeviceId) {
    localStorage.setItem("livekit-selected-audio", audioDeviceId);
  }
  
  if (videoDeviceId) {
    localStorage.setItem("livekit-selected-video", videoDeviceId);
  }
};

/**
 * Load media preferences from localStorage
 */
export const loadMediaPreferences = () => {
  return {
    cameraEnabled: localStorage.getItem("livekit-camera-enabled") === "true",
    micEnabled: localStorage.getItem("livekit-mic-enabled") !== "false",
    audioDeviceId: localStorage.getItem("livekit-selected-audio") || undefined,
    videoDeviceId: localStorage.getItem("livekit-selected-video") || undefined,
  };
};
