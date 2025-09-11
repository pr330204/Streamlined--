
"use client";

import type { Movie } from "@/lib/types";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadInitialShorts = useCallback(async () => {
    setLoading(true);

    // Fetch from Firebase
    const firstBatchQuery = query(collection(db, "movies"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    const documentSnapshots = await getDocs(firstBatchQuery);
    
    let moviesFromDb = documentSnapshots.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      } as Movie
    });
    
    const lastVisibleDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    // Fetch from YouTube API
    const shortsFromApiData = await fetchYouTubeShorts("trending shorts");
    setNextPageToken(shortsFromApiData.nextPageToken);

    // Fetch details for DB movies that are from YouTube
    const youtubeMoviesFromDb = moviesFromDb.filter(movie => getYouTubeVideoId(movie.url));
    const otherMoviesFromDb = moviesFromDb.filter(movie => !getYouTubeVideoId(movie.url));
    const youtubeMoviesWithData = await fetchYouTubeDataForMovies(youtubeMoviesFromDb);
    
    // Combine all sources
    const combined = [...youtubeMoviesWithData, ...otherMoviesFromDb, ...shortsFromApiData.videos];

    // Filter for unique videos
    const uniqueIds = new Set<string>();
    const uniqueShorts = combined.filter(movie => {
        const videoId = movie.id; // Use Firestore doc ID for uniqueness for uploaded videos
        if (videoId && !uniqueIds.has(videoId)) {
            uniqueIds.add(videoId);
            return true;
        }
        return false;
    });

    // Sort by date, newest first
    uniqueShorts.sort((a, b) => {
        const dateA = new Date(a.createdAt as string).getTime();
        const dateB = new Date(b.createdAt as string).getTime();
        return dateB - dateA;
    });
    
    setShorts(uniqueShorts);
    setLoading(false);
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
      });
      
      const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(newLastVisible || null);
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
        // Fetch details for new DB items that are from YouTube
        const newYoutubeMoviesFromDb = newMoviesFromDb.filter(movie => getYouTubeVideoId(movie.url));
        const newOtherMoviesFromDb = newMoviesFromDb.filter(movie => !getYouTubeVideoId(movie.url));
        const newYoutubeMoviesWithData = await fetchYouTubeDataForMovies(newYoutubeMoviesFromDb);

        const combined = [...newYoutubeMoviesWithData, ...newOtherMoviesFromDb, ...newShortsFromApi];
        
        setShorts(prevShorts => {
            const existingIds = new Set(prevShorts.map(s => s.id));
            const uniqueNewShorts = combined.filter(movie => {
                const videoId = movie.id;
                if (videoId && !existingIds.has(videoId)) {
                    existingIds.add(videoId);
                    return true;
                }
                return false;
            });
            return [...prevShorts, ...uniqueNewShorts];
        });
    }

    setLoadingMore(false);
  }, [loadingMore, hasMore, lastVisible, nextPageToken]);

  const filteredShorts = useMemo(() => {
    if (!searchQuery) {
      return shorts;
    }
    return shorts.filter((short) =>
      short.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shorts, searchQuery]);


  return (
    <div className="flex h-screen w-full flex-col bg-black text-foreground">
       <Header onAddMovieClick={() => setAddMovieOpen(true)} onSearch={setSearchQuery} />
       <main className="flex-1 snap-y snap-mandatory overflow-y-auto">
         {loading ? (
            <div className="flex items-center justify-center h-full">
                <div className="w-full max-w-sm aspect-[9/16] bg-muted rounded-lg animate-pulse"></div>
            </div>
         ) : (
            <ShortsViewer 
              movies={filteredShorts} 
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
