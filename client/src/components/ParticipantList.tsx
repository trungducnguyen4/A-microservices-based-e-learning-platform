import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  MoreVertical, 
  Mic, 
  MicOff, 
  Hand,
  Crown,
  UserMinus,
  Volume2,
  VolumeX
} from "lucide-react";
import { RemoteParticipant, LocalParticipant } from "livekit-client";

interface ParticipantListProps {
  localParticipant: LocalParticipant | null;
  participants: RemoteParticipant[];
  isLocalUserHost: boolean;
  hostUserId: string | null;
  raisedHands: Set<string>;
  onKickParticipant: (identity: string) => Promise<void>;
  onMuteParticipant?: (identity: string) => void; // Future feature
  onClose?: () => void; // Close panel
}

export function ParticipantList({
  localParticipant,
  participants,
  isLocalUserHost,
  hostUserId,
  raisedHands,
  onKickParticipant,
  onMuteParticipant,
  onClose,
}: ParticipantListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [kickingParticipant, setKickingParticipant] = useState<string | null>(null);

  const totalParticipants = participants.length + (localParticipant ? 1 : 0);

  const getInitials = (name: string) => {
    const parts = name.split(/[\s-_@.]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleKick = async (identity: string, name: string) => {
    if (!confirm(`🚫 Are you sure you want to remove "${name}" from the meeting?`)) {
      return;
    }

    setKickingParticipant(identity);
    try {
      await onKickParticipant(identity);
    } catch (error) {
      console.error('Failed to kick participant:', error);
      alert('Failed to remove participant. Please try again.');
    } finally {
      setKickingParticipant(null);
    }
  };

  const isParticipantMuted = (participant: RemoteParticipant | LocalParticipant) => {
    // Get audio tracks using forEach to avoid type issues
    let isMuted = true;
    participant.audioTrackPublications.forEach((pub: any) => {
      if (pub && !pub.isMuted) {
        isMuted = false;
      }
    });
    return isMuted;
  };

  const isHost = (identity: string) => {
    // Extract userId from identity (format: "username-userId")
    const userId = identity.split('-').pop();
    return userId === hostUserId;
  };

  return (
    <Card className="w-full h-full flex flex-col shadow-lg border-0 lg:border rounded-none lg:rounded-lg">
      {/* Header */}
      <div className="p-3 xs:p-4 sm:p-5 lg:p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-1.5 xs:gap-2">
          <Users className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
          <h3 className="font-semibold text-sm xs:text-base lg:text-lg">Participants</h3>
          <Badge variant="secondary" className="ml-0.5 xs:ml-1 text-xs xs:text-sm h-5 xs:h-6 px-1.5 xs:px-2">
            {totalParticipants}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 xs:h-8 xs:w-8"
          onClick={() => onClose?.()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="xs:w-[18px] xs:h-[18px]"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Button>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="p-2 xs:p-3 sm:p-4 lg:p-3 space-y-1 xs:space-y-2">
          {/* Local Participant (You) */}
          {localParticipant && (
            <div className="flex items-center gap-2 xs:gap-3 p-2 xs:p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <Avatar className="h-8 w-8 xs:h-10 xs:w-10 border-2 border-primary flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs xs:text-sm">
                  {getInitials(localParticipant.identity)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <p className="font-medium text-xs xs:text-sm truncate">
                    {localParticipant.identity}
                  </p>
                  <Badge variant="outline" className="text-[10px] xs:text-xs px-1 xs:px-1.5 py-0 h-4 xs:h-auto flex-shrink-0">
                    You
                  </Badge>
                  {isLocalUserHost && (
                    <span title="Host">
                      <Crown className="w-3 h-3 xs:w-4 xs:h-4 text-yellow-500 flex-shrink-0" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {isParticipantMuted(localParticipant) ? (
                    <MicOff className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-muted-foreground" />
                  ) : (
                    <Mic className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-green-500" />
                  )}
                  {raisedHands.has(localParticipant.identity) && (
                    <Hand className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remote Participants */}
          {participants.map((participant) => {
            const participantIsHost = isHost(participant.identity);
            const isMuted = isParticipantMuted(participant);
            const handRaised = raisedHands.has(participant.identity);
            
            return (
              <div
                key={participant.sid}
                className="flex items-center gap-2 xs:gap-3 p-2 xs:p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-8 w-8 xs:h-10 xs:w-10 flex-shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-xs xs:text-sm">
                    {getInitials(participant.identity)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <p className="font-medium text-xs xs:text-sm truncate">
                      {participant.identity}
                    </p>
                    {participantIsHost && (
                      <span title="Host">
                        <Crown className="w-3 h-3 xs:w-4 xs:h-4 text-yellow-500 flex-shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isMuted ? (
                      <MicOff className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-muted-foreground" />
                    ) : (
                      <Mic className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-green-500" />
                    )}
                    {handRaised && (
                      <Hand className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Menu - Only show for host */}
                {isLocalUserHost && !participantIsHost && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 xs:h-8 xs:w-8 flex-shrink-0"
                        disabled={kickingParticipant === participant.identity}
                      >
                        <MoreVertical className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 xs:w-48">
                      {/* Future: Mute participant
                      <DropdownMenuItem
                        onClick={() => onMuteParticipant?.(participant.identity)}
                      >
                        {isMuted ? (
                          <>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Unmute
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-4 h-4 mr-2" />
                            Mute
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      */}
                      <DropdownMenuItem
                        onClick={() => handleKick(participant.identity, participant.identity)}
                        className="text-destructive focus:text-destructive"
                        disabled={kickingParticipant === participant.identity}
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        {kickingParticipant === participant.identity ? 'Removing...' : 'Remove from meeting'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}

          {participants.length === 0 && !localParticipant && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No participants yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
