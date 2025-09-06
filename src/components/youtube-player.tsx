
"use client";

import { useEffect, useState } from 'react';
import { getYouTubeVideoId } from '@/lib/utils';

interface YouTubePlayerProps {
  videoUrl: string;
  playerRef: React.MutableRefObject<any>;
  isPlaying: boolean;
  isMuted: boolean;
}

declare global {
    interface Window {
      onYouTubeIframeAPIReady: () => void;
      YT: any;
      ytPlayerQueue: (() => void)[];
    }
}

// Initialize the queue if it doesn't exist
if (typeof window !== 'undefined') {
  window.ytPlayerQueue = window.ytPlayerQueue || [];
  window.onYouTubeIframeAPIReady = () => {
    window.ytPlayerQueue.forEach(playerFn => playerFn());
    window.ytPlayerQueue = []; // Clear the queue after processing
  };
}

export function YouTubePlayer({ videoUrl, playerRef, isPlaying, isMuted }: YouTubePlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const videoId = getYouTubeVideoId(videoUrl);
  
  const playerId = `ytplayer-${videoId}-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    if (!videoId) {
      console.error("Invalid video URL, cannot create player:", videoUrl);
      return;
    }

    const createPlayer = () => {
      // Ensure the target element exists before creating a player
      if (!document.getElementById(playerId)) return;
      
      const player = new window.YT.Player(playerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          showinfo: 0,
          mute: isMuted ? 1 : 0,
          playsinline: 1,
          loop: 1,
          playlist: videoId, // Required for loop to work
        },
        events: {
          'onReady': (event: any) => {
             playerRef.current = event.target;
             setIsReady(true);
          },
        }
      });
    };

    if (!window.YT || !window.YT.Player) {
       // If the API isn't ready, push the createPlayer function to the queue
       window.ytPlayerQueue.push(createPlayer);
    } else {
       // If the API is already loaded, create the player immediately
       createPlayer();
    }
    
    return () => {
        const player = playerRef.current;
        if (player && typeof player.destroy === 'function') {
            player.destroy();
            playerRef.current = null;
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerId]);

  useEffect(() => {
    const player = playerRef.current;
    if (isReady && player) {
        if (isPlaying) {
            if (typeof player.playVideo === 'function') {
                player.playVideo();
            }
        } else {
            if (typeof player.pauseVideo === 'function') {
                player.pauseVideo();
            }
        }
    }
  }, [isPlaying, isReady, playerRef]);

  useEffect(() => {
    const player = playerRef.current;
    if (isReady && player) {
      if (isMuted) {
        if (typeof player.mute === 'function') player.mute();
      } else {
        if (typeof player.unMute === 'function') player.unMute();
      }
    }
  }, [isMuted, isReady, playerRef]);


  if (!videoId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <p>Invalid video URL.</p>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full">
        <div id={playerId} className="w-full h-full" />
    </div>
  );
}
