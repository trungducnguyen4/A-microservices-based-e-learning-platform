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
  Trash,
  Copy,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/hooks/useClassroom";
import { useChat } from "@/hooks/useChat";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { getDeviceLabel } from "@/utils/deviceManager";
import { useLeaveConfirmation } from "@/hooks/useLeaveConfirmation";
import { useTranscription } from "@/hooks/useTranscription";
import { cleanupOldRoomData, hasJoinedRoom } from "@/utils/roomPersistence";
import { summarizeTranscript, exportTranscriptSummary } from "@/utils/transcriptHelper";
import { ParticipantList } from "@/components/ParticipantList";

// Copy Link Button Component
const CopyLinkButton = ({ roomCode }: { roomCode: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copyLink = () => {
    const link = `${window.location.origin}/prejoin?room=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copyLink}
      className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 hover:bg-primary/10"
      title="Copy room link"
    >
      {copied ? (
        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
      )}
    </Button>
  );
};

const Classroom = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get initial media settings from PreJoin or fallback to localStorage
  const preJoinState = location.state as { isCameraOn?: boolean; isMicOn?: boolean } | null;
  const initialCameraOn = preJoinState?.isCameraOn ?? 
    JSON.parse(localStorage.getItem('livekit-camera-enabled') || 'true');
  const initialMicOn = preJoinState?.isMicOn ?? 
    JSON.parse(localStorage.getItem('livekit-mic-enabled') || 'true');

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
  const [showParticipants, setShowParticipants] = useState(false); // ✅ Participants list ẩn khi vào meeting
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // End meeting dialogs
  const [showSummarizeDialog, setShowSummarizeDialog] = useState(false);
  const [showEndMeetingDialog, setShowEndMeetingDialog] = useState(false);
  const [showSummaryResultDialog, setShowSummaryResultDialog] = useState(false);
  const [summarizeChoice, setSummarizeChoice] = useState<boolean | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<any>(null);
  
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
  
  // Media permissions hook - để check quyền camera/mic
  const {
    hasCameraPermission,
    hasMicrophonePermission,
    isCameraDenied,
    isMicrophoneDenied,
  } = useMediaPermissions();
  
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
    raisedHands,
    localVideoRef,
    remoteVideosRef,
    pinnedVideoRef,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    leaveRoom,
    kickParticipant,
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

  // ✅ Handler to end meeting for all (Host only)
  const handleEndMeetingForAll = async () => {
    if (!isLocalUserHost || !user?.id || !roomName) {
      console.error('[Classroom] Cannot end meeting: not host or missing data');
      return;
    }

    // Check if there is transcript to summarize
    const hasTranscript = transcript.length > 0;
    
    if (hasTranscript) {
      // Show summarize dialog first
      setShowSummarizeDialog(true);
    } else {
      // No transcript, go straight to end meeting confirmation
      setShowEndMeetingDialog(true);
    }
  };
  
  // Handle summarize dialog response
  const handleSummarizeResponse = async (wantSummary: boolean) => {
    setShowSummarizeDialog(false);
    
    if (wantSummary) {
      // Generate summary and show result
      setIsSummarizing(true);
      try {
        console.log('[Classroom] Generating transcript summary...');
        const summary = await summarizeTranscript(transcript, roomName);
        setGeneratedSummary(summary);
        setIsSummarizing(false);
        setShowSummaryResultDialog(true);
      } catch (error) {
        console.error('[Classroom] ❌ Failed to generate summary:', error);
        setIsSummarizing(false);
        // Show error but continue to end meeting
        setShowEndMeetingDialog(true);
      }
    } else {
      // Skip summary, go to end meeting
      setShowEndMeetingDialog(true);
    }
  };
  
  // Handle summary result dialog actions
  const handleDownloadSummary = () => {
    if (generatedSummary) {
      exportTranscriptSummary(generatedSummary, roomName, transcript);
      console.log('[Classroom] ✅ Summary downloaded');
    }
    setShowSummaryResultDialog(false);
    setShowEndMeetingDialog(true);
  };

  const handleSkipDownload = () => {
    setShowSummaryResultDialog(false);
    setShowEndMeetingDialog(true);
  };
  
  // Execute end meeting
  const executeEndMeeting = async () => {
    setShowEndMeetingDialog(false);
    
    try {
      // End the meeting
      const { classroomService } = await import('@/services/classroomApi');
      await classroomService.endRoom(roomName, user.id);
      
      console.log('[Classroom] ✅ Meeting ended for all participants');
      
      // Disconnect and redirect
      leaveRoom();
      setTimeout(() => {
        window.location.href = '/meet';
      }, 500);
    } catch (error) {
      console.error('[Classroom] ❌ Failed to end meeting:', error);
    }
  };

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
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-1 min-w-0">
          {/* Room Name */}
          <h1 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold tracking-tight truncate max-w-[60px] xs:max-w-[80px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-none">{roomName}</h1>
          
          {/* Copy Link Button */}
          <CopyLinkButton roomCode={roomName} />
          
          {/* Live Status Badge with Connection Quality */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Badge variant="secondary" className="bg-green-500/15 text-green-600 border-green-500/20 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs flex items-center gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">{isConnected ? 'Live' : 'Connecting...'}</span>
              {/* Mobile: Show connection quality icon */}
              <span className="sm:hidden">
                {connectionQuality === "excellent" && <Wifi className="w-3 h-3" />}
                {connectionQuality === "good" && <Wifi className="w-3 h-3 text-yellow-500" />}
                {connectionQuality === "poor" && <WifiOff className="w-3 h-3 text-red-500" />}
              </span>
            </Badge>
          </div>
          
          {/* Connection Quality - Desktop only */}
          <div className="hidden md:flex items-center gap-2 bg-muted/40 px-2 md:px-3 py-1 md:py-1.5 rounded-lg">
            {connectionQuality === "excellent" && <Wifi className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />}
            {connectionQuality === "good" && <Wifi className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-500" />}
            {connectionQuality === "poor" && <WifiOff className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />}
            <span className="text-[10px] md:text-xs font-medium text-muted-foreground capitalize">{connectionQuality}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
          {/* Lecture Transcription Menu - Only for Host */}
          {isLocalUserHost && isGroqConfigured && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={isRecording ? "destructive" : "outline"} 
                  size="sm"
                  className={`h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs px-2 sm:px-3 flex items-center ${
                    isRecording ? "animate-pulse" : ""
                  }`}
                >
                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 sm:mr-1" />
                  <span className="hidden xs:inline">{isRecording ? 'Recording...' : 'Lecture'}</span>
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 xs:ml-1" />
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

                {/* ✅ End Meeting for All - Host only */}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleEndMeetingForAll}
                  disabled={isSummarizing}
                  className="text-destructive font-semibold"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  {isSummarizing ? 'Generating Summary...' : 'End Meeting for All'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 p-0">
                <Settings className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                    style={{ display: pinnedParticipantIdentity ? 'none' : 'block' }}
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
          <div className="border-t bg-card/80 backdrop-blur-sm px-1.5 xs:px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-5">
            <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 lg:gap-5">
              <Button
                variant={isMuted || isMicrophoneDenied ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleMute}
                disabled={isMicrophoneDenied}
                className={`rounded-full w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all p-0 ${
                  isMicrophoneDenied ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={
                  isMicrophoneDenied 
                    ? "Microphone access denied. Please allow microphone access in your browser settings." 
                    : isMuted ? "Unmute" : "Mute"
                }
              >
                {isMuted || isMicrophoneDenied ? <MicOff className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Mic className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              </Button>
              
              <Button
                variant={!isVideoOn || isCameraDenied ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleVideo}
                disabled={isCameraDenied}
                className={`rounded-full w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all p-0 ${
                  isCameraDenied ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={
                  isCameraDenied 
                    ? "Camera access denied. Please allow camera access in your browser settings." 
                    : isVideoOn ? "Turn off camera" : "Turn on camera"
                }
              >
                {!isVideoOn || isCameraDenied ? <VideoOff className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Video className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              </Button>
              
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                onClick={toggleScreenShare}
                className="rounded-full w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all p-0 hidden xs:flex items-center justify-center"
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <MonitorOff className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Monitor className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              </Button>
              
              <Button 
                variant={handRaised ? "default" : "secondary"}
                size="lg" 
                className="rounded-full w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all p-0"
                onClick={toggleHandRaise}
                title={handRaised ? "Lower hand" : "Raise hand"}
              >
                <Hand className={`w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${handRaised ? 'animate-bounce' : ''}`} />
              </Button>
              
              <Button 
                variant={showChat ? "default" : "secondary"}
                size="lg" 
                className="rounded-full w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all relative p-0"
                onClick={() => setShowChat(!showChat)}
                title={showChat ? "Hide chat" : "Show chat"}
              >
                <MessageSquare className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                {/* ✅ Unread badge - chấm đỏ góc phải trên */}
                {unreadCount > 0 && !showChat && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </Button>
              
              <Button 
                variant={showParticipants ? "default" : "secondary"}
                size="lg" 
                className="rounded-full w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md hover:shadow-lg transition-all p-0"
                onClick={() => setShowParticipants(!showParticipants)}
                title={showParticipants ? "Hide participants" : "Show participants"}
              >
                <Users className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </Button>
              
              {/* More Menu cho mobile - chứa screen share và các option khác */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary"
                    size="lg" 
                    className="rounded-full w-9 h-9 xs:hidden shadow-md hover:shadow-lg transition-all p-0"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={toggleScreenShare}>
                    {isScreenSharing ? <MonitorOff className="w-4 h-4 mr-2" /> : <Monitor className="w-4 h-4 mr-2" />}
                    {isScreenSharing ? "Stop Sharing" : "Share Screen"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEndMeetingForAll} className="text-destructive">
                    <PhoneOff className="w-4 h-4 mr-2" />
                    Leave Meeting
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <div className="px-3 xs:px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm xs:text-base sm:text-lg flex items-center">
                  <MessageSquare className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  <span className="hidden xs:inline">In-call messages</span>
                  <span className="xs:hidden">Chat</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                  className="h-7 w-7 xs:h-8 xs:w-8 p-0 hover:bg-accent"
                  title="Close chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="xs:w-[18px] xs:h-[18px]">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              </div>
            </div>
          
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-3 xs:p-4 sm:p-6 space-y-2 sm:space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-6 xs:py-8 sm:py-12">
                  <MessageSquare className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
                  <p className="text-[11px] xs:text-xs sm:text-sm text-muted-foreground px-2">
                    Messages can only be seen by people in the call
                  </p>
                  <p className="text-[10px] xs:text-[10px] sm:text-xs text-muted-foreground mt-1">
                    and are deleted when the call ends.
                  </p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className="space-y-0.5 xs:space-y-1">
                    <div className="flex items-center space-x-1.5 xs:space-x-2">
                      <span className="text-[10px] xs:text-xs font-semibold text-foreground/90 truncate max-w-[120px] xs:max-w-none">{message.sender}</span>
                      {message.senderId === "system" && (
                        <Badge variant="outline" className="text-[9px] xs:text-xs h-3.5 xs:h-4 px-1 xs:px-1.5">
                          System
                        </Badge>
                      )}
                      <span className="text-[9px] xs:text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 hover:bg-muted/70 transition-colors">
                      <p className="text-xs xs:text-sm text-foreground leading-relaxed break-words">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-2 xs:p-3 sm:p-6 border-t flex-shrink-0">
            <div className="flex items-end gap-1.5 xs:gap-2">
              <Input
                placeholder="Send a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1 min-h-[36px] xs:min-h-[40px] sm:min-h-[44px] resize-none text-xs xs:text-sm"
              />
              <Button 
                size="default" 
                onClick={sendMessage} 
                disabled={!chatMessage.trim()}
                className="h-[36px] w-[36px] xs:h-[40px] xs:w-[40px] sm:h-[44px] sm:w-[44px] p-0 shrink-0"
              >
                <Send className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Participants List - Full screen on mobile, sidebar on desktop */}
        {showParticipants && (
          <div className="fixed inset-0 z-50 lg:relative lg:inset-auto w-full lg:w-80 xl:w-96 bg-background flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <ParticipantList
              localParticipant={localParticipant}
              participants={participants}
              isLocalUserHost={isLocalUserHost}
              hostUserId={hostUserId}
              raisedHands={raisedHands}
              onKickParticipant={kickParticipant}
              onClose={() => setShowParticipants(false)}
            />
          </div>
        )}

      </div>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={handleCancelLeave}>
        <AlertDialogContent className="w-[90vw] xs:w-[85vw] sm:w-auto max-w-md p-4 xs:p-5 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base sm:text-lg">
              <LogOut className="w-4 h-4 xs:w-5 xs:h-5 text-destructive flex-shrink-0" />
              <span>Leave Meeting?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-1.5 xs:space-y-2">
              <p className="text-xs xs:text-sm break-words">Are you sure you want to leave this meeting?</p>
              <p className="text-[11px] xs:text-xs sm:text-sm break-words">Your camera and microphone will be turned off, and you'll be disconnected from the room.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col xs:flex-row gap-2 xs:gap-3 mt-3 xs:mt-4">
            <AlertDialogCancel onClick={handleCancelLeave} className="w-full xs:w-auto text-xs xs:text-sm m-0">
              Stay in Meeting
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLeave}
              className="w-full xs:w-auto bg-destructive hover:bg-destructive/90 text-xs xs:text-sm"
            >
              <PhoneOff className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2" />
              Leave Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summarize Transcript Dialog */}
      <AlertDialog open={showSummarizeDialog} onOpenChange={setShowSummarizeDialog}>
        <AlertDialogContent className="w-[90vw] xs:w-[85vw] sm:w-auto max-w-md max-h-[90vh] flex flex-col p-4 xs:p-5 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base sm:text-lg">
              <FileText className="w-4 h-4 xs:w-5 xs:h-5 text-primary flex-shrink-0" />
              <span className="line-clamp-2">Generate Transcript Summary?</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-2 xs:space-y-3">
                  <p className="text-xs xs:text-sm break-words">You have <strong>{transcript.length} transcript segment(s)</strong>.</p>
                  <p className="text-xs xs:text-sm break-words">Would you like to generate an AI-powered summary before ending the meeting?</p>
                  <div className="bg-muted/50 rounded-lg p-2.5 xs:p-3 space-y-1.5 xs:space-y-2 text-xs xs:text-sm">
                    <div className="flex items-start gap-1.5 xs:gap-2">
                      <span className="text-green-500 font-semibold flex-shrink-0">✓</span>
                      <span className="break-words">Comprehensive summary of main topics</span>
                    </div>
                    <div className="flex items-start gap-1.5 xs:gap-2">
                      <span className="text-green-500 font-semibold flex-shrink-0">✓</span>
                      <span className="break-words">Key points extracted automatically</span>
                    </div>
                    <div className="flex items-start gap-1.5 xs:gap-2">
                      <span className="text-green-500 font-semibold flex-shrink-0">✓</span>
                      <span className="break-words">Full transcript included in download</span>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col xs:flex-row gap-2 xs:gap-3 mt-3 xs:mt-4">
            <AlertDialogCancel onClick={() => handleSummarizeResponse(false)} className="w-full xs:w-auto text-xs xs:text-sm m-0">
              No, Skip Summary
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleSummarizeResponse(true)}
              className="w-full xs:w-auto bg-primary hover:bg-primary/90 text-xs xs:text-sm"
            >
              <FileText className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2" />
              Yes, Generate Summary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Result Dialog */}
      <AlertDialog open={showSummaryResultDialog} onOpenChange={setShowSummaryResultDialog}>
        <AlertDialogContent className="w-[95vw] xs:w-[90vw] sm:w-[85vw] max-w-2xl max-h-[90vh] flex flex-col p-4 xs:p-5 sm:p-6 border-border">
          <AlertDialogHeader className="flex-shrink-0">
            <AlertDialogTitle className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base sm:text-lg">
              <FileText className="w-4 h-4 xs:w-5 xs:h-5 text-primary flex-shrink-0" />
              <span className="line-clamp-2">Summary Generated Successfully</span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <AlertDialogDescription asChild>
            <div className="flex-1 overflow-y-auto pr-1 xs:pr-2 min-h-0">
              <div className="space-y-2 xs:space-y-3">
                <p className="font-medium text-foreground text-xs xs:text-sm">Your lecture summary is ready!</p>
                {generatedSummary && (
                  <div className="bg-muted/50 rounded-lg p-2.5 xs:p-3 sm:p-4 space-y-2 xs:space-y-3">
                    <div className="space-y-0.5 xs:space-y-1">
                      <p className="text-[10px] xs:text-xs text-muted-foreground break-words">Generated: {new Date(generatedSummary.timestamp).toLocaleString()}</p>
                      <p className="text-[10px] xs:text-xs text-muted-foreground">Duration: {generatedSummary.duration} | Segments: {generatedSummary.totalSegments}</p>
                    </div>
                    
                    <div className="space-y-1.5 xs:space-y-2">
                      <p className="text-xs xs:text-sm font-semibold text-foreground">Summary:</p>
                      <p className="text-[11px] xs:text-xs sm:text-sm leading-relaxed break-words">{generatedSummary.summary}</p>
                    </div>
                    
                    {generatedSummary.keyPoints && generatedSummary.keyPoints.length > 0 && (
                      <div className="space-y-1.5 xs:space-y-2">
                        <p className="text-xs xs:text-sm font-semibold text-foreground">Key Points:</p>
                        <ul className="list-disc list-inside space-y-0.5 xs:space-y-1 text-[11px] xs:text-xs sm:text-sm">
                          {generatedSummary.keyPoints.map((point: string, idx: number) => (
                            <li key={idx} className="break-words">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
          
          <AlertDialogFooter className="flex-col xs:flex-row gap-2 xs:gap-3 mt-3 xs:mt-4 flex-shrink-0">
            <AlertDialogCancel onClick={handleSkipDownload} className="w-full xs:w-auto text-xs xs:text-sm m-0">
              Cancel (Don't Download)
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDownloadSummary}
              className="w-full xs:w-auto bg-primary hover:bg-primary/90 text-xs xs:text-sm"
            >
              <FileText className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2" />
              Download Summary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Meeting Confirmation Dialog */}
      <AlertDialog open={showEndMeetingDialog} onOpenChange={setShowEndMeetingDialog}>
        <AlertDialogContent className="w-[90vw] xs:w-[85vw] sm:w-auto max-w-md max-h-[90vh] flex flex-col p-4 xs:p-5 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base sm:text-lg">
              <PhoneOff className="w-4 h-4 xs:w-5 xs:h-5 text-destructive flex-shrink-0" />
              <span className="line-clamp-2">End Meeting for Everyone?</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-2 xs:space-y-3">
                  <p className="font-semibold text-foreground text-xs xs:text-sm break-words">This action cannot be undone.</p>
                  <div className="bg-destructive/10 rounded-lg p-2.5 xs:p-3 space-y-1.5 xs:space-y-2 text-xs xs:text-sm">
                    <div className="flex items-start gap-1.5 xs:gap-2">
                      <span className="text-destructive flex-shrink-0">•</span>
                      <span className="break-words">All participants will be disconnected</span>
                    </div>
                    <div className="flex items-start gap-1.5 xs:gap-2">
                      <span className="text-destructive flex-shrink-0">•</span>
                      <span className="break-words">Chat messages will be deleted</span>
                    </div>
                    <div className="flex items-start gap-1.5 xs:gap-2">
                      <span className="text-destructive flex-shrink-0">•</span>
                      <span className="break-words">The room will be closed permanently</span>
                    </div>
                  </div>
                  {isSummarizing && (
                    <div className="flex items-center gap-1.5 xs:gap-2 text-primary">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 xs:h-4 xs:w-4 border-2 border-primary border-t-transparent flex-shrink-0"></div>
                      <span className="text-xs xs:text-sm font-medium">Generating summary...</span>
                    </div>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col xs:flex-row gap-2 xs:gap-3 mt-3 xs:mt-4">
            <AlertDialogCancel 
              disabled={isSummarizing}
              onClick={() => {
                setShowEndMeetingDialog(false);
                setSummarizeChoice(null);
              }}
              className="w-full xs:w-auto text-xs xs:text-sm m-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeEndMeeting}
              disabled={isSummarizing}
              className="w-full xs:w-auto bg-destructive hover:bg-destructive/90 text-xs xs:text-sm"
            >
              <PhoneOff className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2" />
              {isSummarizing ? 'Please Wait...' : 'End Meeting for All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="w-[95vw] xs:w-[90vw] sm:w-[85vw] max-w-3xl max-h-[90vh] flex flex-col p-4 xs:p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base sm:text-lg flex-wrap">
              <FileText className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
              <span>Lecture Transcript</span>
              {isProcessing && (
                <Badge variant="secondary" className="text-[10px] xs:text-xs h-5 xs:h-auto">
                  Processing...
                </Badge>
              )}
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse text-[10px] xs:text-xs h-5 xs:h-auto">
                  Recording
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {transcriptionError && (
            <Alert variant="destructive" className="mb-2 xs:mb-3">
              <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              <AlertDescription className="text-xs xs:text-sm">{transcriptionError}</AlertDescription>
            </Alert>
          )}
          
          <ScrollArea className="flex-1 pr-2 xs:pr-3 sm:pr-4">
            <div className="space-y-2 xs:space-y-3">
              {transcript.length === 0 ? (
                <div className="text-center py-8 xs:py-10 sm:py-12">
                  <FileText className="w-10 h-10 xs:w-12 xs:h-12 text-muted-foreground mx-auto mb-2 xs:mb-3" />
                  <p className="text-xs xs:text-sm text-muted-foreground break-words px-2">
                    No transcript available yet.
                  </p>
                  <p className="text-[10px] xs:text-xs text-muted-foreground mt-1 break-words px-2">
                    Start recording to generate transcript.
                  </p>
                </div>
              ) : (
                transcript.map((segment) => (
                  <div key={segment.id} className="space-y-0.5 xs:space-y-1 p-2 xs:p-2.5 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <p className="text-[10px] xs:text-xs text-muted-foreground font-mono break-all">{segment.timestamp}</p>
                    <p className="text-xs xs:text-sm leading-relaxed break-words">{segment.text}</p>
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