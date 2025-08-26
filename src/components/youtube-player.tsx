
"use client";

import { useEffect, useRef } from 'react';
import { getYouTubeVideoId } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';

interface YouTubePlayerProps {
  videoUrl: string;
  playerRef: React.MutableRefObject<any>;
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


export function YouTubePlayer({ videoUrl, playerRef }: YouTubePlayerProps) {
  const internalPlayerRef = useRef<any>(null);
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
      
      if (internalPlayerRef.current) {
        internalPlayerRef.current.destroy();
      }
      const player = new window.YT.Player(playerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          mute: 1,
          playsinline: 1,
          loop: 1,
          playlist: videoId, // Required for loop to work
        },
        events: {
          'onReady': (event: any) => {
             event.target.playVideo();
             internalPlayerRef.current = event.target;
             if (playerRef) {
                playerRef.current = event.target;
             }
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
        const player = internalPlayerRef.current;
        if (player && typeof player.destroy === 'function') {
            player.destroy();
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerId, videoUrl]);


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
