
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Movie } from "@/lib/types";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical, Music4, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { YouTubePlayer } from "./youtube-player";

interface ShortsViewerProps {
  movies: Movie[];
  onEndReached: () => void;
  isLoadingMore: boolean;
}

export function ShortsViewer({ movies, onEndReached, isLoadingMore }: ShortsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const playerRef = useRef<any>(null);
  
  const handleNext = () => {
    if (currentIndex < movies.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (!isLoadingMore) {
        onEndReached();
    }
    if (currentIndex === movies.length - 2 && !isLoadingMore) {
        onEndReached();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (movies.length > 0 && currentIndex >= movies.length && !isLoadingMore) {
       // If more movies were loaded, but we are out of bounds, stay on the new last item
       setCurrentIndex(movies.length - 1);
    }
  }, [movies, currentIndex, isLoadingMore]);


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

  const currentMovie = movies[currentIndex];

  return (
    <div className="h-full w-full relative flex items-center justify-center">
      {/* Previous Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/50 hover:bg-black/70 text-white disabled:text-gray-500"
        onClick={handlePrev}
        disabled={currentIndex === 0}
      >
        <ChevronUp className="h-6 w-6" />
      </Button>

      {currentMovie ? (
        <div
          key={currentMovie.id}
          className="h-full w-full relative flex items-center justify-center bg-black"
        >
          <YouTubePlayer
            videoUrl={currentMovie.url}
            playerRef={playerRef}
            isPlaying={true}
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
              <AvatarImage src={currentMovie.channelThumbnailUrl} data-ai-hint="album art" />
            </Avatar>
          </div>

          <div className="absolute bottom-16 left-0 p-4 text-white bg-gradient-to-t from-black/60 to-transparent w-full">
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={currentMovie.channelThumbnailUrl} />
                        <AvatarFallback>{currentMovie.channelTitle?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">@{currentMovie.channelTitle?.toLowerCase().replace(/\s/g, '_')}</span>
                    <Button size="sm" className="h-8 text-sm bg-white text-black font-bold rounded-full hover:bg-white/90 px-4">Subscribe</Button>
                </div>
                <p className="text-sm line-clamp-2">{currentMovie.title}</p>
                <div className="flex items-center gap-2">
                    <Music4 className="h-4 w-4" />
                    <p className="text-xs truncate">Original audio - {currentMovie.channelTitle}</p>
                </div>
             </div>
          </div>
        </div>
      ) : isLoadingMore ? (
         <div className="h-full w-full relative flex items-center justify-center bg-black">
           <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      ) : null}

       {/* Next Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/50 hover:bg-black/70 text-white disabled:text-gray-500"
        onClick={handleNext}
        disabled={isLoadingMore && currentIndex === movies.length - 1}
      >
        {isLoadingMore && currentIndex === movies.length - 1 ? 
          <Loader2 className="h-6 w-6 animate-spin" /> : 
          <ChevronDown className="h-6 w-6" /> 
        }
      </Button>
    </div>
  );
}
