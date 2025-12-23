import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const ClassroomLayoutDemo = () => {
  const [participantCount, setParticipantCount] = useState(6);
  
  // Generate fake participants
  const participants = Array.from({ length: participantCount }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    hasVideo: Math.random() > 0.3, // 70% có video
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Controls */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Classroom Layout Demo</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Number of Participants: {participantCount}
              </label>
              <Slider
                value={[participantCount]}
                onValueChange={(value) => setParticipantCount(value[0])}
                min={1}
                max={30}
                step={1}
                className="w-full max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setParticipantCount(2)}>2 people</Button>
              <Button onClick={() => setParticipantCount(5)}>5 people</Button>
              <Button onClick={() => setParticipantCount(10)}>10 people</Button>
              <Button onClick={() => setParticipantCount(20)}>20 people</Button>
              <Button onClick={() => setParticipantCount(30)}>30 people</Button>
            </div>
          </div>
        </Card>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-6 h-[calc(100vh-200px)]">
          {/* Main presenter video */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-primary-foreground font-bold">M</span>
                </div>
                <h3 className="text-lg font-semibold">Main Video (You or Pinned)</h3>
                <p className="text-sm text-muted-foreground">Camera is off</p>
              </div>
            </div>
          </Card>

          {/* Participants sidebar */}
          <div className="flex flex-col gap-4 overflow-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-max">
              {participants.map((participant) => (
                <Card 
                  key={participant.id} 
                  className="relative aspect-video overflow-hidden"
                >
                  {participant.hasVideo ? (
                    // Mock video
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <div className="text-4xl">📹</div>
                    </div>
                  ) : (
                    // Avatar placeholder
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700">
                      <div 
                        className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-semibold"
                      >
                        {participant.name.charAt(0)}
                      </div>
                    </div>
                  )}
                  
                  {/* Name label */}
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                    {participant.name}
                  </div>

                  {/* Random host badge */}
                  {participant.id === 1 && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Host
                    </div>
                  )}

                  {/* Random hand raise */}
                  {participant.id % 5 === 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1.5 rounded-full">
                      ✋
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Layout Information:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Main video area: Fixed size on left (your video or pinned participant)</li>
            <li>• Participants grid: Scrollable sidebar on right (320px-360px width)</li>
            <li>• Grid: 1 column on mobile, 2 columns on desktop within sidebar</li>
            <li>• When many participants: Grid scrolls vertically, maintains aspect ratio</li>
            <li>• Avatar shown when participant camera is off (70% have video in demo)</li>
            <li>• Host badge, hand raise indicators work with any number of participants</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default ClassroomLayoutDemo;
