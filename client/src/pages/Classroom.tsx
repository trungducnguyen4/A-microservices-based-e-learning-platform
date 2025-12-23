import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Maximize,
  Minimize,
  PhoneOff,
  MonitorOff,
  AlertCircle,
  Wifi,
  WifiOff,
  Volume2,
  LogOut,
  MicIcon,
  StopCircle,
  Clock,
  Download,
  ChevronDown,
  Eye,
  Trash
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/hooks/useClassroom";
import { useChat } from "@/hooks/useChat";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { getDeviceLabel } from "@/utils/deviceManager";
import { useLeaveConfirmation } from "@/hooks/useLeaveConfirmation";
import { useTranscription } from "@/hooks/useTranscription";
import { cleanupOldRoomData, hasJoinedRoom } from "@/utils/roomPersistence";

const Classroom = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get initial media settings from PreJoin or fallback to localStorage
  const preJoinState = location.state as { isCameraOn?: boolean; isMicOn?: boolean } | null;
  const initialCameraOn = preJoinState?.isCameraOn ?? 
    JSON.parse(localStorage.getItem('cameraEnabled') || 'true');
  const initialMicOn = preJoinState?.isMicOn ?? 
    JSON.parse(localStorage.getItem('micEnabled') || 'true');

  // Cleanup old room data on mount
  useEffect(() => {
    cleanupOldRoomData();
  }, []);
  
  // State
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showChat, setShowChat] = useState(false); // ✅ Chat thu vào khi vào meeting
  
  // Get room code from URL and auto-join
  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl && user) {
      console.log('[Classroom] Room code from URL:', roomFromUrl);
      
      // ✅ CRITICAL: Check if coming from PreJoin (via location.state)
      // If user is navigating from PreJoin, allow them in (they just clicked Join)
      // If user is accessing directly (no state), check if they have already joined before
      const comingFromPreJoin = preJoinState !== null; // Has state from PreJoin
      const alreadyJoined = hasJoinedRoom(roomFromUrl);
      
      if (!comingFromPreJoin && !alreadyJoined) {
        // Direct access without PreJoin AND no previous join session
        console.log('[Classroom] 🚫 Direct access without session, redirecting to PreJoin');
        navigate(`/prejoin?room=${roomFromUrl}`, { replace: true });
        return;
      }
      
      if (comingFromPreJoin) {
        console.log('[Classroom] ✅ Coming from PreJoin, allowing join');
      } else {
        console.log('[Classroom] ✅ Has previous session, allowing direct access');
      }
      
      setRoomName(roomFromUrl);
      setUserName(user.name || user.email);
    } else if (!roomFromUrl) {
      // No room code, redirect to meet
      navigate('/meet');
    }
  }, [searchParams, user, navigate]);
  
  // Media devices hook
  const {
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
  } = useMediaDevices();
  
  // Classroom hook
  const {
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
    localVideoRef,
    remoteVideosRef,
    pinnedVideoRef,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    leaveRoom,
  } = useClassroom({
    roomName,
    userName,
    userId: user?.id,
    userRole: user?.role || 'guest',
    isVideoOn: initialCameraOn,
    isMuted: !initialMicOn,
    selectedAudioDevice,
    selectedVideoDevice,
  });
  
  // Chat hook
  const {
    chatMessages,
    chatMessage,
    chatEndRef,
    unreadCount,
    lastMessage,
    setChatMessage,
    sendMessage,
    markAsRead,
    clearLastMessageNotification,
    setChatOpen,
  } = useChat(room, userName) as any; // Type assertion for setChatOpen

  // Transcription hook (pass roomName for persistence)
  const {
    isRecording,
    transcript,
    recordingTime,
    totalUsedTime,
    remainingTime,
    maxTime,
    isProcessing,
    error: transcriptionError,
    isConfigured: isGroqConfigured,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useTranscription(room, roomName);

  // Debug: Log state changes
  useEffect(() => {
    console.log('[Classroom] Media state changed - isMuted:', isMuted, 'isVideoOn:', isVideoOn);
  }, [isMuted, isVideoOn]);

  // Store beforeunload handler ref to remove it before leaving
  const beforeUnloadHandlerRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  // Create wrapped leaveRoom that removes beforeunload first
  const leaveRoomWithCleanup = () => {
    // Remove beforeunload listener to prevent popup
    if (beforeUnloadHandlerRef.current) {
      window.removeEventListener('beforeunload', beforeUnloadHandlerRef.current);
      beforeUnloadHandlerRef.current = null;
    }
    
    // Disconnect room first
    leaveRoom();
    
    // Small delay to ensure disconnect completes, then reload
    setTimeout(() => {
      window.location.href = '/meet';
    }, 100);
  };

  // Leave confirmation hook
  const {
    showLeaveDialog,
    handleLeaveRequest,
    handleConfirmLeave,
    handleCancelLeave,
    isLeavingConfirmed,
  } = useLeaveConfirmation(leaveRoomWithCleanup);

  // Handle back button - show confirmation dialog
  useEffect(() => {
    // Push a dummy state to prevent back
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (e: PopStateEvent) => {
      // User pressed back button - show confirmation dialog
      e.preventDefault();
      
      // Push state again to prevent actual back
      window.history.pushState(null, '', window.location.href);
      
      // Show confirmation dialog
      handleLeaveRequest();
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show browser's native confirmation when closing tab
      if (isConnected) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Store reference for later removal
    beforeUnloadHandlerRef.current = handleBeforeUnload;

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      beforeUnloadHandlerRef.current = null;
    };
  }, [isConnected, handleLeaveRequest, isLeavingConfirmed]);

  // ✅ Track chat open/close state and manage unread notifications
  useEffect(() => {
    if (setChatOpen) {
      setChatOpen(showChat);
    }
  }, [showChat, setChatOpen]);

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
      {/* Groq Warning for Host */}
      {isLocalUserHost && !isGroqConfigured && (
        <Alert className="rounded-none bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Speech-to-Text is not configured. Add VITE_GROQ_API_KEY to .env to enable lecture transcription.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Quota Warning */}
      {isLocalUserHost && isGroqConfigured && remainingTime <= 120000 && remainingTime > 0 && (
        <Alert className="rounded-none bg-yellow-500/10 border-yellow-500/20">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Transcription quota running low! Only {Math.floor(remainingTime / 60000)} minute(s) remaining for this session.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Quota Exhausted */}
      {isLocalUserHost && isGroqConfigured && remainingTime <= 0 && (
        <Alert className="rounded-none bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Transcription quota exhausted! You've used all 10 minutes for this session. Start a new session to record again.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-md border-b shadow-sm px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-5 flex-1 min-w-0">
          <h1 className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight truncate max-w-[80px] sm:max-w-[150px] lg:max-w-none">{roomName}</h1>
          
          {/* Combined Status Badge - Mobile optimized */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Status + Connection Quality combined on mobile */}
            <Badge variant="secondary" className="bg-green-500/15 text-green-600 border-green-500/20 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs flex items-center gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">{isConnected ? 'Live' : 'Connecting...'}</span>
              {/* Mobile: Show connection quality icon instead of Live text */}
              <span className="sm:hidden">
                {connectionQuality === "excellent" && <Wifi className="w-3 h-3" />}
                {connectionQuality === "good" && <Wifi className="w-3 h-3 text-yellow-500" />}
                {connectionQuality === "poor" && <WifiOff className="w-3 h-3 text-red-500" />}
              </span>
            </Badge>
            
            {/* Participant count */}
            <div className="flex items-center gap-1 text-[10px] sm:text-sm font-medium text-muted-foreground bg-muted/40 px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-lg">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{participants.length + (localParticipant ? 1 : 0)}</span>
            </div>
          </div>
          
          {/* Connection Quality - Desktop only */}
          <div className="hidden md:flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-lg">
            {connectionQuality === "excellent" && <Wifi className="w-4 h-4 text-green-500" />}
            {connectionQuality === "good" && <Wifi className="w-4 h-4 text-yellow-500" />}
            {connectionQuality === "poor" && <WifiOff className="w-4 h-4 text-red-500" />}
            <span className="text-xs font-medium text-muted-foreground capitalize">{connectionQuality}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
          {/* Lecture Transcription Menu - Only for Host - Hide on very small screens */}
          {isLocalUserHost && isGroqConfigured && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={isRecording ? "destructive" : "outline"} 
                  size="sm"
                  className={`h-7 sm:h-8 text-[10px] sm:text-xs hidden xs:flex ${isRecording ? "animate-pulse" : ""}`}
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{isRecording ? 'Recording...' : 'Lecture'}</span>
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Recording status */}
                <div className="px-2 py-2 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quota Used:</span>
                    <span className="font-mono font-semibold">
                      {Math.floor(totalUsedTime / 60000)}:{String(Math.floor((totalUsedTime % 60000) / 1000)).padStart(2, '0')} / 10:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-mono font-semibold text-green-600">
                      {Math.floor(remainingTime / 60000)}:{String(Math.floor((remainingTime % 60000) / 1000)).padStart(2, '0')}
                    </span>
                  </div>
                  {isRecording && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current:</span>
                      <span className="font-mono font-semibold text-red-600">
                        {Math.floor(recordingTime / 60000)}:{String(Math.floor((recordingTime % 60000) / 1000)).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Actions */}
                {isRecording ? (
                  <DropdownMenuItem onClick={stopRecording}>
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop Recording
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={startRecording}
                    disabled={!isConnected || isMuted || remainingTime <= 0}
                  >
                    <MicIcon className="w-4 h-4 mr-2" />
                    {remainingTime <= 0 ? 'Quota Exhausted' : 'Start Recording'}
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowTranscript(true);
                  }}
                  disabled={transcript.length === 0}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Transcript ({transcript.length})
                </DropdownMenuItem>
                
                {transcript.length > 0 && (
                  <>
                    <DropdownMenuItem onClick={() => {
                      const text = transcript.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n');
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `transcript_${roomName}_${new Date().toISOString()}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Transcript
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={clearTranscript}
                      className="text-destructive"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Clear Transcript
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Audio & Video Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-3">
                  <Label htmlFor="mic-select" className="text-sm font-semibold flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Microphone
                  </Label>
                  <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                    <SelectTrigger id="mic-select" className="h-11">
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {getDeviceLabel(device, 'Microphone')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="camera-select" className="text-sm font-semibold flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Camera
                  </Label>
                  <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                    <SelectTrigger id="camera-select" className="h-11">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {getDeviceLabel(device, 'Camera')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isMuted && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-sm font-semibold">Audio Level</Label>
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={handleLeaveRequest} className="h-8 sm:h-9 px-2 sm:px-3">
            <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-2">Leave</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Grid */}
          <div className="flex-1 p-2 sm:p-4 lg:p-6 overflow-auto">
            {/* Responsive layout: Stack on mobile, side-by-side on large screens */}
            {/* Dynamic grid: Full width when alone, 2-column grid when participants present */}
            <div className={`h-full flex flex-col ${participants.length > 0 ? 'lg:grid lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_360px]' : ''} gap-3 sm:gap-4 lg:gap-6`}>
              {/* Main presenter video - Pinned participant OR Local participant */}
              <div className="flex-1 min-h-[200px] sm:min-h-[300px] lg:min-h-0">
                <Card className="h-full relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg sm:rounded-xl">
                  {/* Pinned video container - shown when someone is pinned */}
                  <div 
                    ref={pinnedVideoRef} 
                    className="absolute inset-0"
                    style={{ display: pinnedParticipantIdentity ? 'block' : 'none' }}
                  />
                  
                  {/* Local video container - hidden when someone is pinned */}
                  <div 
                    ref={localVideoRef} 
                    className="absolute inset-0" 
                    style={{ display: pinnedParticipantIdentity ? 'none' : (isVideoOn ? 'block' : 'none') }}
                  />
                  
                  {/* Placeholder overlays - only show when no pinned video AND not connected/video off */}
                  {!pinnedParticipantIdentity && (
                    <>
                      {!isConnected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                              <Video className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                            </div>
                            <h3 className="text-sm sm:text-lg font-semibold">Connecting to room...</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">Please wait</p>
                          </div>
                        </div>
                      )}
                      
                      {isConnected && !isVideoOn && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                              <VideoOff className="w-7 h-7 sm:w-10 sm:h-10 text-muted-foreground" />
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Camera is off</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Hand raised icon for local participant */}
                      {isConnected && handRaised && (
                        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-yellow-500/95 text-white p-1.5 sm:p-2 rounded-full z-10 animate-bounce">
                          <Hand className="w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                      )}
                      
                      {/* Name label for local participant */}
                      {isConnected && localParticipant && (
                        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/70 backdrop-blur-sm text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg z-10">
                          {isLocalUserHost 
                            ? `${localParticipant.identity} (You, Host)` 
                            : `${localParticipant.identity} (You)`
                          }
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Controls */}
                  <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex gap-1 sm:gap-2 z-10">
                    <Button
                      size="sm"
                      variant={isFullscreen ? "secondary" : "outline"}
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      {isFullscreen ? <Minimize className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </Button>
                    {isScreenSharing && <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Screen Sharing</Badge>}
                  </div>
                </Card>
              </div>

              {/* Remote participants - chỉ hiện khi có người khác */}
              {participants.length > 0 && (
                <div className="flex flex-col gap-2 sm:gap-4 max-h-[180px] sm:max-h-[240px] lg:max-h-none lg:flex-1 overflow-auto">
                  <div ref={remoteVideosRef} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 auto-rows-max">
                    {!isConnected && (
                      // Show placeholder participants when not connected
                      <>
                        {[1, 2, 3, 4].map((id) => (
                          <Card key={id} className="relative aspect-video overflow-hidden rounded-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-secondary rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                                  <VideoOff className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                </div>
                                <p className="text-[10px] sm:text-xs font-medium truncate px-1 sm:px-2">Waiting...</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="border-t bg-card/80 backdrop-blur-sm px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-5">
            <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-5">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleMute}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              </Button>
              
              <Button
                variant={!isVideoOn ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleVideo}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all"
                title={isVideoOn ? "Turn off camera" : "Turn on camera"}
              >
                {!isVideoOn ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              </Button>
              
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                onClick={toggleScreenShare}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all"
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              </Button>
              
              <Button 
                variant={handRaised ? "default" : "secondary"}
                size="lg" 
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all"
                onClick={toggleHandRaise}
                title={handRaised ? "Lower hand" : "Raise hand"}
              >
                <Hand className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${handRaised ? 'animate-bounce' : ''}`} />
              </Button>
              
              <Button 
                variant={showChat ? "default" : "secondary"}
                size="lg" 
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all relative"
                onClick={() => setShowChat(!showChat)}
                title={showChat ? "Hide chat" : "Show chat"}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                {/* ✅ Unread badge - chấm đỏ góc phải trên */}
                {unreadCount > 0 && !showChat && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ Chat Notification Popup - hiện khi chat đóng và có tin nhắn mới */}
        {!showChat && lastMessage && lastMessage.senderId !== localParticipant?.identity && (
          <div 
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 bg-card border shadow-2xl rounded-xl p-4 max-w-xs sm:max-w-sm animate-in slide-in-from-bottom-5 duration-300 z-50 cursor-pointer hover:shadow-xl transition-all hover:scale-105"
            onClick={() => {
              setShowChat(true);
              clearLastMessageNotification();
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm truncate pr-2">{lastMessage.sender}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-muted flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearLastMessageNotification();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 break-words">{lastMessage.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{lastMessage.timestamp}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Sidebar - Full screen on mobile, sidebar on desktop */}
        {showChat && (
          <div className="fixed inset-0 z-50 lg:relative lg:inset-auto w-full lg:w-80 xl:w-96 border-l bg-background flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base sm:text-lg flex items-center">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  In-call messages
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                  className="h-8 w-8 p-0 hover:bg-accent"
                  title="Close chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              </div>
            </div>
          
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Messages can only be seen by people in the call
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    and are deleted when the call ends.
                  </p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-foreground/90">{message.sender}</span>
                      {message.senderId === "system" && (
                        <Badge variant="outline" className="text-xs h-4 px-1.5">
                          System
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 hover:bg-muted/70 transition-colors">
                      <p className="text-sm text-foreground leading-relaxed break-words">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-3 sm:p-6 border-t flex-shrink-0">
            <div className="flex items-end gap-2">
              <Input
                placeholder="Send a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1 min-h-[40px] sm:min-h-[44px] resize-none text-sm"
              />
              <Button 
                size="default" 
                onClick={sendMessage} 
                disabled={!chatMessage.trim()}
                className="h-[40px] w-[40px] sm:h-[44px] sm:w-[44px] p-0 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={handleCancelLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-destructive" />
              Leave Meeting?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to leave this meeting?</p>
              <p className="text-sm">Your camera and microphone will be turned off, and you'll be disconnected from the room.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>
              Stay in Meeting
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLeave}
              className="bg-destructive hover:bg-destructive/90"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Leave Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Lecture Transcript
              {isProcessing && (
                <Badge variant="secondary" className="text-xs">
                  Processing...
                </Badge>
              )}
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse text-xs">
                  Recording
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {transcriptionError && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{transcriptionError}</AlertDescription>
            </Alert>
          )}
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {transcript.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No transcript available yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start recording to generate transcript.
                  </p>
                </div>
              ) : (
                transcript.map((segment) => (
                  <div key={segment.id} className="space-y-1 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <p className="text-xs text-muted-foreground font-mono">{segment.timestamp}</p>
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classroom;