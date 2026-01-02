/**
 * LiveKit Service
 * Xử lý các API calls và operations liên quan đến LiveKit
 */

import { classroomService } from './classroomApi';

// Use API Gateway instead of direct connection
const API_GATEWAY_BASE = import.meta.env.VITE_API_BASE || '/api';
const CLASSROOM_SERVICE_URL = `${API_GATEWAY_BASE}/classrooms`;

export interface TokenResponse {
  token: string;
  url: string;
  displayName: string;
  userInfo?: any;
  isHost?: boolean;
}

export interface GetTokenParams {
  room: string;
  user: string;
  userId?: string;
  role?: string;
}

/**
 * Get LiveKit token từ ClassroomService via API Gateway
 * @param params - Parameters cho token request
 * @returns Promise với token và connection info
 */
export const getLivekitToken = async (params: GetTokenParams): Promise<TokenResponse> => {
  try {
    // Use classroomService which goes through API Gateway
    const data = await classroomService.getToken(
      params.room,
      params.user,
      params.userId,
      params.role
    );
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
