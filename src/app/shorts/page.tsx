
"use client";

import type { Movie } from "@/lib/types";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { fetchYouTubeDataForMovies, fetchYouTubeShorts } from "@/lib/youtube";
import { ShortsViewer } from "@/components/shorts-viewer";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { getYouTubeVideoId } from "@/lib/utils";

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "movies"), orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      
      const moviesFromDb = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as Movie
      }).filter(movie => getYouTubeVideoId(movie.url)); // Filter for valid YouTube URLs
      
      const shortsFromApi = await fetchYouTubeShorts("trending shorts");

      const combinedShorts = [...moviesFromDb, ...shortsFromApi]
        .filter(m => m.duration === undefined || m.duration <= 300) // pre-filter
        .sort(() => Math.random() - 0.5);
      
      // Set initial data for fast load
      setShorts(combinedShorts);
      setLoading(false);

      // Fetch details in background
      fetchYouTubeDataForMovies(moviesFromDb).then(moviesWithYTData => {
        const shortVideosFromDb = moviesWithYTData.filter(movie => movie.duration && movie.duration <= 300);
        const finalCombined = [...shortVideosFromDb, ...shortsFromApi].sort(() => Math.random() - 0.5);
        setShorts(finalCombined);
      });
    });

    return () => unsub();
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-black text-foreground">
       <Header onAddMovieClick={() => setAddMovieOpen(true)} />
       <main className="flex-1 relative">
         {loading ? (
            <div className="flex items-center justify-center h-full">
                <div className="w-full max-w-sm aspect-[9/16] bg-muted rounded-lg animate-pulse"></div>
            </div>
         ) : (
            <ShortsViewer movies={shorts} />
         )}
       </main>
       <AddMovieDialog
        isOpen={isAddMovieOpen}
        onOpenChange={setAddMovieOpen}
        onMovieAdded={() => { /* handle movie added if necessary */ }}
      />
    </div>
  );
}
