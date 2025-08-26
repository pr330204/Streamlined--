
"use server";

import { suggestMovie, SuggestMovieInput } from "@/ai/flows/suggest-movie-from-prompt";
import { checkAndSaveMovieLink, CheckAndSaveMovieLinkInput } from "@/ai/flows/check-and-save-movie-link";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import type { Movie } from "@/lib/types";
import { fetchYouTubeDataForMovies } from "./youtube";

// --- Existing Actions ---

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


// --- New Action for Reels Page ---

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YT_CHANNEL_ID = "UC_x5XG1OV2P6uZZ5FSM9Ttw"; // From your code
const YT_MAX_RESULTS = 10;

export async function fetchReelsAction(): Promise<Movie[] | null> {
    try {
        // 1. Fetch from Firestore `shorts` collection
        const shortsCol = collection(db, 'movies'); // Using 'movies' as per your existing code
        const q = query(shortsCol, orderBy('createdAt','desc'), limit(15));
        const shortsSnap = await getDocs(q);
        
        let firestoreMovies: Movie[] = shortsSnap.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            } as Movie
        });

        // 2. Fetch from YouTube Channel
        let youtubeMovies: Movie[] = [];
        if (YT_API_KEY && YT_CHANNEL_ID) {
            const url = `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet&type=video&maxResults=${YT_MAX_RESULTS}&order=date`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.items) {
                youtubeMovies = data.items.map((item: any) => ({
                    id: `yt-${item.id.videoId}`,
                    title: item.snippet.title,
                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    votes: 0,
                    publishedAt: item.snippet.publishedAt,
                    createdAt: item.snippet.publishedAt,
                }));
            }
        }
        
        // 3. Merge and remove duplicates
        const allMovies = [...firestoreMovies, ...youtubeMovies];
        const uniqueMoviesMap = new Map<string, Movie>();
        allMovies.forEach(movie => {
            // A simple way to deduplicate based on title, assuming titles are unique enough
            if (!uniqueMoviesMap.has(movie.title)) {
                uniqueMoviesMap.set(movie.title, movie);
            }
        });

        const uniqueMovies = Array.from(uniqueMoviesMap.values());

        // 4. Fetch rich YouTube data for the merged list
        const moviesWithYTData = await fetchYouTubeDataForMovies(uniqueMovies);

        // 5. Sort by date (newest first)
        moviesWithYTData.sort((a, b) => {
            const dateA = new Date(a.publishedAt || a.createdAt).getTime();
            const dateB = new Date(b.publishedAt || b.createdAt).getTime();
            return dateB - dateA;
        });

        return moviesWithYTData;

    } catch (error) {
        console.error("Error fetching reels:", error);
        return null;
    }
}
