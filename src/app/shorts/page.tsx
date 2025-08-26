"use client";

import type { Movie } from "@/lib/types";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { fetchYouTubeDataForMovies } from "@/lib/youtube";
import { ShortsViewer } from "@/components/shorts-viewer";
import { Skeleton } from "@/components/ui/skeleton";

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
      const moviesWithYTData = await fetchYouTubeDataForMovies(moviesFromDb);
      // Filter for videos 5 minutes or shorter (<= 300 seconds)
      const shortVideos = moviesWithYTData.filter(movie => movie.duration && movie.duration <= 300);
      setMovies(shortVideos);
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

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
