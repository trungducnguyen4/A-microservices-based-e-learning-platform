import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Plus, LogIn, Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
import { useMeeting } from "@/hooks/useMeeting";

const MeetingHome = () => {
  const { user } = useAuth();
  const {
    joinCode,
    isCreating,
    isJoining,
    joinError,
    showConfirmDialog,
    pendingRoomCode,
    setJoinCode,
    handleNewMeeting,
    handleConfirmCreateMeeting,
    handleJoinMeeting,
    handleInstantMeeting,
    setShowConfirmDialog,
    clearJoinError,
  } = useMeeting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header - Responsive */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-lg sm:text-xl font-bold">E-Learning Meet</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {user ? `Welcome, ${user.name}` : 'Video Meetings for Everyone'}
                </p>
              </div>
            </div>
            
            {/* Instant Meeting Button */}
            <Button 
              onClick={handleInstantMeeting} 
              disabled={isCreating}
              className="h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Start Instant Meeting</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        {/* Hero Section - Mobile first */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
            Video meetings for your e-learning
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Connect instantly with HD video conferencing for classes, study groups, and more
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Left: New Meeting / Join Meeting - Takes 3 cols on lg */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12">
                <TabsTrigger value="new" className="text-xs sm:text-sm">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  New Meeting
                </TabsTrigger>
                <TabsTrigger value="join" className="text-xs sm:text-sm">
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Join Meeting
                </TabsTrigger>
              </TabsList>

              {/* New Meeting Tab */}
              <TabsContent value="new" className="mt-4 sm:mt-6">
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                      Create New Meeting
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Start a video meeting instantly with a unique room code
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 sm:p-6 text-center">
                      <Video className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-primary" />
                      <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">Ready to start?</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                        Click the button below to create a new meeting room with a unique code
                      </p>
                      <Button 
                        size="lg" 
                        className="w-full h-11 sm:h-12 text-sm sm:text-base" 
                        onClick={handleNewMeeting}
                        disabled={isCreating}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        {isCreating ? 'Creating...' : 'Create New Meeting'}
                      </Button>
                    </div>

                    <div className="border-t pt-3 sm:pt-4">
                      <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                        A unique meeting code will be generated (e.g., ABC-DEFG-HIJ)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Join Meeting Tab */}
              <TabsContent value="join" className="mt-4 sm:mt-6">
                <Card className="border-2 border-accent/20">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-accent" />
                      Join a Meeting
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Enter a meeting code to join an existing room
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                          Meeting Code
                        </label>
                        <Input
                          placeholder="e.g., ABC-DEFG-HIJ or ABCDEFGHIJ"
                          value={joinCode}
                          onChange={(e) => {
                            setJoinCode(e.target.value);
                            clearJoinError();
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && !isJoining && handleJoinMeeting()}
                          className={`h-11 sm:h-12 text-sm sm:text-lg font-mono ${joinError ? 'border-red-500' : ''}`}
                          disabled={isJoining}
                        />
                        {joinError ? (
                          <p className="text-[10px] sm:text-xs text-red-500 mt-1.5 sm:mt-2 flex items-center">
                            <span className="mr-1">⚠️</span>
                            {joinError}
                          </p>
                        ) : (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                            Enter the code provided by the meeting host
                          </p>
                        )}
                      </div>

                      <Button 
                        size="lg" 
                        className="w-full h-11 sm:h-12 text-sm sm:text-base" 
                        onClick={handleJoinMeeting}
                        variant="secondary"
                        disabled={isJoining}
                      >
                        <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        {isJoining ? 'Validating...' : 'Join Meeting'}
                      </Button>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-center">
                      <p className="text-[10px] sm:text-sm text-muted-foreground">
                        💡 <strong>Tip:</strong> You can paste the full meeting link or just the code
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Features / Info - Takes 2 cols on lg */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Features Card */}
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">Meeting Features</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Everything you need for effective online learning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Feature Items */}
                <FeatureItem
                  icon={<Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                  bgColor="bg-primary/10"
                  title="HD Video & Audio"
                  description="Crystal clear video and audio quality for seamless communication"
                />
                <FeatureItem
                  icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />}
                  bgColor="bg-accent/10"
                  title="Unlimited Participants"
                  description="Host large classes with unlimited participants"
                />
                <FeatureItem
                  icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                  bgColor="bg-green-500/10"
                  title="Screen Sharing"
                  description="Share your screen to present slides or demonstrations"
                />
                <FeatureItem
                  icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />}
                  bgColor="bg-orange-500/10"
                  title="Real-time Chat"
                  description="Send messages and files during the meeting"
                />
              </CardContent>
            </Card>

            {/* How it works - Hidden on mobile for cleaner look */}
            <Card className="hidden sm:block">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <StepItem number={1} text={<><strong>Create</strong> a new meeting or <strong>Join</strong> with a code</>} />
                <StepItem number={2} text="Set up your camera and microphone" />
                <StepItem number={3} text="Share the meeting code with participants" />
                <StepItem number={4} text="Start teaching or learning together!" />
              </CardContent>
            </Card>

            {/* Quick Start Guide - Mobile only */}
            <div className="sm:hidden bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Quick Start:</strong> Create or join a meeting, then share your code with others
                <ArrowRight className="inline w-3 h-3 ml-1" />
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Start your meeting?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Your meeting code is: 
              <strong className="font-mono text-base sm:text-lg text-primary block mt-2 bg-muted p-2 rounded-lg">
                {pendingRoomCode}
              </strong>
              <span className="block mt-3 text-xs sm:text-sm">
                You can share this code with participants to let them join your meeting.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3">
            <AlertDialogCancel className="h-9 sm:h-10 text-xs sm:text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCreateMeeting}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            >
              Start Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Feature Item Component
const FeatureItem = ({ 
  icon, 
  bgColor, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  bgColor: string; 
  title: string; 
  description: string;
}) => (
  <div className="flex items-start gap-2.5 sm:gap-3">
    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <h4 className="font-semibold text-xs sm:text-sm">{title}</h4>
      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

// Step Item Component
const StepItem = ({ number, text }: { number: number; text: React.ReactNode }) => (
  <div className="flex items-start gap-2.5 sm:gap-3">
    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground text-[10px] sm:text-xs font-bold">
      {number}
    </div>
    <p className="text-xs sm:text-sm">{text}</p>
  </div>
);

export default MeetingHome;
