export interface Movie {
  id: string;
  title: string;
  url: string;
  votes: number;
  // YouTube API data
  channelTitle?: string;
  viewCount?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  channelThumbnailUrl?: string;
}
