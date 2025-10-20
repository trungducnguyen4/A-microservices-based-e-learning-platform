import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Users, 
  MessageSquare, 
  Send,
  Settings,
  Hand,
  FileText,
  Camera,
  Maximize,
  Minimize,
  PhoneOff,
  MonitorOff,
  AlertCircle,
  Wifi,
  WifiOff,
  Volume2
} from "lucide-react";
import { Room, RoomEvent, createLocalTracks, RemoteParticipant, LocalParticipant, DataPacket_Kind, Track, LocalTrack } from "livekit-client";
import PreJoinForm from "@/components/PreJoinForm";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  senderId: string;
}

const Classroom = () => {
  // Pre-join state
  const [hasJoined, setHasJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  
  // Media states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Chat states
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // UI states
  const [showSettings, setShowSettings] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("excellent");
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Device states
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  
  // LiveKit states
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Refs to keep track of local tracks
  const localTracksRef = useRef<LocalTrack[]>([]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // LiveKit connection
  useEffect(() => {
    if (!hasJoined) return;
    
    let currentRoom: Room | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    async function joinRoom() {
      try {
        setError(null);
        
        const resp = await fetch(
          `http://localhost:4000/getToken?room=${encodeURIComponent(roomName)}&user=${encodeURIComponent(userName)}`
        );
        
        if (!resp.ok) {
          throw new Error("Failed to get token from server");
        }
        
        const { token, url } = await resp.json();

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

        // Update participants state
        const remoteParticipants = Array.from(r.remoteParticipants.values());
        setParticipants(remoteParticipants);

        // Publish local tracks with device selection
        const tracks = await createLocalTracks({ 
          audio: {
            deviceId: selectedAudioDevice || undefined,
          }, 
          video: isVideoOn ? {
            deviceId: selectedVideoDevice || undefined,
          } : false 
        });
        
        // Store tracks in ref for later control
        localTracksRef.current = tracks;
        
        tracks.forEach(track => {
          r.localParticipant.publishTrack(track);
          
          // Setup audio meter for local audio
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
              localVideoRef.current?.appendChild(el);
            }
          });
        }

        // Set initial mic state
        r.localParticipant.setMicrophoneEnabled(!isMuted);

        // Render existing remote participants
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

        // Data received (chat messages, hand raise, etc.)
        r.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
          const decoder = new TextDecoder();
          const data = decoder.decode(payload);
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'hand-raise') {
              // Handle hand raise notification
              const notification: ChatMessage = {
                id: Date.now().toString(),
                sender: "System",
                senderId: "system",
                message: `${parsed.userName} ${parsed.raised ? 'raised' : 'lowered'} their hand`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setChatMessages(prev => [...prev, notification]);
            } else if (parsed.message) {
              // Chat message
              setChatMessages(prev => [...prev, parsed as ChatMessage]);
            }
          } catch (error) {
            console.error("Error parsing data:", error);
          }
        });

        // Connection quality monitoring
        r.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
          if (participant?.isLocal) {
            if (quality === "excellent") setConnectionQuality("excellent");
            else if (quality === "good") setConnectionQuality("good");
            else setConnectionQuality("poor");
          }
        });

        // Load available devices
        await loadDevices();

      } catch (error) {
        console.error("Failed to join room:", error);
        setIsConnected(false);
        setError("Failed to join room. Please check your connection and try again.");
      }
    }

    function renderRemoteParticipants(room: Room) {
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
    }

    joinRoom();

    // Cleanup
    return () => {
      if (currentRoom) {
        console.log("🧹 Cleaning up room connection");
        currentRoom.disconnect();
        setIsConnected(false);
      }
      // Stop all local tracks (đèn TẮT hết)
      localTracksRef.current.forEach(track => track.stop());
      localTracksRef.current = [];
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [hasJoined, roomName, userName]); // ✅ BỎ isVideoOn, isMuted khỏi dependency!

  // Toggle mute
  const toggleMute = async () => {
    if (!room?.localParticipant) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState) {
      // Mute: Stop audio track (đèn mic tắt)
      const audioTrack = localTracksRef.current.find(t => t.kind === 'audio');
      if (audioTrack) {
        console.log('🔴 [Classroom] Stopping audio track:', audioTrack);
        audioTrack.stop();
        
        // Stop MediaStreamTrack directly
        const mediaTrack = audioTrack.mediaStreamTrack;
        if (mediaTrack && mediaTrack.readyState === 'live') {
          console.log('🔴 [Classroom] Stopping MediaStreamTrack:', mediaTrack.readyState);
          mediaTrack.stop();
        }
        
        await room.localParticipant.unpublishTrack(audioTrack);
        // ✅ REMOVE FROM ARRAY!
        localTracksRef.current = localTracksRef.current.filter(t => t !== audioTrack);
      }
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }
    } else {
      // Unmute: Create new audio track
      console.log('🟢 [Classroom] Creating new audio track');
      const newTracks = await createLocalTracks({
        audio: {
          deviceId: selectedAudioDevice || undefined,
        },
        video: false,
      });
      
      const audioTrack = newTracks.find(t => t.kind === 'audio');
      if (audioTrack) {
        console.log('🟢 [Classroom] Audio track created:', audioTrack);
        await room.localParticipant.publishTrack(audioTrack);
        localTracksRef.current.push(audioTrack);
        setupAudioMeter(audioTrack.mediaStreamTrack);
      }
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (!room?.localParticipant) return;
    
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    if (!newVideoState) {
      // Turn OFF: Stop video track (đèn camera TẮT)
      const videoTrack = localTracksRef.current.find(t => t.kind === 'video');
      if (videoTrack) {
        console.log('🔴 [Classroom] Stopping video track:', videoTrack);
        videoTrack.stop(); // ← Đèn camera TẮT ở đây!
        
        // Stop MediaStreamTrack directly
        const mediaTrack = videoTrack.mediaStreamTrack;
        if (mediaTrack && mediaTrack.readyState === 'live') {
          console.log('🔴 [Classroom] Stopping MediaStreamTrack:', mediaTrack.readyState);
          mediaTrack.stop();
        }
        
        await room.localParticipant.unpublishTrack(videoTrack);
        // Remove from array
        localTracksRef.current = localTracksRef.current.filter(t => t !== videoTrack);
      }
      // Clear video element
      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
      }
    } else {
      // Turn ON: Create new video track
      console.log('🟢 [Classroom] Creating new video track');
      const newTracks = await createLocalTracks({
        audio: false,
        video: {
          deviceId: selectedVideoDevice || undefined,
        },
      });
      
      const videoTrack = newTracks.find(t => t.kind === 'video');
      if (videoTrack) {
        console.log('🟢 [Classroom] Video track created:', videoTrack);
        await room.localParticipant.publishTrack(videoTrack);
        localTracksRef.current.push(videoTrack);
        
        // Render video
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          const el = videoTrack.attach();
          el.style.width = "100%";
          el.style.height = "100%";
          el.style.objectFit = "cover";
          localVideoRef.current.appendChild(el);
        }
      }
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      setIsConnected(false);
      setHasJoined(false);
    }
  };

  // Handle join from PreJoinForm
  const handleJoin = (name: string, room: string) => {
    setUserName(name);
    setRoomName(room);
    setHasJoined(true);
    
    // Load saved preferences
    const savedCameraEnabled = localStorage.getItem("livekit-camera-enabled");
    const savedMicEnabled = localStorage.getItem("livekit-mic-enabled");
    const savedAudioDevice = localStorage.getItem("livekit-selected-audio");
    const savedVideoDevice = localStorage.getItem("livekit-selected-video");
    
    if (savedCameraEnabled) setIsVideoOn(savedCameraEnabled === "true");
    if (savedMicEnabled) setIsMuted(savedMicEnabled === "false");
    if (savedAudioDevice) setSelectedAudioDevice(savedAudioDevice);
    if (savedVideoDevice) setSelectedVideoDevice(savedVideoDevice);
  };

  // Send chat message via LiveKit Data Channel
  const handleSendMessage = () => {
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

  // Toggle hand raise
  const toggleHandRaise = () => {
    if (room) {
      const newState = !handRaised;
      setHandRaised(newState);
      
      // Broadcast hand raise status
      const message = {
        type: 'hand-raise',
        userId: room.localParticipant.identity,
        userName: userName,
        raised: newState
      };
      
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      room.localParticipant.publishData(data, { reliable: true });
    }
  };

  // Screen sharing
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

  // Load devices
  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  // Setup audio level monitoring
  const setupAudioMeter = (audioTrack: MediaStreamTrack) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
    
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    
    microphone.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    updateAudioLevel();
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(Math.min(100, (average / 128) * 100));
    
    requestAnimationFrame(updateAudioLevel);
  };

  // Show pre-join form if not joined yet
  if (!hasJoined) {
    return <PreJoinForm onJoin={handleJoin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Connection Status Alert */}
      {error && (
        <Alert variant="destructive" className="rounded-none">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isReconnecting && (
        <Alert className="rounded-none bg-yellow-500/10 border-yellow-500/20">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>Reconnecting to the room...</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">{roomName}</h1>
          <Badge variant="secondary" className="bg-success/10 text-success">
            <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
            {isConnected ? 'Live' : 'Connecting...'}
          </Badge>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{participants.length + (localParticipant ? 1 : 0)} participants</span>
          </div>
          <div className="flex items-center space-x-2">
            {connectionQuality === "excellent" && <Wifi className="w-4 h-4 text-green-500" />}
            {connectionQuality === "good" && <Wifi className="w-4 h-4 text-yellow-500" />}
            {connectionQuality === "poor" && <WifiOff className="w-4 h-4 text-red-500" />}
            <span className="text-xs text-muted-foreground capitalize">{connectionQuality}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="mic-select">Microphone</Label>
                  <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                    <SelectTrigger id="mic-select">
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camera-select">Camera</Label>
                  <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                    <SelectTrigger id="camera-select">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isMuted && (
                  <div className="space-y-2">
                    <Label>Audio Level</Label>
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-4 h-4" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-100"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={leaveRoom}>
            <PhoneOff className="w-4 h-4 mr-2" />
            Leave
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Grid */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main presenter video - Local participant */}
              <div className="lg:col-span-2">
                <Card className="h-full relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                  {/* Video container - only for video element */}
                  <div ref={localVideoRef} className="absolute inset-0" style={{ display: isVideoOn ? 'block' : 'none' }}></div>
                  
                  {/* Placeholder overlays - separate from video */}
                  {!isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                          <Video className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">Connecting to room...</h3>
                        <p className="text-sm text-muted-foreground">Please wait</p>
                      </div>
                    </div>
                  )}
                  
                  {isConnected && !isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <VideoOff className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Camera is off</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Name label */}
                  {isConnected && localParticipant && (
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded z-10">
                      {localParticipant.identity} (You)
                    </div>
                  )}
                  
                  {/* Controls */}
                  <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
                    <Button
                      size="sm"
                      variant={isFullscreen ? "secondary" : "outline"}
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>
                    {isScreenSharing && <Badge variant="secondary">Screen Sharing</Badge>}
                  </div>
                </Card>
              </div>

              {/* Remote participants */}
              <div className="space-y-4">
                <div ref={remoteVideosRef} className="grid grid-cols-2 gap-2">
                  {!isConnected && (
                    // Show placeholder participants when not connected
                    <>
                      {[1, 2, 3, 4].map((id) => (
                        <Card key={id} className="relative aspect-video overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                                <VideoOff className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <p className="text-xs font-medium truncate px-2">Waiting...</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </>
                  )}
                </div>
                
                {/* Whiteboard area */}
                <Card className="h-40">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Shared Whiteboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <div className="h-24 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Interactive whiteboard content</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="border-t bg-card px-6 py-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleMute}
                className="rounded-full w-12 h-12"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="lg"
                onClick={toggleVideo}
                className="rounded-full w-12 h-12"
                title={isVideoOn ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                onClick={toggleScreenShare}
                className="rounded-full w-12 h-12"
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </Button>
              
              <Button 
                variant={handRaised ? "default" : "secondary"}
                size="lg" 
                className="rounded-full w-12 h-12"
                onClick={toggleHandRaise}
                title={handRaised ? "Lower hand" : "Raise hand"}
              >
                <Hand className={`w-5 h-5 ${handRaised ? 'animate-bounce' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 border-l bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-semibold flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </h3>
          </div>
          
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {chatMessages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{message.sender}</span>
                    {message.senderId === "system" && (
                      <Badge variant="outline" className="text-xs">
                        System
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2">
                    {message.message}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classroom;