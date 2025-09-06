
"use client";

import type { Movie } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp, limit, startAfter, getDocs, DocumentSnapshot } from "firebase/firestore";
import { fetchYouTubeDataForMovies, fetchYouTubeShorts, YouTubeShortsResponse } from "@/lib/youtube";
import { ShortsViewer } from "@/components/shorts-viewer";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { getYouTubeVideoId } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);
  
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadInitialShorts = useCallback(async () => {
    setLoading(true);

    // Fetch from Firebase
    const firstBatchQuery = query(collection(db, "movies"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    const documentSnapshots = await getDocs(firstBatchQuery);
    
    const moviesFromDb = documentSnapshots.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      } as Movie
    }).filter(movie => getYouTubeVideoId(movie.url));
    
    const lastVisibleDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    // Fetch from YouTube API
    const shortsFromApiData = await fetchYouTubeShorts("trending shorts");
    setNextPageToken(shortsFromApiData.nextPageToken);
    
    // Combine, shuffle, and set initial data
    const combined = [...moviesFromDb, ...shortsFromApiData.videos]
      .filter(m => m.duration === undefined || m.duration <= 300)
      .sort(() => Math.random() - 0.5);
    
    setShorts(combined);
    setLoading(false);

    // Fetch details in background
    fetchYouTubeDataForMovies(moviesFromDb).then(moviesWithYTData => {
      const shortVideosFromDb = moviesWithYTData.filter(movie => movie.duration && movie.duration <= 300);
      setShorts(currentShorts => {
          const updatedShorts = currentShorts.map(s => moviesWithYTData.find(m => m.id === s.id) || s);
          const finalCombined = [...shortVideosFromDb, ...shortsFromApiData.videos].sort(() => Math.random() - 0.5);
          // A simple way to merge without duplicates and keep order
          const map = new Map();
          [...updatedShorts, ...finalCombined].forEach(item => map.set(item.id, item));
          return Array.from(map.values());
      });
    });

  }, []);

  useEffect(() => {
    loadInitialShorts();
  }, [loadInitialShorts]);

  const loadMoreShorts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    let newMoviesFromDb: Movie[] = [];
    let newShortsFromApi: Movie[] = [];

    // Fetch more from Firebase
    if (lastVisible) {
      const nextBatchQuery = query(
        collection(db, "movies"), 
        orderBy("createdAt", "desc"), 
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
      const documentSnapshots = await getDocs(nextBatchQuery);
      newMoviesFromDb = documentSnapshots.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as Movie
      }).filter(movie => getYouTubeVideoId(movie.url));
      
      const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(newLastVisible || null);
      if (documentSnapshots.docs.length < PAGE_SIZE) {
        // May have reached the end for Firebase
      }
    }

    // Fetch more from YouTube API
    if (nextPageToken) {
      const shortsFromApiData = await fetchYouTubeShorts("trending shorts", nextPageToken);
      newShortsFromApi = shortsFromApiData.videos;
      setNextPageToken(shortsFromApiData.nextPageToken);
    }
    
    if(newMoviesFromDb.length === 0 && newShortsFromApi.length === 0) {
        setHasMore(false);
    } else {
        const combined = [...newMoviesFromDb, ...newShortsFromApi]
          .filter(m => m.duration === undefined || m.duration <= 300)
          .sort(() => Math.random() - 0.5);
        
        setShorts(prevShorts => [...prevShorts, ...combined]);
        
        // Fetch details in background for new DB items
        fetchYouTubeDataForMovies(newMoviesFromDb);
    }

    setLoadingMore(false);
  }, [loadingMore, hasMore, lastVisible, nextPageToken]);


  return (
    <div className="flex h-screen w-full flex-col bg-black text-foreground">
       <Header onAddMovieClick={() => setAddMovieOpen(true)} />
       <main className="flex-1 relative">
         {loading ? (
            <div className="flex items-center justify-center h-full">
                <div className="w-full max-w-sm aspect-[9/16] bg-muted rounded-lg animate-pulse"></div>
            </div>
         ) : (
            <ShortsViewer 
              movies={shorts} 
              onEndReached={loadMoreShorts} 
              isLoadingMore={loadingMore}
            />
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
