/**
 * Custom Hook: useMeeting
 * Quản lý state và logic cho meeting operations
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomCode } from '@/utils/roomCodeGenerator';
import { 
  checkRoomExists, 
  validateRoomCodeFormat, 
  cleanRoomCode 
} from '@/services/meetingService';
import { classroomService } from '@/services/classroomApi';

export interface UseMeetingReturn {
  // State
  joinCode: string;
  isCreating: boolean;
  isJoining: boolean;
  joinError: string;
  showConfirmDialog: boolean;
  pendingRoomCode: string;
  
  // Actions
  setJoinCode: (code: string) => void;
  handleNewMeeting: () => void;
  handleConfirmCreateMeeting: () => void;
  handleJoinMeeting: () => Promise<void>;
  handleInstantMeeting: () => void;
  setShowConfirmDialog: (show: boolean) => void;
  clearJoinError: () => void;
}

export const useMeeting = (): UseMeetingReturn => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRoomCode, setPendingRoomCode] = useState("");

  /**
   * Xử lý tạo meeting mới
   */
  const handleNewMeeting = () => {
    const roomCode = generateRoomCode();
    console.log('[useMeeting] Generated room code:', roomCode);
    setPendingRoomCode(roomCode);
    setShowConfirmDialog(true);
  };

  /**
   * Confirm và redirect vào classroom
   */
  const handleConfirmCreateMeeting = async () => {
    setIsCreating(true);
    setShowConfirmDialog(false);
    
    try {
      // Get user info from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || user?.email || `user_${Date.now()}`;
      
      console.log('[useMeeting] Creating room:', pendingRoomCode, 'for userId:', userId);
      
      // Create room với userId của người tạo
      await classroomService.createRoom(pendingRoomCode, userId);
      console.log('[useMeeting] ✅ Room created successfully as host');
    } catch (error) {
      console.log('[useMeeting] Room creation error (will auto-create):', error);
      // Ignore error - backend sẽ auto-create nếu cần
    }
    
    // Navigate to classroom
    navigate(`/classroom?room=${pendingRoomCode}`, { replace: true });
  };

  /**
   * Xử lý join meeting với validation
   */
  const handleJoinMeeting = async () => {
    // Validate input
    if (!joinCode.trim()) {
      setJoinError("Please enter a meeting code");
      return;
    }
    
    // Clean và format code
    const cleanCode = cleanRoomCode(joinCode);
    console.log('[useMeeting] Validating room code:', cleanCode);
    
    setIsJoining(true);
    setJoinError("");
    
    try {
      // Validate format
      if (!validateRoomCodeFormat(cleanCode)) {
        setJoinError("Invalid room code format. Expected format: XXX-YYYY-ZZZ");
        setIsJoining(false);
        return;
      }
      
      // Check room exists
      const data = await checkRoomExists(cleanCode);
      
      if (!data.exists) {
        setJoinError("Meeting room not found. Please check the code and try again.");
        setIsJoining(false);
        return;
      }
      
      // Room exists, navigate to PreJoin (replace history)
      navigate(`/prejoin?room=${cleanCode}`, { replace: true });
    } catch (error) {
      console.error('[useMeeting] Error validating room:', error);
      setJoinError("Unable to verify meeting room. Please try again.");
      setIsJoining(false);
    }
  };

  /**
   * Tạo và start instant meeting
   */
  const handleInstantMeeting = () => {
    const roomCode = generateRoomCode();
    console.log('[useMeeting] Starting instant meeting:', roomCode);
    setPendingRoomCode(roomCode);
    setShowConfirmDialog(true);
  };

  /**
   * Clear join error
   */
  const clearJoinError = () => {
    setJoinError("");
  };

  return {
    // State
    joinCode,
    isCreating,
    isJoining,
    joinError,
    showConfirmDialog,
    pendingRoomCode,
    
    // Actions
    setJoinCode,
    handleNewMeeting,
    handleConfirmCreateMeeting,
    handleJoinMeeting,
    handleInstantMeeting,
    setShowConfirmDialog,
    clearJoinError,
  };
};
