"use client";

import type { Movie } from "@/lib/types";
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  variant?: 'list' | 'grid';
}

export function MovieCard({ movie, variant = 'grid' }: MovieCardProps) {
  const channelLetter = movie.channelTitle ? movie.channelTitle.charAt(0).toUpperCase() : 'U';
  
  const formattedViews = movie.viewCount ? formatNumber(parseInt(movie.viewCount, 10)) : null;
  const formattedDate = movie.publishedAt ? formatRelativeTime(movie.publishedAt) : null;

  if (variant === 'list') {
    return (
       <Link href={`/watch?v=${movie.id}`} className="flex gap-3 group">
          <div className="w-40 aspect-video overflow-hidden rounded-lg shrink-0">
             <Image
                src={movie.thumbnailUrl || "https://placehold.co/160x90.png"}
                alt={`Thumbnail for ${movie.title}`}
                width={160}
                height={90}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                data-ai-hint="video thumbnail"
             />
          </div>
          <div>
             <h3 className="font-semibold leading-snug line-clamp-2 text-sm">{movie.title}</h3>
             <p className="text-xs text-muted-foreground mt-1">{movie.channelTitle || 'Streamlined'}</p>
             <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                {formattedViews && <span>{formattedViews} views</span>}
                {formattedViews && formattedDate && <span>•</span>}
                {formattedDate && <span>{formattedDate}</span>}
             </div>
          </div>
       </Link>
    );
  }

  // Grid variant
  return (
    <Link href={`/watch?v=${movie.id}`} className="group">
        <div className="aspect-video overflow-hidden rounded-lg">
          <Image
            src={movie.thumbnailUrl || "https://placehold.co/400x225.png"}
            alt={`Thumbnail for ${movie.title}`}
            width={400}
            height={225}
            className="h-full w-full object-cover transition-transform group-hover:scale-110"
            data-ai-hint="video thumbnail"
          />
        </div>
        <div className="flex gap-3 mt-2">
           <Avatar className="h-9 w-9 mt-0.5">
               <AvatarImage src={movie.channelThumbnailUrl || "https://placehold.co/36x36.png"} data-ai-hint="logo" />
               <AvatarFallback>{channelLetter}</AvatarFallback>
           </Avatar>
           <div className="flex-grow">
              <h3 className="font-semibold leading-snug line-clamp-2 text-sm">{movie.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{movie.channelTitle || 'Streamlined'}</p>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                {formattedViews && <span>{formattedViews} views</span>}
                {formattedViews && formattedDate && <span>•</span>}
                {formattedDate && <span>{formattedDate}</span>}
             </div>
           </div>
        </div>
    </Link>
  );
}
