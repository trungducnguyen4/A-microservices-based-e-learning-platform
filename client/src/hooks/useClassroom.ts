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
import { classroomService } from '@/services/classroomApi';
import { clearRoomData, markRoomAsJoined, clearRoomSession } from '@/utils/roomPersistence';

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
  isLocalUserHost: boolean;
  hostUserId: string | null;
  pinnedParticipantIdentity: string | null;
  isMuted: boolean;
  isVideoOn: boolean;
  raisedHands: Set<string>; // Export for ParticipantList
  
  // Refs
  localVideoRef: React.RefObject<HTMLDivElement>;
  remoteVideosRef: React.RefObject<HTMLDivElement>;
  pinnedVideoRef: React.RefObject<HTMLDivElement>;
  
  // Actions
  toggleMute: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  toggleHandRaise: () => void;
  leaveRoom: () => void;
  setIsMuted: (muted: boolean) => void;
  setIsVideoOn: (on: boolean) => void;
  togglePinParticipant: (identity: string) => void;
  unpinParticipant: () => void;
  kickParticipant: (targetIdentity: string) => Promise<void>;
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
  const [isLocalUserHost, setIsLocalUserHost] = useState(false);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const hostUserIdRef = useRef<string | null>(null);
  const [pinnedParticipantIdentity, setPinnedParticipantIdentity] = useState<string | null>(null);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  
  // Media state
  const [isMuted, setIsMuted] = useState(params.isMuted);
  const [isVideoOn, setIsVideoOn] = useState(params.isVideoOn);
  
  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  const pinnedVideoRef = useRef<HTMLDivElement>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const audioProcessorRef = useRef<AudioProcessor>(new AudioProcessor());

  // Keep latest hostUserId accessible to event handlers (avoid stale closure)
  useEffect(() => {
    hostUserIdRef.current = hostUserId;
  }, [hostUserId]);

  /**
   * Render remote participants videos and screen shares
   */
  const renderRemoteParticipants = (room: Room) => {
    if (!remoteVideosRef.current) return;
    
    remoteVideosRef.current.innerHTML = '';

    const currentHostUserId = hostUserIdRef.current;
    
    room.remoteParticipants.forEach(participant => {
      console.log(`[renderRemoteParticipants] 🎭 Rendering ${participant.identity}`);
      
      // ✅ ATTACH AUDIO TRACKS - Critical for hearing remote participants!
      // Attach to a SEPARATE container so audio doesn't get cleared on re-render
      participant.audioTrackPublications.forEach(pub => {
        if (pub.track && pub.isSubscribed && !pub.isMuted) {
          console.log(`[renderRemoteParticipants] 🔊 Attaching audio for ${participant.identity}`);
          
          // Check if audio element already exists for this participant
          const existingAudioId = `audio-${participant.identity}`;
          let audioElement = document.getElementById(existingAudioId) as HTMLAudioElement;
          
          if (!audioElement) {
            // Create new audio element
            audioElement = pub.track.attach() as HTMLAudioElement;
            audioElement.id = existingAudioId;
            audioElement.style.display = 'none';
            // Append to document body to persist across re-renders
            document.body.appendChild(audioElement);
            console.log(`[renderRemoteParticipants] ✅ Created new audio element for ${participant.identity}`);
          } else {
            console.log(`[renderRemoteParticipants] ♻️ Reusing existing audio element for ${participant.identity}`);
          }
        } else {
          console.log(`[renderRemoteParticipants] 🔇 Audio NOT attached for ${participant.identity} - subscribed: ${pub.isSubscribed}, muted: ${pub.isMuted}, track: ${!!pub.track}`);
          
          // Remove audio element if it exists but track is not available
          const existingAudioId = `audio-${participant.identity}`;
          const audioElement = document.getElementById(existingAudioId);
          if (audioElement) {
            audioElement.remove();
            console.log(`[renderRemoteParticipants] 🗑️ Removed audio element for ${participant.identity}`);
          }
        }
      });
      
      // Check for screen share track first
      let hasScreenShare = false;
      let screenShareElement: HTMLVideoElement | null = null;
      
      participant.videoTrackPublications.forEach(pub => {
        // Screen share tracks have source === 'screen_share'
        if (pub.source === 'screen_share' && pub.track && pub.isSubscribed && !pub.isMuted) {
          hasScreenShare = true;
          screenShareElement = pub.track.attach() as HTMLVideoElement;
        }
      });
      
      // If user is sharing screen, create a separate card for screen share
      if (hasScreenShare && screenShareElement) {
        const screenWrapper = document.createElement("div");
        screenWrapper.className = "relative aspect-video bg-muted rounded-lg overflow-hidden";
        screenWrapper.style.position = "relative";
        
        screenShareElement.style.width = "100%";
        screenShareElement.style.height = "100%";
        screenShareElement.style.objectFit = "contain";
        screenWrapper.appendChild(screenShareElement);
        
        // PIN button for screen share
        const pinButton = document.createElement("button");
        pinButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>`;
        pinButton.style.position = "absolute";
        pinButton.style.top = "8px";
        pinButton.style.right = "8px";
        pinButton.style.background = "rgba(0, 0, 0, 0.7)";
        pinButton.style.color = "white";
        pinButton.style.padding = "6px";
        pinButton.style.borderRadius = "6px";
        pinButton.style.cursor = "pointer";
        pinButton.style.opacity = "0";
        pinButton.style.transition = "opacity 0.2s";
        pinButton.style.border = "none";
        pinButton.style.zIndex = "20";
        pinButton.title = "Pin screen share";
        pinButton.onclick = (e) => {
          e.stopPropagation();
          setPinnedParticipantIdentity(`${participant.identity}-screen`);
        };
        
        screenWrapper.onmouseenter = () => { pinButton.style.opacity = "1"; };
        screenWrapper.onmouseleave = () => { pinButton.style.opacity = "0"; };
        screenWrapper.appendChild(pinButton);
        
        // Screen share label with monitor icon
        const screenLabel = document.createElement("div");
        screenLabel.style.position = "absolute";
        screenLabel.style.bottom = "8px";
        screenLabel.style.left = "8px";
        screenLabel.style.maxWidth = "calc(100% - 16px)";
        screenLabel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        screenLabel.style.color = "white";
        screenLabel.style.fontSize = "12px";
        screenLabel.style.padding = "6px 10px";
        screenLabel.style.borderRadius = "6px";
        screenLabel.style.display = "flex";
        screenLabel.style.alignItems = "center";
        screenLabel.style.gap = "6px";
        screenLabel.style.zIndex = "10";
        screenLabel.style.backdropFilter = "blur(4px)";
        
        // Monitor icon + text
        screenLabel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${participant.identity}'s screen</span>`;
        
        screenWrapper.appendChild(screenLabel);
        remoteVideosRef.current?.appendChild(screenWrapper);
      }
      
      // Now render the regular video/camera feed (separate card)
      const wrapper = document.createElement("div");
      wrapper.className = "relative aspect-video bg-muted rounded-lg overflow-hidden";
      wrapper.style.position = "relative";
      wrapper.style.backgroundColor = "#000"; // Black background như Google Meet
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.justifyContent = "center";
      
      // Check if participant has active camera video track
      let hasActiveVideo = false;
      let videoElement: HTMLVideoElement | null = null;
      
      participant.videoTrackPublications.forEach(pub => {
        // Only camera tracks (exclude screen share)
        if (pub.source === 'camera' && pub.track && pub.track.kind === 'video') {
          const trackEnabled = pub.track.mediaStreamTrack?.enabled ?? false;
          const isSubscribed = pub.isSubscribed;
          const isMuted = pub.isMuted;
          
          console.log(`[Video Check] ${participant.identity}: enabled=${trackEnabled}, subscribed=${isSubscribed}, pubMuted=${isMuted}`);
          
          if (isSubscribed && !isMuted && trackEnabled) {
            hasActiveVideo = true;
            videoElement = pub.track.attach() as HTMLVideoElement;
          }
        }
      });
      
      if (hasActiveVideo && videoElement) {
        // Participant has video - render it with proper aspect ratio
        videoElement.style.width = "auto";
        videoElement.style.height = "auto";
        videoElement.style.maxWidth = "100%";
        videoElement.style.maxHeight = "100%";
        videoElement.style.objectFit = "contain"; // Giữ tỷ lệ khung hình
        videoElement.style.transform = "scaleX(-1)"; // Mirror flip for natural look
        videoElement.style.position = "absolute";
        videoElement.style.top = "50%";
        videoElement.style.left = "50%";
        videoElement.style.transform = "translate(-50%, -50%) scaleX(-1)"; // Center and mirror
        wrapper.appendChild(videoElement);
      } else {
        // No video - show avatar placeholder
        const placeholder = document.createElement("div");
        placeholder.style.position = "absolute";
        placeholder.style.inset = "0";
        placeholder.style.display = "flex";
        placeholder.style.alignItems = "center";
        placeholder.style.justifyContent = "center";
        placeholder.style.background = "linear-gradient(135deg, rgb(71, 85, 105) 0%, rgb(51, 65, 85) 100%)";
        
        const avatarCircle = document.createElement("div");
        avatarCircle.style.width = "64px";
        avatarCircle.style.height = "64px";
        avatarCircle.style.borderRadius = "50%";
        avatarCircle.style.backgroundColor = "rgb(99, 102, 241)";
        avatarCircle.style.display = "flex";
        avatarCircle.style.alignItems = "center";
        avatarCircle.style.justifyContent = "center";
        avatarCircle.style.fontSize = "28px";
        avatarCircle.style.fontWeight = "600";
        avatarCircle.style.color = "white";
        avatarCircle.style.textTransform = "uppercase";
        
        // Get first letter of participant name
        const firstLetter = participant.identity ? participant.identity.charAt(0).toUpperCase() : "?";
        avatarCircle.textContent = firstLetter;
        
        placeholder.appendChild(avatarCircle);
        wrapper.appendChild(placeholder);
      }
      
      // Check if this participant is the host
      let isHost = false;
      let participantUserId = null;
      try {
        const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
        participantUserId = metadata.userId;
        // Check bằng userId trong metadata
        isHost = participantUserId === currentHostUserId;
        console.log(`[Render] Participant ${participant.identity}: userId=${participantUserId}, hostUserId=${currentHostUserId}, isHost=${isHost}`);
      } catch (e) {
        console.warn('Error parsing participant metadata:', e);
      }
      
      // PIN button (hiển thị khi hover)
      const pinButton = document.createElement("button");
      pinButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>`;
      pinButton.style.position = "absolute";
      pinButton.style.top = "8px";
      pinButton.style.right = "8px";
      pinButton.style.background = "rgba(0, 0, 0, 0.7)";
      pinButton.style.color = "white";
      pinButton.style.padding = "6px";
      pinButton.style.borderRadius = "6px";
      pinButton.style.cursor = "pointer";
      pinButton.style.opacity = "0";
      pinButton.style.transition = "opacity 0.2s";
      pinButton.style.border = "none";
      pinButton.style.zIndex = "20";
      pinButton.title = "Pin video";
      pinButton.onclick = (e) => {
        e.stopPropagation();
        // Pin camera video with identifier
        setPinnedParticipantIdentity(`${participant.identity}-camera`);
      };
      
      wrapper.appendChild(pinButton);

      // KICK button (chỉ hiển thị cho host và khi hover)
      // Không cho kick host
      const isLocalHost = params.userId === currentHostUserId;
      if (isLocalHost && !isHost) {
        const kickButton = document.createElement("button");
        kickButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
        kickButton.style.position = "absolute";
        kickButton.style.top = "8px";
        kickButton.style.right = "40px"; // Bên trái nút pin
        kickButton.style.background = "rgba(239, 68, 68, 0.9)"; // Red color
        kickButton.style.color = "white";
        kickButton.style.padding = "6px";
        kickButton.style.borderRadius = "6px";
        kickButton.style.cursor = "pointer";
        kickButton.style.opacity = "0";
        kickButton.style.transition = "opacity 0.2s";
        kickButton.style.border = "none";
        kickButton.style.zIndex = "20";
        kickButton.title = "Kick participant";
        kickButton.onclick = async (e) => {
          e.stopPropagation();
          
          // Confirm before kicking
          if (confirm(`Kick ${participant.identity} from the room?`)) {
            try {
              await classroomService.kickParticipant(
                params.roomName,
                params.userId!,
                participant.identity
              );
              console.log(`[Render] ✅ Kicked ${participant.identity}`);
            } catch (error) {
              console.error("[Render] Failed to kick participant:", error);
            }
          }
        };
        
        wrapper.appendChild(kickButton);
        
        // Show/hide both buttons on hover
        wrapper.onmouseenter = () => {
          pinButton.style.opacity = "1";
          kickButton.style.opacity = "1";
        };
        wrapper.onmouseleave = () => {
          pinButton.style.opacity = "0";
          kickButton.style.opacity = "0";
        };
      } else {
        // Only pin button for non-host or when looking at host
        wrapper.onmouseenter = () => {
          pinButton.style.opacity = "1";
        };
        wrapper.onmouseleave = () => {
          pinButton.style.opacity = "0";
        };
      }
      
      // Check if participant has hand raised
      const participantIdentity = participant.identity;
      const hasHandRaised = raisedHands.has(participantIdentity);
      
      // Tạo hand raised icon nếu có
      if (hasHandRaised) {
        const handIcon = document.createElement("div");
        handIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`;
        handIcon.style.position = "absolute";
        handIcon.style.top = "8px";
        handIcon.style.left = "8px";
        handIcon.style.backgroundColor = "rgba(251, 191, 36, 0.95)";
        handIcon.style.color = "white";
        handIcon.style.padding = "6px";
        handIcon.style.borderRadius = "50%";
        handIcon.style.display = "flex";
        handIcon.style.alignItems = "center";
        handIcon.style.justifyContent = "center";
        handIcon.style.zIndex = "15";
        handIcon.style.animation = "bounce 1s infinite";
        handIcon.title = "Hand raised";
        wrapper.appendChild(handIcon);
      }
      
      // Tạo name label container
      const nameLabel = document.createElement("div");
      nameLabel.style.position = "absolute";
      nameLabel.style.bottom = "8px";
      nameLabel.style.left = "8px";
      nameLabel.style.maxWidth = "calc(100% - 16px)";
      nameLabel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      nameLabel.style.color = "white";
      nameLabel.style.fontSize = "12px";
      nameLabel.style.padding = "6px 10px";
      nameLabel.style.borderRadius = "6px";
      nameLabel.style.display = "flex";
      nameLabel.style.alignItems = "center";
      nameLabel.style.gap = "6px";
      nameLabel.style.zIndex = "10";
      nameLabel.style.backdropFilter = "blur(4px)";
      
      // 🤖 Check if participant is a bot
      let isBot = false;
      try {
        if (participant.metadata) {
          const metadata = JSON.parse(participant.metadata);
          isBot = metadata.isBot === true;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      // Text content với Host inline và BOT badge
      let nameHTML = participant.identity;
      
      if (isBot) {
        // Add bot emoji before name
        nameHTML = `🤖 ${nameHTML}`;
      }
      
      if (isHost) {
        nameHTML += ` (Host)`;
      }
      
      if (isBot) {
        // Add BOT badge
        nameHTML += ` <span style="background-color: rgba(107, 114, 128, 0.9); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-left: 4px;">BOT</span>`;
        console.log(`[Render] 🤖 Added BOT label for ${participant.identity}`);
      }
      
      nameLabel.innerHTML = nameHTML;
      nameLabel.style.whiteSpace = "nowrap";
      nameLabel.style.overflow = "hidden";
      nameLabel.style.textOverflow = "ellipsis";
      
      if (isHost) {
        console.log(`[Render] ✅ Added HOST label for ${participant.identity}`);
      }
      
      wrapper.appendChild(nameLabel);
      
      remoteVideosRef.current?.appendChild(wrapper);
    });
  };

  /**
   * Render pinned participant video or screen share
   */
  const renderPinnedParticipant = (room: Room, participantIdentity: string) => {
    if (!pinnedVideoRef.current) return;
    
    // Clear existing content
    pinnedVideoRef.current.innerHTML = "";
    
    // Parse identity - format: "identity-camera" or "identity-screen"
    const isScreenShare = participantIdentity.endsWith('-screen');
    const isCameraView = participantIdentity.endsWith('-camera');
    const actualIdentity = participantIdentity.replace(/-camera$|-screen$/, '');
    
    const participant = Array.from(room.remoteParticipants.values()).find(
      p => p.identity === actualIdentity
    );
    
    if (!participant) return;
    
    let trackToRender: any = null;
    let isPinningScreen = false;
    
    // Find the appropriate track based on what user pinned
    participant.videoTrackPublications.forEach((publication) => {
      if (isScreenShare && publication.source === 'screen_share') {
        trackToRender = publication.track;
        isPinningScreen = true;
      } else if ((isCameraView || !isScreenShare) && publication.source === 'camera') {
        trackToRender = publication.track;
        isPinningScreen = false;
      }
    });
    
    // Fallback: if specific type not found, use any video track
    if (!trackToRender) {
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.track && !trackToRender) {
          trackToRender = publication.track;
          isPinningScreen = publication.source === 'screen_share';
        }
      });
    }
    
    if (trackToRender) {
      const videoElement = trackToRender.attach() as HTMLVideoElement;
      videoElement.style.width = "100%";
      videoElement.style.height = "100%";
      videoElement.style.objectFit = isPinningScreen ? "contain" : "contain";
      videoElement.style.transform = isPinningScreen ? "none" : "scaleX(-1)"; // Mirror only for camera
      
      const wrapper = document.createElement("div");
      wrapper.className = "relative bg-gray-900 rounded-lg h-full w-full overflow-hidden";
      wrapper.appendChild(videoElement);
      
      // UNPIN button
      const unpinButton = document.createElement("button");
      unpinButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>`;
      unpinButton.style.position = "absolute";
      unpinButton.style.top = "12px";
      unpinButton.style.right = "12px";
      unpinButton.style.background = "rgba(59, 130, 246, 0.9)";
      unpinButton.style.color = "white";
      unpinButton.style.padding = "8px";
      unpinButton.style.borderRadius = "8px";
      unpinButton.style.cursor = "pointer";
      unpinButton.style.border = "none";
      unpinButton.style.display = "flex";
      unpinButton.style.alignItems = "center";
      unpinButton.style.gap = "4px";
      unpinButton.style.zIndex = "20";
      unpinButton.title = "Unpin";
      unpinButton.onclick = () => {
        setPinnedParticipantIdentity(null);
      };
      
      wrapper.appendChild(unpinButton);
      
      // Participant name with badges
      const nameLabel = document.createElement("div");
      nameLabel.style.position = "absolute";
      nameLabel.style.bottom = "16px";
      nameLabel.style.left = "16px";
      nameLabel.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
      nameLabel.style.backdropFilter = "blur(4px)";
      nameLabel.style.color = "white";
      nameLabel.style.padding = "8px 14px";
      nameLabel.style.borderRadius = "8px";
      nameLabel.style.fontSize = "15px";
      nameLabel.style.zIndex = "10";
      nameLabel.style.fontWeight = "500";
      
      // Check if this participant is host
      let isHost = false;
      try {
        const participantMetadata = participant.metadata ? JSON.parse(participant.metadata) : {};
        const participantUserId = participantMetadata.userId;
        const currentHostUserId = hostUserIdRef.current;
        isHost = participantUserId && currentHostUserId && participantUserId === currentHostUserId;
      } catch (e) {
        console.warn('Error checking host status for pinned participant:', e);
      }
      
      // Create text with inline badges
      let labelText = "";
      if (isPinningScreen) {
        labelText = isHost 
          ? `${participant.identity}'s screen (Pinned, Host)` 
          : `${participant.identity}'s screen (Pinned)`;
      } else {
        labelText = isHost 
          ? `${participant.identity} (Pinned, Host)` 
          : `${participant.identity} (Pinned)`;
      }
      
      // Add monitor icon if screen share
      if (isPinningScreen) {
        nameLabel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg><span style="margin-left: 4px;">${labelText}</span>`;
      } else {
        nameLabel.textContent = labelText;
      }
      
      wrapper.appendChild(nameLabel);
      
      // ✅ ATTACH AUDIO for pinned participant
      participant.audioTrackPublications.forEach(pub => {
        if (pub.track && pub.isSubscribed && !pub.isMuted) {
          console.log(`[renderPinnedParticipant] 🔊 Attaching audio for pinned ${participant.identity}`);
          const audioElement = pub.track.attach();
          audioElement.style.display = 'none';
          wrapper.appendChild(audioElement);
        }
      });
      
      pinnedVideoRef.current?.appendChild(wrapper);
    } else if (pinnedVideoRef.current) {
      pinnedVideoRef.current.innerHTML = "";
    }
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
        const { token, url, displayName, isHost } = await getLivekitToken({
          room: params.roomName,
          user: params.userName,
          userId: params.userId,
          role: params.userRole,
        });

        // ✅ IMPORTANT: Get definitive host info from backend FIRST
        // Don't rely on token's isHost - get it from room data (source of truth)
        try {
          const classroomService = (await import('@/services/classroomApi')).classroomService;
          const roomCheckResponse = await classroomService.checkRoom(params.roomName);
          
          if (roomCheckResponse && roomCheckResponse.exists && roomCheckResponse.data) {
            const roomHostUserId = roomCheckResponse.data.hostUserId;
            if (roomHostUserId) {
              // ✅ Set host userId from room data (this is the SOURCE OF TRUTH)
              setHostUserId(roomHostUserId);
              
              // Check if current user is host by comparing userId
              const isCurrentUserHost = roomHostUserId === params.userId;
              setIsLocalUserHost(isCurrentUserHost);
              
              console.log('[useClassroom] 🔑 HOST INFO (from backend):');
              console.log('  - Room host_user_id:', roomHostUserId);
              console.log('  - Current user ID:', params.userId);
              console.log('  - Is current user host?', isCurrentUserHost ? '🎭 YES (HOST)' : '👤 NO (guest)');
            }
          }
        } catch (error) {
          console.warn('[useClassroom] Could not fetch room info:', error);
        }

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
        
        r.on(RoomEvent.Disconnected, (reason?: any) => {
          console.log("❌ Disconnected from room", reason ? `Reason: ${reason}` : '');
          setIsConnected(false);
          
          // Check if disconnected due to being kicked
          // LiveKit DisconnectReason enum:
          // - 4 = PARTICIPANT_REMOVED (kicked by host)
          // - Also check string format for compatibility
          const reasonNum = typeof reason === 'number' ? reason : parseInt(String(reason || '0'));
          const reasonStr = String(reason || '').toLowerCase();
          
          if (reasonNum === 4 || reasonStr.includes('removed') || reasonStr.includes('kicked')) {
            console.log("🚫 You were kicked from the room");
            setError("You have been removed from the room by the host");
            
            // Clear room data immediately
            clearRoomSession(params.roomName);
            
            // Disconnect and cleanup
            if (currentRoom) {
              currentRoom.disconnect();
            }
            
            // Navigate immediately
            navigate('/meet', { replace: true });
            return;
          }
          
          // Normal disconnect - try to reconnect
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

        // ✅ Mark room as joined successfully (for skip PreJoin on refresh)
        markRoomAsJoined(params.roomName);
        console.log('[useClassroom] 🎯 Room marked as joined');

        // Update participants
        const remoteParticipants = Array.from(r.remoteParticipants.values());
        setParticipants(remoteParticipants);

        // Publish local tracks - with permission error handling
        let tracks: LocalTrack[] = []; // Define outside try-catch to avoid ReferenceError
        try {
          const shouldCreateAudio = !isMuted;
          const shouldCreateVideo = isVideoOn;
          console.log('[useClassroom] 🎬 Creating local tracks - isMuted:', isMuted, 'isVideoOn:', isVideoOn);

          // LiveKit (and browser getUserMedia) requires at least one of audio/video.
          if (!shouldCreateAudio && !shouldCreateVideo) {
            console.log('[useClassroom] 🎬 Mic+camera are OFF, skipping local track creation');
            tracks = [];
          } else {
            tracks = await createLocalTracks({
              audio: shouldCreateAudio
                ? {
                    deviceId: params.selectedAudioDevice || undefined,
                  }
                : false,
              video: shouldCreateVideo
                ? {
                    deviceId: params.selectedVideoDevice || undefined,
                  }
                : false,
            });
          }
          
          console.log('[useClassroom] ✅ Created', tracks.length, 'tracks:', tracks.map(t => t.kind).join(', '));
          localTracksRef.current = tracks;
          
          for (const track of tracks) {
            console.log('[useClassroom] 📤 Publishing', track.kind, 'track...');
            await r.localParticipant.publishTrack(track);
            
            if (track.kind === 'audio') {
              setupAudioMeter(track.mediaStreamTrack);
              console.log('[useClassroom] 🎤 Audio track published with meter setup');
            }
          }
        } catch (trackError: any) {
          // Handle permission denied gracefully
          if (trackError.name === 'NotAllowedError' || trackError.message?.includes('Permission denied')) {
            console.warn('[useClassroom] ⚠️ Media permissions denied. Joining room without media tracks.');
            // Set both to off since we don't have permission
            setIsMuted(true);
            setIsVideoOn(false);
            tracks = []; // Empty array
            // Don't show error - user intentionally denied permissions
          } else {
            console.error('[useClassroom] Error creating local tracks:', trackError);
            tracks = []; // Empty array
            // For other errors, log but continue
          }
        }

        // Render local video
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          
          // Set container to fill space with centered content
          localVideoRef.current.style.display = 'flex';
          localVideoRef.current.style.alignItems = 'center';
          localVideoRef.current.style.justifyContent = 'center';
          localVideoRef.current.style.overflow = 'hidden';
          
          // Check if we have video track
          const hasVideoTrack = tracks.length > 0 && tracks.some(t => t.kind === 'video');
          
          if (hasVideoTrack) {
            // Camera is on - set black background
            localVideoRef.current.style.backgroundColor = '#000';
            
            tracks.forEach(track => {
              if (track.kind === 'video') {
                const el = track.attach();
                // Video giữ aspect ratio, không bị cắt hoặc stretch
                el.style.width = "auto";
                el.style.height = "auto";
                el.style.maxWidth = "100%";
                el.style.maxHeight = "100%";
                el.style.objectFit = "contain"; // Giữ tỷ lệ khung hình
                el.style.transform = "scaleX(-1)"; // Mirror flip
                localVideoRef.current?.appendChild(el);
              }
            });
          } else {
            // Camera is off - set transparent background so placeholder shows through
            localVideoRef.current.style.backgroundColor = 'transparent';
          }
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
          
          // Clean up audio element for disconnected participant
          const audioElementId = `audio-${participant.identity}`;
          const audioElement = document.getElementById(audioElementId);
          if (audioElement) {
            audioElement.remove();
            console.log(`[ParticipantDisconnected] 🗑️ Cleaned up audio for ${participant.identity}`);
          }
        });

        r.on(RoomEvent.TrackPublished, (publication, participant) => {
          if (participant.isLocal) return;
          console.log("📤 Track published:", publication.kind, publication.source, "from", participant.identity);
          renderRemoteParticipants(r);
        });

        r.on(RoomEvent.TrackUnpublished, (publication, participant) => {
          if (participant.isLocal) return;
          console.log("📤 Track unpublished:", publication.kind, publication.source, "from", participant.identity);
          // If unpinned track is screen share, unpin it
          if (publication.source === 'screen_share' && pinnedParticipantIdentity === `${participant.identity}-screen`) {
            setPinnedParticipantIdentity(null);
          }
          renderRemoteParticipants(r);
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

        r.on(RoomEvent.TrackMuted, (publication, participant) => {
          if (participant.isLocal) return;
          console.log("🔇 Track muted:", publication.kind, "from", participant.identity);
          renderRemoteParticipants(r);
        });

        r.on(RoomEvent.TrackUnmuted, (publication, participant) => {
          if (participant.isLocal) return;
          console.log("🔊 Track unmuted:", publication.kind, "from", participant.identity);
          renderRemoteParticipants(r);
        });

        // Data received handler for hand-raise events ONLY
        // Note: Chat messages are handled by useChat hook's DataReceived listener
        r.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
          const decoder = new TextDecoder();
          const data = decoder.decode(payload);
          
          try {
            const parsed = JSON.parse(data);
            
            // Only handle hand-raise events here
            // Chat messages are handled by useChat hook to avoid duplicate processing
            if (parsed.type === 'hand-raise') {
              const participantIdentity = parsed.userId || participant?.identity;
              if (participantIdentity) {
                setRaisedHands(prev => {
                  const newSet = new Set(prev);
                  if (parsed.raised) {
                    newSet.add(participantIdentity);
                  } else {
                    newSet.delete(participantIdentity);
                  }
                  return newSet;
                });
              }
            }
            // Chat messages are NOT processed here - useChat handles them
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
        
        // Notify backend that we're leaving
        const roomName = currentRoom.name;
        const identity = currentRoom.localParticipant.identity;
        
        classroomService.notifyParticipantLeft(roomName, identity)
          .then((result) => {
            console.log(`[useClassroom] Notified backend - Room empty: ${result.data.isEmpty}, Remaining: ${result.data.remainingParticipants}`);
            
            // If room is now empty, clear local room data AND session
            if (result.data.isEmpty) {
              console.log(`[useClassroom] 🗑️ Room is empty, clearing local data and session`);
              clearRoomData(roomName);
              clearRoomSession(roomName);
            }
          })
          .catch((error) => {
            console.error('[useClassroom] Error notifying participant left:', error);
          });
        
        currentRoom.disconnect();
        setIsConnected(false);
      }
      localTracksRef.current.forEach(track => track.stop());
      localTracksRef.current = [];
      audioProcessorRef.current.cleanup();
      
      // Clean up all remote audio elements
      if (currentRoom) {
        currentRoom.remoteParticipants.forEach(participant => {
          const audioElementId = `audio-${participant.identity}`;
          const audioElement = document.getElementById(audioElementId);
          if (audioElement) {
            audioElement.remove();
            console.log(`[Cleanup] 🗑️ Removed audio element for ${participant.identity}`);
          }
        });
      }
    };
  }, [params.roomName, params.userName, params.userId]);

  /**
   * Re-render remote participants khi hostUserId hoặc raisedHands thay đổi
   */
  useEffect(() => {
    if (room) {
      console.log('[useClassroom] Re-rendering participants');
      renderRemoteParticipants(room);
    }
  }, [hostUserId, room, raisedHands]);

  /**
   * Re-render pinned participant khi pinnedParticipantIdentity thay đổi
   */
  useEffect(() => {
    if (room && pinnedParticipantIdentity) {
      console.log('[useClassroom] Pinning participant:', pinnedParticipantIdentity);
      renderPinnedParticipant(room, pinnedParticipantIdentity);
    } else if (pinnedVideoRef.current) {
      pinnedVideoRef.current.innerHTML = "";
    }
  }, [pinnedParticipantIdentity, room]);

  /**
   * Toggle mute
   */
  const toggleMute = async () => {
    if (!room?.localParticipant) return;
    
    const newMutedState = !isMuted;
    console.log('[toggleMute] 🎤 Changing from', isMuted, 'to', newMutedState);
    setIsMuted(newMutedState);
    
    // Save to localStorage for persistence
    localStorage.setItem('livekit-mic-enabled', JSON.stringify(!newMutedState));
    
    if (newMutedState) {
      // MUTING - unpublish and stop track
      const audioTrack = localTracksRef.current.find(t => t.kind === 'audio');
      if (audioTrack) {
        console.log('[toggleMute] 🔇 Unpublishing audio track');
        audioTrack.stop();
        const mediaTrack = audioTrack.mediaStreamTrack;
        if (mediaTrack && mediaTrack.readyState === 'live') {
          mediaTrack.stop();
        }
        await room.localParticipant.unpublishTrack(audioTrack);
        localTracksRef.current = localTracksRef.current.filter(t => t !== audioTrack);
        console.log('[toggleMute] ✅ Audio track unpublished');
      } else {
        console.log('[toggleMute] ⚠️ No audio track found to unpublish');
      }
      audioProcessorRef.current.cleanup();
    } else {
      // UNMUTING - create and publish new track
      console.log('[toggleMute] 🔊 Creating new audio track...');
      try {
        const newTracks = await createLocalTracks({
          audio: { deviceId: params.selectedAudioDevice || undefined },
          video: false,
        });
        
        const audioTrack = newTracks.find(t => t.kind === 'audio');
        if (audioTrack) {
          console.log('[toggleMute] 📤 Publishing audio track...');
          await room.localParticipant.publishTrack(audioTrack);
          localTracksRef.current.push(audioTrack);
          setupAudioMeter(audioTrack.mediaStreamTrack);
          console.log('[toggleMute] ✅ Audio track published successfully');
        } else {
          console.error('[toggleMute] ❌ No audio track created');
          setIsMuted(true);
        }
      } catch (error: any) {
        // Handle permission denied
        if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
          console.warn('[toggleMute] ⚠️ Microphone permission denied');
          setIsMuted(true); // Revert to muted state
        } else {
          console.error('[toggleMute] ❌ Error creating audio track:', error);
          setIsMuted(true); // Revert on error
        }
      }
    }
  };

  /**
   * Toggle video
   */
  const toggleVideo = async () => {
    if (!room?.localParticipant) return;
    
    const newVideoState = !isVideoOn;
    console.log('[toggleVideo] Changing from', isVideoOn, 'to', newVideoState);
    setIsVideoOn(newVideoState);
    
    // Save to localStorage for persistence
    localStorage.setItem('livekit-camera-enabled', JSON.stringify(newVideoState));
    
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
        // Reset background to transparent when camera is off
        localVideoRef.current.style.backgroundColor = 'transparent';
      }
    } else {
      try {
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
            
            // Set container style
            localVideoRef.current.style.display = 'flex';
            localVideoRef.current.style.alignItems = 'center';
            localVideoRef.current.style.justifyContent = 'center';
            localVideoRef.current.style.backgroundColor = '#000';
            localVideoRef.current.style.overflow = 'hidden';
            
            const el = videoTrack.attach();
            // Video giữ aspect ratio như Google Meet
            el.style.width = "auto";
            el.style.height = "auto";
            el.style.maxWidth = "100%";
            el.style.maxHeight = "100%";
            el.style.objectFit = "contain";
            el.style.transform = "scaleX(-1)";
            localVideoRef.current.appendChild(el);
          }
        }
      } catch (error: any) {
        // Handle permission denied
        if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
          console.warn('[toggleVideo] ⚠️ Camera permission denied');
          setIsVideoOn(false); // Revert to off state
        } else {
          console.error('[toggleVideo] Error creating video track:', error);
          setIsVideoOn(false); // Revert on error
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
      
      // Update local raised hands set
      setRaisedHands(prev => {
        const newSet = new Set(prev);
        if (newState) {
          newSet.add(room.localParticipant.identity);
        } else {
          newSet.delete(room.localParticipant.identity);
        }
        return newSet;
      });
      
      const message = {
        type: 'hand-raise',
        userId: room.localParticipant.identity,
        userName: params.userName,
        raised: newState
      };
      
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      room.localParticipant.publishData(data, { reliable: true });
      
      console.log(`[Hand Raise] ${newState ? 'Raised' : 'Lowered'} hand`);
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

  /**
   * Toggle pin participant
   */
  const togglePinParticipant = (identity: string) => {
    if (pinnedParticipantIdentity === identity) {
      setPinnedParticipantIdentity(null);
    } else {
      setPinnedParticipantIdentity(identity);
    }
  };

  /**
   * Unpin participant
   */
  const unpinParticipant = () => {
    setPinnedParticipantIdentity(null);
  };

  /**
   * Kick participant from room (HOST ONLY)
   */
  const kickParticipant = async (targetIdentity: string) => {
    if (!isLocalUserHost) {
      setError("Only the host can kick participants");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!params.userId) {
      setError("User ID not available");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      console.log(`[useClassroom] 🚫 Kicking participant: ${targetIdentity}`);
      
      const result = await classroomService.kickParticipant(
        params.roomName,
        params.userId,
        targetIdentity
      );

      if (result.success) {
        console.log(`[useClassroom] ✅ Successfully kicked ${targetIdentity}`);
        
        // Update participants list immediately
        setParticipants(prev => prev.filter(p => p.identity !== targetIdentity));
        
        // If pinned participant was kicked, unpin
        if (pinnedParticipantIdentity === targetIdentity || 
            pinnedParticipantIdentity === `${targetIdentity}-camera` ||
            pinnedParticipantIdentity === `${targetIdentity}-screen`) {
          setPinnedParticipantIdentity(null);
        }
      }
    } catch (error: any) {
      console.error("[useClassroom] Error kicking participant:", error);
      const errorMsg = error.response?.data?.message || "Failed to kick participant";
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
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
    isLocalUserHost,
    hostUserId,
    pinnedParticipantIdentity,
    isMuted,
    isVideoOn,
    raisedHands,
    localVideoRef,
    remoteVideosRef,
    pinnedVideoRef,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    leaveRoom,
    setIsMuted,
    setIsVideoOn,
    togglePinParticipant,
    unpinParticipant,
    kickParticipant,
  } as UseClassroomReturn;
};
