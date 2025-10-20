import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Mic, MicOff, Volume2 } from "lucide-react";
import { createLocalTracks, LocalTrack } from "livekit-client";

interface PreJoinFormProps {
  onJoin: (userName: string, roomName: string) => void;
}

const PreJoinForm = ({ onJoin }: PreJoinFormProps) => {
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("testroom");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);
  
  const videoRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);

  useEffect(() => {
    // Load saved username from localStorage
    const savedUserName = localStorage.getItem("livekit-username");
    if (savedUserName) {
      setUserName(savedUserName);
    }

    // Load saved room name
    const savedRoomName = localStorage.getItem("livekit-roomname");
    if (savedRoomName) {
      setRoomName(savedRoomName);
    }

    // Get available devices
    loadDevices();

    // Start preview
    startPreview();

    return () => {
      cleanup();
    };
  }, []);
  
  // NO auto-restart useEffect - toggle functions handle it manually

  const loadDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
      
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  const startPreview = async () => {
    try {
      // ✅ TẠO RIÊNG video track
      if (isCameraOn) {
        const videoTracks = await createLocalTracks({
          audio: false,
          video: { deviceId: selectedVideoDevice || undefined },
        });
        
        const videoTrack = videoTracks.find(t => t.kind === 'video');
        if (videoTrack) {
          localTracksRef.current.push(videoTrack);
          if (videoRef.current) {
            const videoElement = videoTrack.attach();
            videoRef.current.innerHTML = '';
            videoRef.current.appendChild(videoElement);
          }
        }
      }
      
      // ✅ TẠO RIÊNG audio track
      if (isMicOn) {
        const audioTracks = await createLocalTracks({
          audio: { deviceId: selectedAudioDevice || undefined },
          video: false,
        });
        
        const audioTrack = audioTracks.find(t => t.kind === 'audio');
        if (audioTrack) {
          localTracksRef.current.push(audioTrack);
          setupAudioMeter(audioTrack.mediaStreamTrack);
        }
      }
    } catch (error) {
      console.error("Error starting preview:", error);
    }
  };

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

  const cleanup = () => {
    // Stop all tracks (đèn TẮT)
    localTracksRef.current.forEach(track => track.stop());
    localTracksRef.current = [];
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  };

  const toggleCamera = async () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    
    if (!newState) {
      // Turn OFF: Stop video track (đèn TẮT)
      const videoTrack = localTracksRef.current.find(t => t.kind === 'video');
      if (videoTrack) {
        console.log('🔴 Stopping video track:', videoTrack);
        videoTrack.stop(); // ← Đèn camera TẮT!
        
        // Get MediaStreamTrack and stop it directly too
        const mediaTrack = videoTrack.mediaStreamTrack;
        if (mediaTrack && mediaTrack.readyState === 'live') {
          console.log('🔴 Stopping MediaStreamTrack:', mediaTrack.readyState);
          mediaTrack.stop();
        }
        
        localTracksRef.current = localTracksRef.current.filter(t => t !== videoTrack);
      }
      // Clear video element
      if (videoRef.current) {
        videoRef.current.innerHTML = '';
      }
    } else {
      // Turn ON: First stop any existing video tracks
      const existingVideoTracks = localTracksRef.current.filter(t => t.kind === 'video');
      existingVideoTracks.forEach(t => {
        t.stop();
        t.mediaStreamTrack?.stop();
      });
      localTracksRef.current = localTracksRef.current.filter(t => t.kind !== 'video');
      
      // Create new video track
      const newTracks = await createLocalTracks({
        audio: false,
        video: { deviceId: selectedVideoDevice || undefined },
      });
      
      const videoTrack = newTracks.find(t => t.kind === 'video');
      if (videoTrack) {
        console.log('🟢 Starting video track:', videoTrack);
        localTracksRef.current.push(videoTrack);
        // Render video
        if (videoRef.current) {
          const videoElement = videoTrack.attach();
          videoRef.current.innerHTML = '';
          videoRef.current.appendChild(videoElement);
        }
      }
    }
  };

  const toggleMic = async () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    
    if (!newState) {
      // Turn OFF: Stop audio track (đèn mic TẮT)
      const audioTrack = localTracksRef.current.find(t => t.kind === 'audio');
      if (audioTrack) {
        console.log('🔴 Stopping audio track:', audioTrack);
        audioTrack.stop(); // ← Đèn mic TẮT!
        
        // Get MediaStreamTrack and stop it directly too
        const mediaTrack = audioTrack.mediaStreamTrack;
        if (mediaTrack && mediaTrack.readyState === 'live') {
          console.log('🔴 Stopping MediaStreamTrack:', mediaTrack.readyState);
          mediaTrack.stop();
        }
        
        localTracksRef.current = localTracksRef.current.filter(t => t !== audioTrack);
      }
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }
      setAudioLevel(0);
    } else {
      // Turn ON: First stop any existing audio tracks
      const existingAudioTracks = localTracksRef.current.filter(t => t.kind === 'audio');
      existingAudioTracks.forEach(t => {
        t.stop();
        t.mediaStreamTrack?.stop();
      });
      localTracksRef.current = localTracksRef.current.filter(t => t.kind !== 'audio');
      
      // Create new audio track
      const newTracks = await createLocalTracks({
        audio: { deviceId: selectedAudioDevice || undefined },
        video: false,
      });
      
      const audioTrack = newTracks.find(t => t.kind === 'audio');
      if (audioTrack) {
        console.log('🟢 Starting audio track:', audioTrack);
        localTracksRef.current.push(audioTrack);
        setupAudioMeter(audioTrack.mediaStreamTrack);
      }
    }
  };

  const handleJoin = () => {
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsLoading(true);
    
    // Save to localStorage
    localStorage.setItem("livekit-username", userName);
    localStorage.setItem("livekit-roomname", roomName);
    localStorage.setItem("livekit-camera-enabled", String(isCameraOn));
    localStorage.setItem("livekit-mic-enabled", String(isMicOn));
    localStorage.setItem("livekit-selected-audio", selectedAudioDevice);
    localStorage.setItem("livekit-selected-video", selectedVideoDevice);
    
    cleanup();
    onJoin(userName, roomName);
  };

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Join Classroom</CardTitle>
          <CardDescription>Set up your audio and video before joining</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Preview */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isCameraOn ? (
              <div ref={videoRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <VideoOff className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Camera is off</p>
                </div>
              </div>
            )}
            
            {/* Controls overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <Button
                variant={isMicOn ? "secondary" : "destructive"}
                size="sm"
                onClick={toggleMic}
                className="rounded-full"
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              <Button
                variant={isCameraOn ? "secondary" : "destructive"}
                size="sm"
                onClick={toggleCamera}
                className="rounded-full"
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
            </div>

            {/* Audio level indicator */}
            {isMicOn && (
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-lg">
                <Volume2 className="w-4 h-4 text-white" />
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Your Name *</Label>
              <Input
                id="username"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomname">Room Name *</Label>
              <Input
                id="roomname"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
          </div>

          {/* Device Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="microphone">Microphone</Label>
              <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                <SelectTrigger id="microphone">
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
              <Label htmlFor="camera">Camera</Label>
              <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                <SelectTrigger id="camera">
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
          </div>

          {/* Join Button */}
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleJoin}
            disabled={isLoading || !userName.trim() || !roomName.trim()}
          >
            {isLoading ? "Joining..." : "Join Classroom"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreJoinForm;
