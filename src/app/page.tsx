"use client";

import type { Movie } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { MovieList } from "@/components/movie-list";
import AdMobBanner from "@/components/admob-banner";
import { getYouTubeVideoId } from "@/lib/utils";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

async function fetchYouTubeDataForMovies(movies: Movie[]): Promise<Movie[]> {
  const videoIds = movies.map(movie => getYouTubeVideoId(movie.url)).filter(Boolean) as string[];
  if (videoIds.length === 0 || !YOUTUBE_API_KEY) return movies;

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.items) {
      const youtubeDataMap = new Map(data.items.map((item: any) => [item.id, item]));
      
      return movies.map(movie => {
        const videoId = getYouTubeVideoId(movie.url);
        if (videoId && youtubeDataMap.has(videoId)) {
          const item = youtubeDataMap.get(videoId);
          return {
            ...movie,
            title: item.snippet.title,
            thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
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
    console.error("Error fetching YouTube data:", error);
    return movies; // Return original movies if API fails
  }
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "movies"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const moviesFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      const moviesWithYTData = await fetchYouTubeDataForMovies(moviesFromDb);
      setMovies(moviesWithYTData);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredMovies = useMemo(() => {
    if (!searchQuery) {
      return movies;
    }
    return movies.filter((movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [movies, searchQuery]);


  const handleAddMovie = async (movie: Omit<Movie, "id" | "votes">) => {
    await addDoc(collection(db, "movies"), {
      ...movie,
      votes: 0,
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Header onAddMovieClick={() => setAddMovieOpen(true)} onSearch={setSearchQuery} />
      <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
        <div className="container max-w-7xl mx-auto">
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2 animate-pulse">
                        <div className="w-full aspect-video bg-muted rounded-lg"></div>
                        <div className="flex gap-3">
                           <div className="w-10 h-10 bg-muted rounded-full shrink-0"></div>
                           <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-full"></div>
                                <div className="h-4 bg-muted rounded w-2/3"></div>
                           </div>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <MovieList movies={filteredMovies} />
          )}
        </div>
      </main>
      <AddMovieDialog
        isOpen={isAddMovieOpen}
        onOpenChange={setAddMovieOpen}
        onMovieAdded={handleAddMovie}
      />
      <AdMobBanner />
    </div>
  );
}
