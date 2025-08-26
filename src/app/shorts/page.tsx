
"use client";

import type { Movie } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { ShortsViewer } from "@/components/shorts-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { getYouTubeVideoId } from "@/lib/utils";

export default function ShortsPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "movies"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const moviesFromDb = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as Movie
      });
      setMovies(moviesFromDb);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAddMovie = async (movie: Omit<Movie, "id" | "votes" | "createdAt" | "duration">) => {
    await addDoc(collection(db, "movies"), {
      ...movie,
      votes: 0,
      createdAt: serverTimestamp(),
    });
  };

  const filteredMovies = useMemo(() => {
    // First, filter out any non-YouTube videos
    const youtubeMovies = movies.filter(movie => getYouTubeVideoId(movie.url));
    
    // Then, filter by search query
    if (!searchQuery) {
      return youtubeMovies;
    }
    return youtubeMovies.filter((movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [movies, searchQuery]);

  return (
    <div className="flex h-screen w-full flex-col bg-black text-foreground">
      <Header onAddMovieClick={() => setAddMovieOpen(true)} onSearch={setSearchQuery} />
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
             <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                <Skeleton className="w-full h-1/2 rounded-lg" />
                <div className="w-full space-y-3">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-5 w-1/2 rounded-lg" />
                </div>
             </div>
          </div>
        ) : (
          <ShortsViewer movies={filteredMovies} />
        )}
      </main>
      <AddMovieDialog
        isOpen={isAddMovieOpen}
        onOpenChange={setAddMovieOpen}
        onMovieAdded={handleAddMovie}
      />
    </div>
  );
}
