/**
 * Custom Hook: useClassroom
 * Quản lý LiveKit room connection và participants
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Room,
  RoomEvent,
  createLocalTracks,
  RemoteParticipant,
  LocalParticipant,
  LocalTrack,
} from 'livekit-client';
import { getLivekitToken } from '@/services/livekitService';
import { AudioProcessor } from '@/utils/audioProcessor';
import type { ChatMessage } from './useChat';

export interface UseClassroomParams {
  roomName: string;
  userName: string;
  userId?: string;
  userRole?: string;
  isVideoOn: boolean;
  isMuted: boolean;
  selectedAudioDevice: string;
  selectedVideoDevice: string;
}

export interface UseClassroomReturn {
  // State
  room: Room | null;
  participants: RemoteParticipant[];
  localParticipant: LocalParticipant | null;
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  connectionQuality: "excellent" | "good" | "poor";
  audioLevel: number;
  handRaised: boolean;
  isScreenSharing: boolean;
  
  // Refs
  localVideoRef: React.RefObject<HTMLDivElement>;
  remoteVideosRef: React.RefObject<HTMLDivElement>;
  
  // Actions
  toggleMute: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  toggleHandRaise: () => void;
  leaveRoom: () => void;
  setIsMuted: (muted: boolean) => void;
  setIsVideoOn: (on: boolean) => void;
}

export const useClassroom = (params: UseClassroomParams): UseClassroomReturn => {
  const navigate = useNavigate();
  
  // Room state
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // UI state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("excellent");
  const [audioLevel, setAudioLevel] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Media state
  const [isMuted, setIsMuted] = useState(params.isMuted);
  const [isVideoOn, setIsVideoOn] = useState(params.isVideoOn);
  
  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const audioProcessorRef = useRef<AudioProcessor>(new AudioProcessor());

  /**
   * Render remote participants videos
   */
  const renderRemoteParticipants = (room: Room) => {
    if (!remoteVideosRef.current) return;
    
    remoteVideosRef.current.innerHTML = '';
    
    room.remoteParticipants.forEach(participant => {
      participant.trackPublications.forEach(pub => {
        if (pub.track && pub.track.kind === 'video') {
          const el = pub.track.attach();
          el.style.width = "100%";
          el.style.height = "100%";
          el.style.objectFit = "cover";
          
          const wrapper = document.createElement("div");
          wrapper.className = "relative aspect-video bg-muted rounded-lg overflow-hidden";
          wrapper.appendChild(el);
          
          const nameLabel = document.createElement("div");
          nameLabel.className = "absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded";
          nameLabel.textContent = participant.identity;
          wrapper.appendChild(nameLabel);
          
          remoteVideosRef.current?.appendChild(wrapper);
        }
      });
    });
  };

  /**
   * Setup audio meter
   */
  const setupAudioMeter = (audioTrack: MediaStreamTrack) => {
    audioProcessorRef.current.setup(audioTrack, (level) => {
      setAudioLevel(level);
    });
  };

  /**
   * Join room
   */
  useEffect(() => {
    if (!params.roomName || !params.userName) return;
    
    let currentRoom: Room | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    async function joinRoom() {
      try {
        setError(null);
        
        // Get token
        const { token, url, displayName } = await getLivekitToken({
          room: params.roomName,
          user: params.userName,
          userId: params.userId,
          role: params.userRole,
        });

        const r = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        
        // Connection state listeners
        r.on(RoomEvent.Reconnecting, () => {
          console.log("🔄 Reconnecting...");
          setIsReconnecting(true);
          setConnectionQuality("poor");
        });
        
        r.on(RoomEvent.Reconnected, () => {
          console.log("✅ Reconnected successfully");
          setIsReconnecting(false);
          setConnectionQuality("excellent");
          reconnectAttempts = 0;
        });
        
        r.on(RoomEvent.Disconnected, () => {
          console.log("❌ Disconnected from room");
          setIsConnected(false);
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(() => joinRoom(), 2000);
          } else {
            setError("Connection lost. Please refresh the page.");
          }
        });

        await r.connect(url, token);
        setRoom(r);
        setLocalParticipant(r.localParticipant);
        currentRoom = r;
        setIsConnected(true);

        // Update participants
        const remoteParticipants = Array.from(r.remoteParticipants.values());
        setParticipants(remoteParticipants);

        // Publish local tracks
        const tracks = await createLocalTracks({ 
          audio: {
            deviceId: params.selectedAudioDevice || undefined,
          }, 
          video: isVideoOn ? {
            deviceId: params.selectedVideoDevice || undefined,
          } : false 
        });
        
        localTracksRef.current = tracks;
        
        tracks.forEach(track => {
          r.localParticipant.publishTrack(track);
          
          if (track.kind === 'audio') {
            setupAudioMeter(track.mediaStreamTrack);
          }
        });

        // Render local video
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          tracks.forEach(track => {
            if (track.kind === 'video') {
              const el = track.attach();
              el.style.width = "100%";
              el.style.height = "100%";
              el.style.objectFit = "cover";
              el.style.transform = "scaleX(-1)";
              localVideoRef.current?.appendChild(el);
            }
          });
        }

        r.localParticipant.setMicrophoneEnabled(!isMuted);

        // Render remote participants
        renderRemoteParticipants(r);

        // Event listeners
        r.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log("👥 New participant:", participant.identity);
          setParticipants(prev => [...prev, participant]);
        });

        r.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log("🚪 Participant left:", participant.identity);
          setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
        });

        r.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
          if (participant.isLocal) return;
          console.log("📹 Track subscribed:", track.kind, "from", participant.identity);
          renderRemoteParticipants(r);
        });

        r.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
          if (participant.isLocal) return;
          console.log("📹 Track unsubscribed:", track.kind, "from", participant.identity);
          renderRemoteParticipants(r);
        });

        // Data received handler
        r.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
          const decoder = new TextDecoder();
          const data = decoder.decode(payload);
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'hand-raise') {
              // Handle via callback if provided
              if ((r as any).__addChatMessage) {
                const notification: ChatMessage = {
                  id: Date.now().toString(),
                  sender: "System",
                  senderId: "system",
                  message: `${parsed.userName} ${parsed.raised ? 'raised' : 'lowered'} their hand`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                (r as any).__addChatMessage(notification);
              }
            } else if (parsed.message) {
              // Chat message
              if ((r as any).__addChatMessage) {
                (r as any).__addChatMessage(parsed);
              }
            }
          } catch (error) {
            console.error("Error parsing data:", error);
          }
        });

        // Connection quality
        r.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
          if (participant?.isLocal) {
            if (quality === "excellent") setConnectionQuality("excellent");
            else if (quality === "good") setConnectionQuality("good");
            else setConnectionQuality("poor");
          }
        });

      } catch (error) {
        console.error("Failed to join room:", error);
        setIsConnected(false);
        setError("Failed to join room. Please check your connection and try again.");
      }
    }

    joinRoom();

    // Cleanup
    return () => {
      if (currentRoom) {
        console.log("🧹 Cleaning up room connection");
        currentRoom.disconnect();
        setIsConnected(false);
      }
      localTracksRef.current.forEach(track => track.stop());
      localTracksRef.current = [];
      audioProcessorRef.current.cleanup();
    };
  }, [params.roomName, params.userName, params.userId]);

  /**
   * Toggle mute
   */
  const toggleMute = async () => {
    if (!room?.localParticipant) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState) {
      const audioTrack = localTracksRef.current.find(t => t.kind === 'audio');
      if (audioTrack) {
        audioTrack.stop();
        const mediaTrack = audioTrack.mediaStreamTrack;
        if (mediaTrack && mediaTrack.readyState === 'live') {
          mediaTrack.stop();
        }
        await room.localParticipant.unpublishTrack(audioTrack);
        localTracksRef.current = localTracksRef.current.filter(t => t !== audioTrack);
      }
      audioProcessorRef.current.cleanup();
    } else {
      const newTracks = await createLocalTracks({
        audio: { deviceId: params.selectedAudioDevice || undefined },
        video: false,
      });
      
      const audioTrack = newTracks.find(t => t.kind === 'audio');
      if (audioTrack) {
        await room.localParticipant.publishTrack(audioTrack);
        localTracksRef.current.push(audioTrack);
        setupAudioMeter(audioTrack.mediaStreamTrack);
      }
    }
  };

  /**
   * Toggle video
   */
  const toggleVideo = async () => {
    if (!room?.localParticipant) return;
    
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    if (!newVideoState) {
      const videoTrack = localTracksRef.current.find(t => t.kind === 'video');
      if (videoTrack) {
        videoTrack.stop();
        const mediaTrack = videoTrack.mediaStreamTrack;
        if (mediaTrack && mediaTrack.readyState === 'live') {
          mediaTrack.stop();
        }
        await room.localParticipant.unpublishTrack(videoTrack);
        localTracksRef.current = localTracksRef.current.filter(t => t !== videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
      }
    } else {
      const newTracks = await createLocalTracks({
        audio: false,
        video: { deviceId: params.selectedVideoDevice || undefined },
      });
      
      const videoTrack = newTracks.find(t => t.kind === 'video');
      if (videoTrack) {
        await room.localParticipant.publishTrack(videoTrack);
        localTracksRef.current.push(videoTrack);
        
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          const el = videoTrack.attach();
          el.style.width = "100%";
          el.style.height = "100%";
          el.style.objectFit = "cover";
          el.style.transform = "scaleX(-1)";
          localVideoRef.current.appendChild(el);
        }
      }
    }
  };

  /**
   * Toggle screen share
   */
  const toggleScreenShare = async () => {
    if (!room) return;
    
    try {
      if (isScreenSharing) {
        await room.localParticipant.setScreenShareEnabled(false);
        setIsScreenSharing(false);
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      setError("Failed to share screen. Please check permissions.");
      setTimeout(() => setError(null), 5000);
    }
  };

  /**
   * Toggle hand raise
   */
  const toggleHandRaise = () => {
    if (room) {
      const newState = !handRaised;
      setHandRaised(newState);
      
      const message = {
        type: 'hand-raise',
        userId: room.localParticipant.identity,
        userName: params.userName,
        raised: newState
      };
      
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      room.localParticipant.publishData(data, { reliable: true });
    }
  };

  /**
   * Leave room and navigate back (will trigger page reload via Classroom component)
   */
  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      setIsConnected(false);
    }
    
    // Navigate to meet page with replace to avoid back history
    navigate('/meet', { replace: true });
  };

  return {
    room,
    participants,
    localParticipant,
    isConnected,
    isReconnecting,
    error,
    connectionQuality,
    audioLevel,
    handRaised,
    isScreenSharing,
    localVideoRef,
    remoteVideosRef,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    leaveRoom,
    setIsMuted,
    setIsVideoOn,
  };
};
