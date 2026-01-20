import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2,
  ArrowLeft,
  Settings,
  Loader2,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { useMediaPreview } from "@/hooks/useMediaPreview";
import { hasJoinedRoom, saveRoomSession } from "@/utils/roomPersistence";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const PreJoinScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [roomCode, setRoomCode] = useState("");
  const [checkingTeacher, setCheckingTeacher] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherJoined, setTeacherJoined] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  
  // Load initial state from localStorage (persisted from previous session)
  const [isCameraOn, setIsCameraOn] = useState(() => {
    const saved = localStorage.getItem('livekit-camera-enabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [isMicOn, setIsMicOn] = useState(() => {
    const saved = localStorage.getItem('livekit-mic-enabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [isJoining, setIsJoining] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Use hooks for device management
  const {
    audioDevices,
    videoDevices,
    audioOutputDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    selectedAudioOutput,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
    setSelectedAudioOutput,
  } = useMediaDevices();

  // Media permissions hook - để check quyền camera/mic
  const {
    hasCameraPermission,
    hasMicrophonePermission,
    isCameraDenied,
    isMicrophoneDenied,
  } = useMediaPermissions();

  // Use hooks for audio level monitoring
  const { audioLevel, startMonitoring, stopMonitoring } = useAudioLevel();

  // Use hooks for media preview
  const { videoRef, startPreview, cleanup } = useMediaPreview({
    isCameraOn,
    isMicOn,
    selectedAudioDevice,
    selectedVideoDevice,
    onAudioTrack: (track) => {
      if (isMicOn) {
        startMonitoring(track);
      }
    },
  });

  // Get room code from URL and check if user already joined
  useEffect(() => {
    const room = searchParams.get('room');
    const scheduleId = searchParams.get('scheduleId');
    
    if (room) {
      setRoomCode(room);
      
      // Check if coming from schedule (has scheduleId or can check by joinCode)
      if (scheduleId) {
        checkTeacherStatus(scheduleId);
      } else {
        // Try to check by joinCode (room code)
        checkTeacherStatusByJoinCode(room);
      }
      
      // ✅ CRITICAL: Check if user has already joined this room (skip PreJoin on refresh)
      if (hasJoinedRoom(room)) {
        console.log('[PreJoinScreen] 🔄 User already joined this room, skipping PreJoin');
        
        // Cleanup media before navigating
        cleanup();
        stopMonitoring();
        
        // Load saved preferences
        const savedCameraOn = localStorage.getItem('livekit-camera-enabled');
        const savedMicOn = localStorage.getItem('livekit-mic-enabled');
        
        // Navigate directly to classroom
        navigate(`/classroom?room=${room}`, {
          replace: true,
          state: {
            isCameraOn: savedCameraOn ? JSON.parse(savedCameraOn) : true,
            isMicOn: savedMicOn ? JSON.parse(savedMicOn) : true,
          }
        });
        return;
      } else {
        console.log('[PreJoinScreen] 👋 First time joining this room, showing PreJoin');
      }
    } else {
      navigate('/meet');
    }
  }, [searchParams, navigate, cleanup, stopMonitoring]);

  // Check teacher status for schedule-based joins
  const checkTeacherStatus = async (scheduleId: string) => {
    try {
      setCheckingTeacher(true);
      const response = await api.get(`/schedules/${scheduleId}`);
      const schedule = response.data?.result;
      
      if (schedule) {
        setScheduleData(schedule);
        
        // Check if current user is the teacher
        const currentUserId = user?.id || user?.userId;
        const teacherId = schedule.userId;
        const isTeacherUser = String(currentUserId) === String(teacherId);
        setIsTeacher(isTeacherUser);
        
        // Check if teacher has joined (check participants)
        try {
          const partsResp = await api.get(`/schedules/${scheduleId}/participants`);
          const participants = partsResp.data?.result || partsResp.data || [];
          const teacherInRoom = participants.some((p: any) => 
            String(p.userId) === String(teacherId)
          );
          setTeacherJoined(teacherInRoom);
        } catch (err) {
          console.warn('Failed to check participants', err);
          setTeacherJoined(false);
        }
      }
    } catch (error: any) {
      console.error('Failed to check teacher status:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể kiểm tra trạng thái lớp học',
        variant: 'destructive',
      });
    } finally {
      setCheckingTeacher(false);
    }
  };

  // Check teacher status by join code (when scheduleId not available)
  const checkTeacherStatusByJoinCode = async (joinCode: string) => {
    try {
      setCheckingTeacher(true);
      const response = await api.post('/schedules/join-classroom', { joinCode });
      const result = response.data?.result;
      
      if (result) {
        setScheduleData(result);
        setIsTeacher(result.isTeacher || false);
        setTeacherJoined(result.teacherJoined || false);
      }
    } catch (error: any) {
      console.warn('Failed to check by join code, assuming open room:', error);
      // If API fails, assume it's an open room (no teacher check needed)
      setIsTeacher(false);
      setTeacherJoined(true); // Allow join for open rooms
    } finally {
      setCheckingTeacher(false);
    }
  };

  // Poll teacher status for students waiting
  useEffect(() => {
    const scheduleId = searchParams.get('scheduleId');
    
    // Only poll if: is not teacher, and teacher hasn't joined yet
    if (!isTeacher && !teacherJoined && !checkingTeacher) {
      const interval = setInterval(() => {
        console.log('[PreJoinScreen] 🔄 Polling teacher status...');
        if (scheduleId) {
          checkTeacherStatus(scheduleId);
        } else if (roomCode) {
          checkTeacherStatusByJoinCode(roomCode);
        }
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [searchParams, roomCode, isTeacher, teacherJoined, checkingTeacher]);

  // Load devices and start preview on mount
  useEffect(() => {
    startPreview();
    return () => {
      cleanup();
      stopMonitoring();
    };
  }, []);

  // Restart preview when camera/mic toggles or devices change
  useEffect(() => {
    startPreview();
  }, [isCameraOn, isMicOn, selectedAudioDevice, selectedVideoDevice]);

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    if (!newState) {
      stopMonitoring();
    }
  };

  const handleJoinMeeting = () => {
    // Check if student and teacher hasn't joined yet
    if (!isTeacher && !teacherJoined) {
      toast({
        title: 'Không thể tham gia',
        description: 'Phòng học chưa bắt đầu. Vui lòng chờ giáo viên vào phòng',
        variant: 'destructive',
      });
      return;
    }
    
    setIsJoining(true);
    
    // Save preferences - quan trọng: lưu state hiện tại
    localStorage.setItem("livekit-camera-enabled", JSON.stringify(isCameraOn));
    localStorage.setItem("livekit-mic-enabled", JSON.stringify(isMicOn));
    localStorage.setItem("livekit-selected-audio", selectedAudioDevice);
    localStorage.setItem("livekit-selected-video", selectedVideoDevice);
    
    // ✅ Save room session (for skip PreJoin next time)
    const userName = user?.name || user?.email || 'Guest';
    saveRoomSession(roomCode, userName, user?.id);
    console.log('[PreJoinScreen] 💾 Saved room session');
    
    // Cleanup preview trước khi join
    cleanup();
    stopMonitoring();
    
    // Navigate to classroom với state từ PreJoin
    navigate(`/classroom?room=${roomCode}`, {
      state: {
        isCameraOn,
        isMicOn,
      }
    });
  };

  const handleBack = () => {
    cleanup();
    stopMonitoring();
    navigate('/meet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col">
      {/* Header - Responsive */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold hidden sm:inline">E-Learning Meet</span>
        </div>
        <div className="w-16 sm:w-20" /> {/* Spacer for centering */}
      </header>

      {/* Main Content - Responsive */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* Video Preview Section */}
        <div className="w-full max-w-2xl lg:max-w-xl xl:max-w-2xl flex flex-col gap-3 sm:gap-4">
          {/* Video Card with controls overlay */}
          <Card className="relative overflow-hidden aspect-video shadow-xl rounded-xl sm:rounded-2xl">
            {/* Video container - always rendered, ref always attached */}
            <div ref={videoRef} className="w-full h-full bg-gray-900" />
            
            {/* Placeholder overlay - shown only when camera is off */}
            {!isCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <VideoOff className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <p className="text-sm sm:text-base text-gray-400">Camera is off</p>
              </div>
            )}

            {/* Control Bar - Inside video card */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-3 bg-black/70 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg">
              <Button
                variant={isMicOn && !isMicrophoneDenied ? "secondary" : "destructive"}
                size="icon"
                className={`rounded-full h-10 w-10 sm:h-11 sm:w-11 ${
                  isMicrophoneDenied ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={toggleMic}
                disabled={isMicrophoneDenied}
                title={
                  isMicrophoneDenied
                    ? "Microphone access denied. Please allow microphone access in your browser settings."
                    : isMicOn ? "Mute microphone" : "Unmute microphone"
                }
              >
                {isMicOn && !isMicrophoneDenied ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>

              <Button
                variant={isCameraOn && !isCameraDenied ? "secondary" : "destructive"}
                size="icon"
                className={`rounded-full h-10 w-10 sm:h-11 sm:w-11 ${
                  isCameraDenied ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={toggleCamera}
                disabled={isCameraDenied}
                title={
                  isCameraDenied
                    ? "Camera access denied. Please allow camera access in your browser settings."
                    : isCameraOn ? "Turn off camera" : "Turn on camera"
                }
              >
                {isCameraOn && !isCameraDenied ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </div>

            {/* Audio Level Indicator */}
            {isMicOn && (
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg">
                <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                <div className="w-16 sm:w-20 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Device Settings - Collapsible on mobile, always visible on larger screens */}
          <div className="lg:hidden">
            <Collapsible open={showSettings} onOpenChange={setShowSettings}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Device Settings
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {showSettings ? 'Hide' : 'Show'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <DeviceSettings
                  audioDevices={audioDevices}
                  videoDevices={videoDevices}
                  audioOutputDevices={audioOutputDevices}
                  selectedAudioDevice={selectedAudioDevice}
                  selectedVideoDevice={selectedVideoDevice}
                  selectedAudioOutput={selectedAudioOutput}
                  setSelectedAudioDevice={setSelectedAudioDevice}
                  setSelectedVideoDevice={setSelectedVideoDevice}
                  setSelectedAudioOutput={setSelectedAudioOutput}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Device Settings - Always visible on desktop */}
          <div className="hidden lg:block">
            <DeviceSettings
              audioDevices={audioDevices}
              videoDevices={videoDevices}
              audioOutputDevices={audioOutputDevices}
              selectedAudioDevice={selectedAudioDevice}
              selectedVideoDevice={selectedVideoDevice}
              selectedAudioOutput={selectedAudioOutput}
              setSelectedAudioDevice={setSelectedAudioDevice}
              setSelectedVideoDevice={setSelectedVideoDevice}
              setSelectedAudioOutput={setSelectedAudioOutput}
            />
          </div>
        </div>

        {/* Info Section - Responsive */}
        <div className="w-full max-w-md lg:max-w-sm xl:max-w-md flex flex-col items-center justify-center gap-4 sm:gap-6 py-2 sm:py-4">
          <div className="text-center space-y-3 sm:space-y-4 w-full">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Ready to join?</h1>
            <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-2 sm:space-y-3 shadow-lg">
              <p className="text-muted-foreground text-sm sm:text-base">Meeting code:</p>
              <p className="font-mono font-bold text-xl sm:text-2xl text-primary tracking-wider">{roomCode}</p>
              {scheduleData && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-semibold text-foreground">{scheduleData.title}</p>
                </div>
              )}
              <div className="pt-2 sm:pt-3 border-t">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {user ? `Joining as ${user.name || user.email}` : 'Joining as guest'}
                </p>
              </div>
            </Card>

            {/* Teacher waiting status for students */}
            {scheduleData && !isTeacher && (
              <Card className={`rounded-xl p-4 ${teacherJoined ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-3">
                  {checkingTeacher ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      <p className="text-sm text-gray-700">Đang kiểm tra...</p>
                    </>
                  ) : teacherJoined ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-sm text-green-700 font-medium">Giáo viên đã vào phòng</p>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div className="text-left flex-1">
                        <p className="text-sm text-yellow-700 font-medium">Phòng học chưa bắt đầu</p>
                        <p className="text-xs text-yellow-600 mt-1">Vui lòng chờ giáo viên vào phòng</p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>

          <Button 
            size="lg" 
            className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={handleJoinMeeting}
            disabled={isJoining || checkingTeacher || (scheduleData && !isTeacher && !teacherJoined)}
          >
            {isJoining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining...
              </>
            ) : checkingTeacher ? (
              "Checking..."
            ) : scheduleData && !isTeacher && !teacherJoined ? (
              "Waiting for teacher..."
            ) : (
              "Join Meeting"
            )}
          </Button>

          {/* Quick tips - Hidden on very small screens */}
          <div className="hidden sm:block text-center mt-2">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Check your camera and microphone before joining
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

// Extracted Device Settings Component for reusability
interface DeviceSettingsProps {
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  selectedAudioDevice: string;
  selectedVideoDevice: string;
  selectedAudioOutput: string;
  setSelectedAudioDevice: (value: string) => void;
  setSelectedVideoDevice: (value: string) => void;
  setSelectedAudioOutput: (value: string) => void;
}

const DeviceSettings = ({
  audioDevices,
  videoDevices,
  audioOutputDevices,
  selectedAudioDevice,
  selectedVideoDevice,
  selectedAudioOutput,
  setSelectedAudioDevice,
  setSelectedVideoDevice,
  setSelectedAudioOutput,
}: DeviceSettingsProps) => {
  // Filter out devices with empty deviceId to prevent Radix UI Select error
  const validAudioDevices = audioDevices.filter(d => d.deviceId && d.deviceId.trim() !== '');
  const validVideoDevices = videoDevices.filter(d => d.deviceId && d.deviceId.trim() !== '');
  const validAudioOutputDevices = audioOutputDevices.filter(d => d.deviceId && d.deviceId.trim() !== '');

  return (
    <div className="space-y-2 sm:space-y-3 bg-card rounded-xl p-3 sm:p-4 border shadow-md">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
          <Mic className="w-4 h-4 text-muted-foreground" />
        </div>
        <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
          <SelectTrigger className="flex-1 text-sm">
            <SelectValue placeholder="Select microphone" />
          </SelectTrigger>
          <SelectContent>
            {validAudioDevices.length > 0 ? (
              validAudioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-device" disabled>
                No microphone found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
          <Video className="w-4 h-4 text-muted-foreground" />
        </div>
        <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
          <SelectTrigger className="flex-1 text-sm">
            <SelectValue placeholder="Select camera" />
          </SelectTrigger>
          <SelectContent>
            {validVideoDevices.length > 0 ? (
              validVideoDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-device" disabled>
                No camera found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
        </div>
        <Select value={selectedAudioOutput} onValueChange={setSelectedAudioOutput}>
          <SelectTrigger className="flex-1 text-sm">
            <SelectValue placeholder="Select speaker" />
          </SelectTrigger>
          <SelectContent>
            {validAudioOutputDevices.length > 0 ? (
              validAudioOutputDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-device" disabled>
                No speaker found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PreJoinScreen;
