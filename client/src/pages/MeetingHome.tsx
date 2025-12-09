import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Plus, LogIn, Calendar, Clock, Users } from "lucide-react";
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">E-Learning Meet</h1>
              <p className="text-sm text-muted-foreground">
                {user ? `Welcome, ${user.name}` : 'Welcome to Video Meetings'}
              </p>
            </div>
          </div>
          
          <Button onClick={handleInstantMeeting} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" />
            Start Instant Meeting
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: New Meeting / Join Meeting */}
          <div className="space-y-6">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Meeting
                </TabsTrigger>
                <TabsTrigger value="join">
                  <LogIn className="w-4 h-4 mr-2" />
                  Join Meeting
                </TabsTrigger>
              </TabsList>

              {/* New Meeting Tab */}
              <TabsContent value="new" className="mt-6">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Video className="w-5 h-5 mr-2 text-primary" />
                      Create New Meeting
                    </CardTitle>
                    <CardDescription>
                      Start a video meeting instantly with a unique room code
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6 text-center">
                      <Video className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <h3 className="text-lg font-semibold mb-2">Ready to start?</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Click the button below to create a new meeting room with a unique code
                      </p>
                      <Button 
                        size="lg" 
                        className="w-full" 
                        onClick={handleNewMeeting}
                        disabled={isCreating}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        {isCreating ? 'Creating...' : 'Create New Meeting'}
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground text-center">
                        A unique meeting code will be generated (e.g., ABC-DEFG-HIJ)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Join Meeting Tab */}
              <TabsContent value="join" className="mt-6">
                <Card className="border-2 border-accent/20">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LogIn className="w-5 h-5 mr-2 text-accent" />
                      Join a Meeting
                    </CardTitle>
                    <CardDescription>
                      Enter a meeting code to join an existing room
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
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
                          className={`text-lg h-12 font-mono ${joinError ? 'border-red-500' : ''}`}
                          disabled={isJoining}
                        />
                        {joinError ? (
                          <p className="text-xs text-red-500 mt-2 flex items-center">
                            <span className="mr-1">⚠️</span>
                            {joinError}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            Enter the code provided by the meeting host
                          </p>
                        )}
                      </div>

                      <Button 
                        size="lg" 
                        className="w-full" 
                        onClick={handleJoinMeeting}
                        variant="secondary"
                        disabled={isJoining}
                      >
                        <LogIn className="w-5 h-5 mr-2" />
                        {isJoining ? 'Validating...' : 'Join Meeting'}
                      </Button>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        💡 <strong>Tip:</strong> You can paste the full meeting link or just the code
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Features / Info */}
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Meeting Features</CardTitle>
                <CardDescription>Everything you need for effective online learning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">HD Video & Audio</h4>
                    <p className="text-xs text-muted-foreground">
                      Crystal clear video and audio quality for seamless communication
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Unlimited Participants</h4>
                    <p className="text-xs text-muted-foreground">
                      Host large classes with unlimited participants
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Screen Sharing</h4>
                    <p className="text-xs text-muted-foreground">
                      Share your screen to present slides or demonstrations
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Real-time Chat</h4>
                    <p className="text-xs text-muted-foreground">
                      Send messages and files during the meeting
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm"><strong>Create</strong> a new meeting or <strong>Join</strong> with a code</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm">Set up your camera and microphone</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm">Share the meeting code with participants</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground text-xs font-bold">
                    4
                  </div>
                  <div>
                    <p className="text-sm">Start teaching or learning together!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start your meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              Your meeting code is: <strong className="font-mono text-lg">{pendingRoomCode}</strong>
              <br /><br />
              You can share this code with participants to let them join your meeting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreateMeeting}>
              Start Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MeetingHome;
