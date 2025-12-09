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
  Settings,
  Monitor,
  ChevronDown,
  Volume2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { useMediaPreview } from "@/hooks/useMediaPreview";

const PreJoinScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [roomCode, setRoomCode] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  
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

  // Get room code from URL
  useEffect(() => {
    const room = searchParams.get('room');
    if (room) {
      setRoomCode(room);
    } else {
      navigate('/meet');
    }
  }, [searchParams, navigate]);

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
    setIsJoining(true);
    
    // Save preferences
    localStorage.setItem("livekit-camera-enabled", String(isCameraOn));
    localStorage.setItem("livekit-mic-enabled", String(isMicOn));
    localStorage.setItem("livekit-selected-audio", selectedAudioDevice);
    localStorage.setItem("livekit-selected-video", selectedVideoDevice);
    
    cleanup();
    stopMonitoring();
    
    // Navigate to classroom
    navigate(`/classroom?room=${roomCode}`);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Video Preview Section */}
        <div className="relative">
          <Card className="overflow-hidden bg-gray-900 aspect-video">
            {isCameraOn ? (
              <div ref={videoRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white">
                <VideoOff className="w-16 h-16 mb-4 text-gray-400" />
                <p className="text-lg">Camera is off</p>
              </div>
            )}
          </Card>

          {/* Control Bar */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-gray-800/90 backdrop-blur-sm px-4 py-3 rounded-full">
            <Button
              variant={isMicOn ? "default" : "destructive"}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={toggleMic}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={isCameraOn ? "default" : "destructive"}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={toggleCamera}
            >
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>

          {/* Audio Level Indicator */}
          {isMicOn && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-full">
              <Mic className="w-4 h-4 text-white" />
              <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Device Settings */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-gray-600" />
              <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                <SelectTrigger className="flex-1">
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

            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-gray-600" />
              <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                <SelectTrigger className="flex-1">
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

            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <Select value={selectedAudioOutput} onValueChange={setSelectedAudioOutput}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select speaker" />
                </SelectTrigger>
                <SelectContent>
                  {audioOutputDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Ready to join?</h1>
            <p className="text-gray-600">Meeting code: <span className="font-mono font-semibold">{roomCode}</span></p>
            <p className="text-sm text-gray-500">
              {user ? `Joining as ${user.name || user.email}` : 'Joining as guest'}
            </p>
          </div>

          <Button 
            size="lg" 
            className="px-8 py-6 text-lg"
            onClick={handleJoinMeeting}
            disabled={isJoining}
          >
            {isJoining ? "Joining..." : "Join Meeting"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreJoinScreen;
