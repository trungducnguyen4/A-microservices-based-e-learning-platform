/**
 * Service để lưu và lấy transcript từ ClassroomService
 */

import { TranscriptionSegment } from './groqService';

// Use API Gateway (consistent with other services)
const API_GATEWAY_BASE = import.meta.env.VITE_API_BASE || '/api';
const CLASSROOM_SERVICE_URL = `${API_GATEWAY_BASE}/classrooms`;

export interface SaveTranscriptResponse {
  success: boolean;
  message: string;
  data?: {
    saved: number;
  };
}

export interface GetTranscriptResponse {
  success: boolean;
  count: number;
  data: Array<{
    index: number;
    speakerIdentity: string | null;
    speakerName: string | null;
    text: string;
    timestamp: string;
    createdAt: string;
  }>;
}

/**
 * Lưu nhiều transcript segments vào database
 */
export const saveTranscriptSegments = async (
  roomCode: string,
  segments: TranscriptionSegment[]
): Promise<SaveTranscriptResponse> => {
  try {
      const response = await fetch(`${API_GATEWAY_BASE}/classrooms/transcript/save-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        segments: segments.map((seg, index) => ({
          index,
          text: seg.text,
          timestamp: seg.timestamp,
          speakerIdentity: null,
          speakerName: null,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save transcripts');
    }

    console.log(`[TranscriptService] ✅ Saved ${data.data?.saved || 0} segments for room ${roomCode}`);
    return data;
  } catch (error) {
    console.error('[TranscriptService] Error saving transcripts:', error);
    throw error;
  }
};

/**
 * Lấy transcript của một phòng từ database
 */
export const getTranscripts = async (roomCode: string): Promise<GetTranscriptResponse> => {
  try {
    const response = await fetch(`${API_GATEWAY_BASE}/classrooms/transcript/${roomCode}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get transcripts');
    }

    console.log(`[TranscriptService] 📖 Retrieved ${data.count} segments for room ${roomCode}`);
    return data;
  } catch (error) {
    console.error('[TranscriptService] Error getting transcripts:', error);
    throw error;
  }
};

/**
 * Xóa transcript của một phòng
 */
export const deleteTranscripts = async (roomCode: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_GATEWAY_BASE}/classrooms/transcript/${roomCode}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete transcripts');
    }

    console.log(`[TranscriptService] 🗑️ Deleted transcripts for room ${roomCode}`);
    return data;
  } catch (error) {
    console.error('[TranscriptService] Error deleting transcripts:', error);
    throw error;
  }
};
