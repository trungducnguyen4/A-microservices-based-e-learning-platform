import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Phone,
  PhoneOff
} from "lucide-react";

const Classroom = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const participants = [
    { id: 1, name: "John Doe", role: "instructor", isPresenting: true, isMuted: false, hasVideo: true },
    { id: 2, name: "Alice Smith", role: "student", isPresenting: false, isMuted: true, hasVideo: true },
    { id: 3, name: "Bob Johnson", role: "student", isPresenting: false, isMuted: false, hasVideo: false },
    { id: 4, name: "Carol Williams", role: "student", isPresenting: false, isMuted: true, hasVideo: true },
    { id: 5, name: "David Brown", role: "student", isPresenting: false, isMuted: false, hasVideo: true },
    { id: 6, name: "Eva Davis", role: "student", isPresenting: false, isMuted: true, hasVideo: true },
  ];

  const chatMessages = [
    { id: 1, sender: "Alice Smith", message: "Good morning everyone!", timestamp: "10:15 AM", role: "student" },
    { id: 2, sender: "John Doe", message: "Welcome to Advanced React Development! Let's get started.", timestamp: "10:16 AM", role: "instructor" },
    { id: 3, sender: "Bob Johnson", message: "Can you please share the slides?", timestamp: "10:18 AM", role: "student" },
    { id: 4, sender: "Carol Williams", message: "Thanks for the explanation!", timestamp: "10:22 AM", role: "student" },
  ];

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Handle sending message
      setChatMessage("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Advanced React Development</h1>
          <Badge variant="secondary" className="bg-success/10 text-success">
            <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
            Live
          </Badge>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{participants.length} participants</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm">
            <PhoneOff className="w-4 h-4 mr-2" />
            End Class
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4">
            <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main presenter video */}
              <div className="lg:col-span-2">
                <Card className="h-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">John Doe (Instructor)</h3>
                      <p className="text-sm text-muted-foreground">Presenting</p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 flex space-x-2">
                    <Button
                      size="sm"
                      variant={isFullscreen ? "secondary" : "outline"}
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <Badge variant="secondary">Screen Sharing</Badge>
                  </div>
                </Card>
              </div>

              {/* Participant videos */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {participants.slice(1, 5).map((participant) => (
                    <Card key={participant.id} className="relative aspect-video overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                            {participant.hasVideo ? (
                              <Camera className="w-4 h-4" />
                            ) : (
                              <VideoOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs font-medium truncate px-2">{participant.name}</p>
                        </div>
                      </div>
                      <div className="absolute bottom-1 left-1 flex space-x-1">
                        {participant.isMuted && (
                          <div className="w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                            <MicOff className="w-2 h-2 text-destructive-foreground" />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
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
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full w-12 h-12"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="lg"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className="rounded-full w-12 h-12"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className="rounded-full w-12 h-12"
              >
                <Monitor className="w-5 h-5" />
              </Button>
              
              <Button variant="secondary" size="lg" className="rounded-full w-12 h-12">
                <Hand className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </h3>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{message.sender}</span>
                    <Badge variant="outline" className="text-xs">
                      {message.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2">
                    {message.message}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
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