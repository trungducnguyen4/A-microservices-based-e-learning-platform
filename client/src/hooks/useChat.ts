/**
 * Custom Hook: useChat
 * Quản lý chat messages và hand raise notifications
 */

import { useState, useRef, useEffect } from 'react';
import { Room } from 'livekit-client';

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  senderId: string;
}

export interface UseChatReturn {
  chatMessages: ChatMessage[];
  chatMessage: string;
  chatEndRef: React.RefObject<HTMLDivElement>;
  setChatMessage: (message: string) => void;
  sendMessage: () => void;
  addSystemMessage: (message: string) => void;
}

export const useChat = (room: Room | null, userName: string): UseChatReturn => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /**
   * Send chat message via LiveKit data channel
   */
  const sendMessage = () => {
    if (chatMessage.trim() && room) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: userName,
        senderId: room.localParticipant.identity,
        message: chatMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Send via LiveKit data channel
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      room.localParticipant.publishData(data, { reliable: true });
      
      // Add to local chat
      setChatMessages(prev => [...prev, message]);
      setChatMessage("");
    }
  };

  /**
   * Add system message
   */
  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "System",
      senderId: "system",
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, systemMessage]);
  };

  /**
   * Add received message
   */
  const addReceivedMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  // Expose method to add received messages (for external use)
  useEffect(() => {
    if (room) {
      (room as any).__addChatMessage = addReceivedMessage;
    }
  }, [room]);

  return {
    chatMessages,
    chatMessage,
    chatEndRef,
    setChatMessage,
    sendMessage,
    addSystemMessage,
  };
};
