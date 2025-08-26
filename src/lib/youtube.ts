// @ts-nocheck
'use server';

import type { Movie } from './types';
import { getYouTubeVideoId, parseISO8601Duration } from './utils';
import fetch from 'node-fetch';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export async function fetchYouTubeDataForMovies(movies: Movie[]): Promise<Movie[]> {
  const videoIds = movies
    .map((movie) => getYouTubeVideoId(movie.url))
    .filter(Boolean) as string[];
  if (videoIds.length === 0 || !YOUTUBE_API_KEY) return movies;

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(
    ','
  )}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.items) {
      const youtubeDataMap = new Map(
        data.items.map((item: any) => [item.id, item])
      );

      const moviesWithChannelData = await fetchChannelDataForMovies(data.items);
      const channelDataMap = new Map(
        moviesWithChannelData.map((movie) => [getYouTubeVideoId(movie.url), movie.channelThumbnailUrl])
      );

      return movies.map((movie) => {
        const videoId = getYouTubeVideoId(movie.url);
        if (videoId && youtubeDataMap.has(videoId)) {
          const item = youtubeDataMap.get(videoId);
          return {
            ...movie,
            title: item.snippet.title,
            thumbnailUrl:
              item.snippet.thumbnails.high?.url ||
              item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            viewCount: item.statistics.viewCount,
            publishedAt: item.snippet.publishedAt,
            duration: parseISO8601Duration(item.contentDetails.duration),
            channelThumbnailUrl: channelDataMap.get(videoId) || movie.channelThumbnailUrl,
          };
        }
        return movie;
      });
    }
    return movies;
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return movies; // Return original movies if API fails
  }
}

async function fetchChannelDataForMovies(youtubeItems: any[]): Promise<Movie[]> {
  const channelIds = youtubeItems.map(item => item.snippet.channelId).filter(Boolean);
  if (channelIds.length === 0 || !YOUTUBE_API_KEY) return [];

  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(
    ','
  )}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.items) {
      const channelThumbnailMap = new Map(
        data.items.map((item: any) => [item.id, item.snippet.thumbnails.default?.url])
      );

      return youtubeItems.map(item => ({
        id: item.id,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        channelThumbnailUrl: channelThumbnailMap.get(item.snippet.channelId),
      } as Movie));
    }
    return [];
  } catch (error) {
    console.error('Error fetching channel data:', error);
    return [];
  }
}
