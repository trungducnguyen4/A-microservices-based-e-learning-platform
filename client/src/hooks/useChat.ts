/**
 * Custom Hook: useChat
 * Quản lý chat messages và hand raise notifications
 */

import { useState, useRef, useEffect } from 'react';
import { Room, RoomEvent } from 'livekit-client';

/**
 * Generate unique message ID
 */
let messageCounter = 0;
const generateMessageId = () => {
  return `msg-${Date.now()}-${++messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

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
  unreadCount: number;
  lastMessage: ChatMessage | null;
  setChatMessage: (message: string) => void;
  sendMessage: () => void;
  addSystemMessage: (message: string) => void;
  markAsRead: () => void;
  clearLastMessageNotification: () => void;
}

export const useChat = (room: Room | null, userName: string): UseChatReturn => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isChatOpenRef = useRef<boolean>(true); // Track if chat is open

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
        id: generateMessageId(),
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
      id: generateMessageId(),
      sender: "System",
      senderId: "system",
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, systemMessage]);
  };

  /**
   * Mark messages as read (when chat is opened)
   */
  const markAsRead = () => {
    setUnreadCount(0);
  };

  /**
   * Clear last message notification
   */
  const clearLastMessageNotification = () => {
    setLastMessage(null);
  };

  /**
   * Add received message from LiveKit data channel
   */
  const addReceivedMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
    
    // ✅ Update last message và unread count nếu chat đóng
    // và tin nhắn không phải từ local participant
    if (!isChatOpenRef.current && message.senderId !== room?.localParticipant.identity) {
      setLastMessage(message);
      setUnreadCount(prev => prev + 1);
      console.log('[useChat] 📨 New message while chat closed:', message.message);
    }
  };

  /**
   * Setup DataReceived listener để nhận messages
   */
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant?: any) => {
      const decoder = new TextDecoder();
      const data = decoder.decode(payload);
      
      try {
        const parsed = JSON.parse(data);
        
        // Only process chat messages (not hand-raise events)
        if (parsed.type !== 'hand-raise' && parsed.message) {
          // ✅ CRITICAL FIX: Skip messages from ourselves (already added in sendMessage)
          const isOwnMessage = parsed.senderId === room.localParticipant.identity;
          
          if (isOwnMessage) {
            console.log('[useChat] 🔄 Skipping own message from DataReceived');
            return;
          }
          
          const newMessage: ChatMessage = {
            id: parsed.id || generateMessageId(),
            sender: parsed.sender || participant?.identity || "Unknown",
            senderId: parsed.senderId || participant?.identity || "unknown",
            message: parsed.message,
            timestamp: parsed.timestamp || new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
          };
          
          console.log('[useChat] 📨 Received message from:', newMessage.sender);
          addReceivedMessage(newMessage);
        }
      } catch (error) {
        console.error('[useChat] Error parsing message:', error);
      }
    };
    
    // Register DataReceived listener
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return {
    chatMessages,
    chatMessage,
    chatEndRef,
    unreadCount,
    lastMessage,
    setChatMessage,
    sendMessage,
    addSystemMessage,
    markAsRead,
    clearLastMessageNotification,
    // Expose setter to track chat open/close state from parent
    setChatOpen: (isOpen: boolean) => {
      isChatOpenRef.current = isOpen;
      if (isOpen) {
        // Clear unread when chat opens
        markAsRead();
      }
    },
  } as UseChatReturn & { setChatOpen: (isOpen: boolean) => void };
};
