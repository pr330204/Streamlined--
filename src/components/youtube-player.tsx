
"use client";

import { useEffect, useRef, useState } from 'react';
import { getYouTubeVideoId } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';

interface YouTubePlayerProps {
  videoUrl: string;
}

declare global {
    interface Window {
      onYouTubeIframeAPIReady: () => void;
      YT: any;
    }
}

export function YouTubePlayer({ videoUrl }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const videoId = getYouTubeVideoId(videoUrl);
  const [isMuted, setIsMuted] = useState(true);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(true);
  
  const playerId = `ytplayer-${videoId}-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    const createPlayer = () => {
      playerRef.current = new window.YT.Player(playerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          mute: 1,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
        },
        events: {
          'onReady': (event: any) => {
             event.target.playVideo();
          },
        }
      });
    };

    if (!window.YT) {
      window.onYouTubeIframeAPIReady = () => {
        if(document.getElementById(playerId)) {
            createPlayer();
        }
      };
    } else {
        if(document.getElementById(playerId)) {
           createPlayer();
        }
    }
    
    return () => {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
        }
    }
  }, [videoId, playerId]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current) {
        if (isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
            setShowUnmutePrompt(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full">
        <div id={playerId} className="w-full h-full" />
         {showUnmutePrompt && (
            <div 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer"
                onClick={toggleMute}
            >
                <div className="flex flex-col items-center text-white">
                    <VolumeX className="h-12 w-12 mb-2" />
                    <p className="font-semibold">Tap to unmute</p>
                </div>
            </div>
        )}
        {!showUnmutePrompt && (
             <button 
                onClick={toggleMute} 
                className="absolute bottom-24 right-2 z-10 p-2 bg-black/50 rounded-full text-white"
                aria-label={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
             </button>
        )}
    </div>
  );
}
