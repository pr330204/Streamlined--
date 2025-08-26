
"use client";

import type { Movie } from "@/lib/types";
import { Heart, MessageCircle, Send, MoreVertical, Music4, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { YouTubePlayer } from "./youtube-player";
import { formatRelativeTime, getYouTubeVideoId } from "@/lib/utils";
import { useRef, useState } from "react";

interface ReelsViewerProps {
  reels: Movie[];
}

export function ReelsViewer({ reels }: ReelsViewerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const playerRef = useRef<any>(null);

  if (reels.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center rounded-lg bg-black text-center">
        <h3 className="text-lg font-semibold tracking-tight">No reels found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adding a new video.
        </p>
      </div>
    );
  }
  
  // Filter out any non-youtube videos just in case
  const youtubeReels = reels.filter(reel => getYouTubeVideoId(reel.url));

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling up
    if (playerRef.current && typeof playerRef.current.isMuted === 'function') {
        if (playerRef.current.isMuted()) {
            playerRef.current.unMute();
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto snap-y snap-mandatory">
      {youtubeReels.map((reel) => (
        <div key={reel.id} className="h-full w-full snap-start relative flex items-center justify-center bg-black">
          <YouTubePlayer videoUrl={reel.url} playerRef={playerRef} />

          <div 
            onClick={toggleMute}
            className="absolute bottom-24 right-2 z-10 p-2 bg-black/50 rounded-full text-white cursor-pointer"
            aria-label={isMuted ? "Unmute" : "Mute"}
        >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 text-white bg-gradient-to-t from-black/60 to-transparent">
             <div className="flex items-end">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9 border-2 border-white">
                            <AvatarImage src={reel.channelThumbnailUrl} />
                            <AvatarFallback>{reel.channelTitle?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">{reel.channelTitle || 'Unknown Channel'}</span>
                        <Button size="sm" className="h-7 text-xs bg-white text-black font-bold rounded-lg hover:bg-white/90">Follow</Button>
                    </div>
                    <p className="text-sm line-clamp-2">{reel.title}</p>
                     <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {reel.publishedAt && <span>{formatRelativeTime(reel.publishedAt)}</span>}
                     </div>
                    <div className="flex items-center gap-2">
                        <Music4 className="h-4 w-4" />
                        <p className="text-xs truncate">Original audio - {reel.channelTitle}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center space-y-4">
                     <div className="flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white hover:bg-white/20 hover:text-white">
                           <Heart className="h-7 w-7" />
                        </Button>
                        <span className="text-xs font-semibold">91.1k</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white hover:bg-white/20 hover:text-white">
                           <MessageCircle className="h-7 w-7" />
                        </Button>
                        <span className="text-xs font-semibold">337</span>
                     </div>
                      <div className="flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white hover:bg-white/20 hover:text-white">
                           <Send className="h-7 w-7" />
                        </Button>
                        <span className="text-xs font-semibold">5,857</span>
                     </div>
                     <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white hover:bg-white/20 hover:text-white">
                        <MoreVertical className="h-7 w-7" />
                     </Button>
                      <Avatar className="h-10 w-10 border-2 border-white animate-spin-slow">
                        <AvatarImage src={reel.channelThumbnailUrl} />
                      </Avatar>
                </div>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
