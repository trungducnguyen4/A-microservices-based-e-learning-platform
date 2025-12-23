/**
 * Custom Hook: useLeaveConfirmation
 * Quản lý confirmation dialog khi rời khỏi phòng họp
 */

import { useState } from 'react';

export interface UseLeaveConfirmationReturn {
  showLeaveDialog: boolean;
  setShowLeaveDialog: (show: boolean) => void;
  handleLeaveRequest: () => void;
  handleConfirmLeave: () => void;
  handleCancelLeave: () => void;
  pendingLeaveAction: (() => void) | null;
  isLeavingConfirmed: boolean;
}

export const useLeaveConfirmation = (onConfirmLeave: () => void): UseLeaveConfirmationReturn => {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);
  const [isLeavingConfirmed, setIsLeavingConfirmed] = useState(false);

  /**
   * Request to leave (show confirmation dialog)
   */
  const handleLeaveRequest = () => {
    setShowLeaveDialog(true);
  };

  /**
   * Confirm leave action
   */
  const handleConfirmLeave = () => {
    setShowLeaveDialog(false);
    setIsLeavingConfirmed(true); // Mark as confirmed to bypass beforeunload
    onConfirmLeave();
  };

  /**
   * Cancel leave action
   */
  const handleCancelLeave = () => {
    setShowLeaveDialog(false);
    setPendingLeaveAction(null);
  };

  return {
    showLeaveDialog,
    setShowLeaveDialog,
    handleLeaveRequest,
    handleConfirmLeave,
    handleCancelLeave,
    pendingLeaveAction,
    isLeavingConfirmed,
  };
};
