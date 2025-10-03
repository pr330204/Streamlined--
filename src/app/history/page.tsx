
"use client";

import { useState, useEffect } from "react";
import type { Movie } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { MovieList } from "@/components/movie-list";
import { getHistory } from "@/lib/history";
import { fetchYouTubeDataForMovies } from "@/lib/youtube";
import { getYouTubeVideoId } from "@/lib/utils";

export default function HistoryPage() {
  const [historyMovies, setHistoryMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const watchedIds = getHistory();
      
      if (watchedIds.length === 0) {
        setHistoryMovies([]);
        setLoading(false);
        return;
      }

      // Firestore 'in' queries are limited to 30 items.
      // We need to chunk the requests.
      const MAX_IN_CLAUSE_SIZE = 30;
      const chunks: string[][] = [];
      for (let i = 0; i < watchedIds.length; i += MAX_IN_CLAUSE_SIZE) {
        chunks.push(watchedIds.slice(i, i + MAX_IN_CLAUSE_SIZE));
      }

      const moviePromises = chunks.map(chunk => {
        const q = query(collection(db, "movies"), where("__name__", "in", chunk));
        return getDocs(q);
      });

      try {
        const querySnapshots = await Promise.all(moviePromises);
        let moviesFromDb: Movie[] = [];
        querySnapshots.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            moviesFromDb.push({ 
              id: doc.id, 
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
            } as Movie);
          });
        });
        
        const moviesWithData = await fetchYouTubeDataForMovies(moviesFromDb);

        // Sort movies by the order they were watched (most recent first)
        const sortedMovies = moviesWithData.sort((a, b) => {
            const aId = getYouTubeVideoId(a.url) || a.id;
            const bId = getYouTubeVideoId(b.url) || b.id;
            return watchedIds.indexOf(bId) - watchedIds.indexOf(aId);
        });

        setHistoryMovies(sortedMovies);
      } catch (error) {
        console.error("Error fetching history movies: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Header onAddMovieClick={() => setAddMovieOpen(true)} />
      <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
        <div className="container max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Watch History</h1>
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
            <MovieList movies={historyMovies} />
          )}
           {!loading && historyMovies.length === 0 && (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center col-span-full">
                <h3 className="text-lg font-semibold tracking-tight">Your history is empty</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Videos you watch will appear here.
                </p>
            </div>
           )}
        </div>
      </main>
      <AddMovieDialog
        isOpen={isAddMovieOpen}
        onOpenChange={setAddMovieOpen}
        onMovieAdded={() => {}}
      />
    </div>
  );
}
