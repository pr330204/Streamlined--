
import type { Timestamp } from "firebase/firestore";

export interface Movie {
  id: string;
  title: string;
  url: string;
  votes: number;
  createdAt: Timestamp | string;
  thumbnailUrl?: string;
  // YouTube API data
  channelTitle?: string;
  viewCount?: string;
  publishedAt?: string;
  channelThumbnailUrl?: string;
  duration?: number; // Duration in seconds
}
