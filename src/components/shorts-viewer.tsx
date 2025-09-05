
"use client";

import React, { useState } from "react";
import type { Movie } from "@/lib/types";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical, Music4 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { YouTubePlayer } from "./youtube-player";

interface ShortsViewerProps {
  movies: Movie[];
}

export function ShortsViewer({ movies }: ShortsViewerProps) {
  const [playerRefs, setPlayerRefs] = useState<React.MutableRefObject<any>[]>([]);

  // Initialize player refs
  useState(() => {
    setPlayerRefs(movies.map(() => React.createRef()));
  });

  if (movies.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center rounded-lg bg-black text-center p-4">
        <h3 className="text-lg font-semibold tracking-tight">No shorts found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adding a new video under 5 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto snap-y snap-mandatory">
      {movies.map((movie, index) => (
        <div key={movie.id} className="h-full w-full snap-start relative flex items-center justify-center bg-black">
          <YouTubePlayer videoUrl={movie.url} playerRef={playerRefs[index]} />
          
          <div className="absolute bottom-16 right-0 p-4 flex flex-col items-center justify-end z-10 gap-4">
            <div className="flex flex-col items-center text-white">
              <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-black/50 hover:bg-black/70">
                <ThumbsUp className="h-6 w-6" />
              </Button>
              <span className="text-xs font-semibold mt-1">619K</span>
            </div>
            <div className="flex flex-col items-center text-white">
              <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-black/50 hover:bg-black/70">
                <ThumbsDown className="h-6 w-6" />
              </Button>
              <span className="text-xs font-semibold mt-1">Dislike</span>
            </div>
            <div className="flex flex-col items-center text-white">
              <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-black/50 hover:bg-black/70">
                <MessageCircle className="h-6 w-6" />
              </Button>
              <span className="text-xs font-semibold mt-1">1,874</span>
            </div>
            <div className="flex flex-col items-center text-white">
              <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-black/50 hover:bg-black/70">
                <Share2 className="h-6 w-6" />
              </Button>
              <span className="text-xs font-semibold mt-1">Share</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-black/50 hover:bg-black/70">
              <MoreVertical className="h-6 w-6" />
            </Button>
            <Avatar className="h-10 w-10 border-2 border-white animate-spin-slow">
              <AvatarImage src={movie.channelThumbnailUrl} data-ai-hint="album art" />
            </Avatar>
          </div>

          <div className="absolute bottom-16 left-0 p-4 text-white bg-gradient-to-t from-black/60 to-transparent w-full">
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={movie.channelThumbnailUrl} />
                        <AvatarFallback>{movie.channelTitle?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">@{movie.channelTitle?.toLowerCase().replace(/\s/g, '_')}</span>
                    <Button size="sm" className="h-8 text-sm bg-white text-black font-bold rounded-full hover:bg-white/90 px-4">Subscribe</Button>
                </div>
                <p className="text-sm line-clamp-2">{movie.title}</p>
                <div className="flex items-center gap-2">
                    <Music4 className="h-4 w-4" />
                    <p className="text-xs truncate">Original audio - {movie.channelTitle}</p>
                </div>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
