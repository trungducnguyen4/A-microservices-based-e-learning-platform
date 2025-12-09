import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Maximize,
  Minimize,
  PhoneOff,
  MonitorOff,
  AlertCircle,
  Wifi,
  WifiOff,
  Volume2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/hooks/useClassroom";
import { useChat } from "@/hooks/useChat";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { getDeviceLabel } from "@/utils/deviceManager";

const Classroom = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Media states (local)
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  
  // Get room code from URL and auto-join
  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl && user) {
      console.log('[Classroom] Room code from URL:', roomFromUrl);
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
    localVideoRef,
    remoteVideosRef,
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
    isVideoOn,
    isMuted,
    selectedAudioDevice,
    selectedVideoDevice,
  });
  
  // Chat hook
  const {
    chatMessages,
    chatMessage,
    chatEndRef,
    setChatMessage,
    sendMessage,
  } = useChat(room, userName);

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
                          {getDeviceLabel(device, 'Microphone')}
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
                          {getDeviceLabel(device, 'Camera')}
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
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button size="sm" onClick={sendMessage}>
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