/**
 * Hook: useTranscription
 * Xử lý recording và transcription cho classroom
 * Sử dụng room persistence để lưu data khi user rời phòng
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Room } from 'livekit-client';
import { transcribeAudio, isGroqConfigured } from '@/services/groqService';
import { getRoomData, updateRoomData, initializeRoomData } from '@/utils/roomPersistence';

const MAX_RECORDING_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const CHUNK_DURATION = 30 * 1000; // Send to API every 30 seconds

export interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: string;
}

export interface UseTranscriptionReturn {
  isRecording: boolean;
  transcript: TranscriptionSegment[];
  recordingTime: number;
  totalUsedTime: number;
  remainingTime: number;
  maxTime: number;
  isProcessing: boolean;
  error: string | null;
  isConfigured: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
}

export const useTranscription = (room: Room | null, roomCode: string | null): UseTranscriptionReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptionSegment[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [totalUsedTime, setTotalUsedTime] = useState(0); // Tổng thời gian đã dùng (from room persistence)
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const isConfigured = isGroqConfigured();
  const remainingTime = MAX_RECORDING_TIME - totalUsedTime;

  /**
   * Initialize from room persistence on mount
   */
  useEffect(() => {
    if (!roomCode) return;

    // Load existing room data or initialize new one
    const roomData = initializeRoomData(roomCode);
    
    if (roomData) {
      setTotalUsedTime(roomData.totalUsedTime);
      setTranscript(roomData.transcript);
      console.log(`[Transcription] Loaded room data - Used: ${Math.floor(roomData.totalUsedTime / 60000)}m, Transcript: ${roomData.transcript.length} segments`);
    }
  }, [roomCode]);

  /**
   * Save to room persistence whenever totalUsedTime or transcript changes
   */
  useEffect(() => {
    if (!roomCode) return;

    updateRoomData(roomCode, {
      totalUsedTime,
      transcript,
    });
  }, [roomCode, totalUsedTime, transcript]);

  /**
   * Process audio chunks and send to Groq
   */
  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('[Transcription] Processing audio chunk:', audioBlob.size, 'bytes');
      
      const result = await transcribeAudio(audioBlob, {
        language: 'vi', // Vietnamese, can be changed to 'en' or removed for auto-detect
        temperature: 0,
        responseFormat: 'json',
      });

      if (result.text && result.text.trim()) {
        const segment: TranscriptionSegment = {
          id: `segment_${Date.now()}`,
          text: result.text.trim(),
          timestamp: new Date().toLocaleTimeString(),
        };

        setTranscript(prev => [...prev, segment]);
        console.log('[Transcription] Added segment:', segment.text);
      }
    } catch (err) {
      console.error('[Transcription] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Start recording audio from room
   */
  const startRecording = useCallback(() => {
    if (!room || !isConfigured) {
      setError('Room not connected or Groq not configured');
      return;
    }

    if (isRecording) return;
    
    // Kiểm tra còn thời gian không
    if (totalUsedTime >= MAX_RECORDING_TIME) {
      setError('Recording quota exhausted for this session (10 minutes total)');
      return;
    }

    try {
      // Get audio stream from room's local participant
      const audioTracks = Array.from(room.localParticipant.audioTrackPublications.values());
      
      if (audioTracks.length === 0) {
        setError('No audio track available. Please enable your microphone.');
        return;
      }

      const audioTrack = audioTracks[0].track;
      if (!audioTrack || !audioTrack.mediaStreamTrack) {
        setError('Audio track not available');
        return;
      }

      const stream = new MediaStream([audioTrack.mediaStreamTrack]);
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Process chunks periodically
      chunkTimerRef.current = setInterval(() => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          processAudioChunk(audioBlob);
        }
      }, CHUNK_DURATION);

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      
      setIsRecording(true);
      setError(null);
      startTimeRef.current = Date.now();

      // Update timer every second
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setRecordingTime(elapsed);

        // Auto-stop khi tổng thời gian vượt quota
        if (totalUsedTime + elapsed >= MAX_RECORDING_TIME) {
          console.log('[Transcription] Quota limit reached, stopping...');
          stopRecording();
        }
      }, 1000);

      console.log('[Transcription] Recording started, remaining quota:', Math.floor((MAX_RECORDING_TIME - totalUsedTime) / 60000), 'minutes');
    } catch (err) {
      console.error('[Transcription] Start error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [room, isRecording, isConfigured, processAudioChunk]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    // Cộng thời gian hiện tại vào tổng
    const currentElapsed = Date.now() - startTimeRef.current;
    setTotalUsedTime(prev => Math.min(prev + currentElapsed, MAX_RECORDING_TIME));

    // Clear timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Process remaining chunks
      setTimeout(() => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          processAudioChunk(audioBlob);
          audioChunksRef.current = [];
        }
      }, 100);
    }

    setIsRecording(false);
    setRecordingTime(0);
    console.log('[Transcription] Recording stopped. Total used:', Math.floor((totalUsedTime + currentElapsed) / 60000), 'minutes');
  }, [isRecording, processAudioChunk, totalUsedTime]);

  /**
   * Clear transcript (but keep totalUsedTime)
   */
  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setError(null);
    
    if (roomCode) {
      updateRoomData(roomCode, { transcript: [] });
    }
  }, [roomCode]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    transcript,
    recordingTime,
    totalUsedTime,
    remainingTime,
    maxTime: MAX_RECORDING_TIME,
    isProcessing,
    error,
    isConfigured,
    startRecording,
    stopRecording,
    clearTranscript,
  };
};
