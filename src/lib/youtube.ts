// @ts-nocheck
'use server';

import type { Movie } from './types';
import { getYouTubeVideoId } from './utils';
import fetch from 'node-fetch';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function fetchYouTubeDataForMovies(movies: Movie[]): Promise<Movie[]> {
  const videoIds = movies
    .map((movie) => getYouTubeVideoId(movie.url))
    .filter(Boolean) as string[];
  if (videoIds.length === 0 || !YOUTUBE_API_KEY) return movies;

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(
    ','
  )}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.items) {
      const youtubeDataMap = new Map(
        data.items.map((item: any) => [item.id, item])
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
