
"use server";

import { suggestMovie, SuggestMovieInput } from "@/ai/flows/suggest-movie-from-prompt";
import { checkAndSaveMovieLink, CheckAndSaveMovieLinkInput } from "@/ai/flows/check-and-save-movie-link";
import { z } from "zod";
import fetch from "node-fetch";

const suggestMovieSchema = z.object({
  prompt: z.string().min(10, "Please provide a more detailed description."),
});

export async function suggestMovieAction(values: SuggestMovieInput) {
  const validated = suggestMovieSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.errors[0].message,
    };
  }
  try {
    const result = await suggestMovie(validated.data);
    return {
      success: true,
      movieTitle: result.movieTitle,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "AI failed to suggest a movie. Please try again.",
    };
  }
}


const addMovieSchema = z.object({
    movieTitle: z.string().min(1, "Movie title is required."),
    movieLink: z.string().url("Please enter a valid URL."),
});

export async function checkMovieLinkAction(values: CheckAndSaveMovieLinkInput) {
    const validated = addMovieSchema.safeParse(values);
    if (!validated.success) {
        return {
            success: false,
            message: validated.error.errors[0].message,
        };
    }

    try {
        const result = await checkAndSaveMovieLink(validated.data);
        if (result.isValid) {
            return {
                success: true,
                message: result.message,
            };
        } else {
            return {
                success: false,
                message: result.message || "The provided link is not valid.",
            };
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "An error occurred while validating the movie link.",
        };
    }
}

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export async function fetchShortsAction(query: string, pageToken: string | null) {
    if (!YOUTUBE_API_KEY) {
        return { success: false, message: "YouTube API key is not configured." };
    }

    const MAX_RESULTS = 5;
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoDuration', 'short');
    url.searchParams.set('maxResults', String(MAX_RESULTS));
    if (query) {
        url.searchParams.set('q', query);
    }
    if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
    }
    url.searchParams.set('key', YOUTUBE_API_KEY);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorData = await response.json();
            console.error('YouTube API Error:', errorData);
            return { success: false, message: `YouTube API error: ${response.statusText}` };
        }
        const data = await response.json();
        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to fetch shorts:', error);
        return { success: false, message: `Failed to fetch shorts: ${error.message}` };
    }
}
