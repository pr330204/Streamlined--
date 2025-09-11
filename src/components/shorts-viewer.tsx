
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Movie } from "@/lib/types";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical, Music4, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { YouTubePlayer } from "./youtube-player";

interface ShortsViewerProps {
  movies: Movie[];
  onEndReached: () => void;
  isLoadingMore: boolean;
}

export function ShortsViewer({ movies, onEndReached, isLoadingMore }: ShortsViewerProps) {
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(0);
  const playerRefs = useMemo(() => Array.from({ length: movies.length }, () => React.createRef<any>()), [movies.length]);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current = Array.from({ length: movies.length }, (_, i) => videoRefs.current[i] || null);
  }, [movies.length]);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const index = videoRefs.current.indexOf(entry.target as HTMLDivElement);
      if (index === -1) return;

      if (entry.isIntersecting) {
        setActivePlayerIndex(prevIndex => {
          if (prevIndex !== null && prevIndex !== index) {
            const oldPlayer = playerRefs[prevIndex]?.current;
            if (oldPlayer && typeof oldPlayer.pauseVideo === 'function') {
              oldPlayer.pauseVideo();
            }
          }
          return index;
        });

        if (index === movies.length - 2 && !isLoadingMore) { 
          onEndReached();
        }
      }
    });
  }, [movies.length, onEndReached, isLoadingMore, playerRefs]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.7 });
    const currentVideoRefs = videoRefs.current;
    
    currentVideoRefs.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentVideoRefs.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [movies, handleIntersection]);


  if (movies.length === 0 && !isLoadingMore) {
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
        <div
          key={`${movie.id}-${index}`}
          ref={el => videoRefs.current[index] = el}
          className="h-full w-full snap-start relative flex items-center justify-center bg-black"
        >
          <YouTubePlayer
            videoUrl={movie.url}
            playerRef={playerRefs[index]}
            isPlaying={index === activePlayerIndex}
            isMuted={false}
          />
          
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
      {isLoadingMore && (
        <div className="h-full w-full snap-start relative flex items-center justify-center bg-black">
           <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}
