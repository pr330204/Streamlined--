'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Movie } from '@/lib/types';
import { Header } from '@/components/header';
import { AddMovieDialog } from '@/components/add-movie-dialog';
import { Button } from '@/components/ui/button';
import { Heart, Download, ListPlus, Share2, PlayCircle } from 'lucide-react';
import { MovieList } from '@/components/movie-list';
import { getYouTubeEmbedUrl } from '@/lib/utils';
import Image from 'next/image';
import AdMobBanner from '@/components/admob-banner';
import { fetchYouTubeDataForMovies } from '@/lib/youtube';

export default function WatchPageContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('v');
  const [movie, setMovie] = useState<Movie | null>(null);
  const [suggestedMovies, setSuggestedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    const fetchMovie = async () => {
      setLoading(true);
      const docRef = doc(db, 'movies', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const movieData = { id: docSnap.id, ...docSnap.data() } as Movie;
        const [movieWithYTData] = await fetchYouTubeDataForMovies([movieData]);
        setMovie(movieWithYTData);
      } else {
        console.log('No such document!');
      }
      setLoading(false);
    };

    fetchMovie();
  }, [docId]);

  useEffect(() => {
    const q = query(collection(db, "movies"), orderBy("votes", "desc"), limit(10));
    const unsub = onSnapshot(q, async (snapshot) => {
      const moviesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      const moviesWithYTData = await fetchYouTubeDataForMovies(moviesData);
      setSuggestedMovies(moviesWithYTData);
    });

    return () => unsub();
  }, []);
  
  const embedUrl = useMemo(() => {
    if (movie?.url) {
      const url = getYouTubeEmbedUrl(movie.url);
      return url ? `${url}?autoplay=1&rel=0` : null;
    }
    return null;
  }, [movie?.url]);

  if (loading) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
            <Header onAddMovieClick={() => setAddMovieOpen(true)} />
            <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
                <div className="aspect-video bg-muted rounded-lg animate-pulse"></div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
                    <div className="h-5 w-1/2 bg-muted rounded animate-pulse"></div>
                    <div className="h-5 w-1/3 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="w-24 h-36 bg-muted rounded-md animate-pulse"></div>
                </div>
                <div className="h-12 w-full bg-muted rounded-lg animate-pulse"></div>
                <div className="flex justify-around py-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                      <div className="h-8 w-8 bg-muted rounded-full"></div>
                      <div className="h-4 w-12 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
            </div>
             <AddMovieDialog isOpen={isAddMovieOpen} onOpenChange={setAddMovieOpen} onMovieAdded={() => {}} />
        </div>
    );
  }

  if (!movie) {
    return (
       <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
         <Header onAddMovieClick={() => setAddMovieOpen(true)} />
         <div className="flex-1 flex items-center justify-center">
            <p>Video not found.</p>
         </div>
         <AddMovieDialog isOpen={isAddMovieOpen} onOpenChange={setAddMovieOpen} onMovieAdded={() => {}} />
       </div>
    );
  }

  const otherMovies = suggestedMovies.filter(m => m.id !== movie.id);

  const metadata = [
    { label: "Print", value: "HD 720p" },
    { label: "Industry", value: "South" },
    { label: "Category", value: "Comedy, Drama, Thriller" },
    { label: "Language", value: "Hindi" },
    { label: "Quality", value: "480p, 720p" },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Header onAddMovieClick={() => setAddMovieOpen(true)} />
      <main className="flex-1">
        <div className="aspect-video overflow-hidden bg-black">
           {embedUrl && (
              <iframe
                key={movie.id}
                width="100%"
                height="100%"
                src={embedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
           )}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold">{movie.title}</h1>
              {metadata.map(item => (
                <div key={item.label} className="text-sm">
                  <span className="font-semibold text-primary">{item.label}: </span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="w-24 shrink-0">
                <Image 
                    src={movie.thumbnailUrl || 'https://placehold.co/96x144.png'}
                    alt={`Poster for ${movie.title}`}
                    width={96}
                    height={144}
                    className="rounded-md object-cover"
                    data-ai-hint="movie poster"
                />
            </div>
          </div>

          <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg">
            <PlayCircle className="mr-2 h-6 w-6" />
            Watch Now
          </Button>

          <div className="py-2">
            <AdMobBanner />
          </div>
          
          <div className="flex justify-around text-center py-2">
            <div className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="h-6 w-6"/>
              <span className="text-xs font-semibold">Like</span>
            </div>
             <div className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground transition-colors">
              <Download className="h-6 w-6"/>
              <span className="text-xs font-semibold">Download</span>
            </div>
             <div className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground transition-colors">
              <ListPlus className="h-6 w-6"/>
              <span className="text-xs font-semibold">My List</span>
            </div>
             <div className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="h-6 w-6"/>
              <span className="text-xs font-semibold">Share</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Recommended For You</h2>
            <MovieList movies={otherMovies} variant="grid-condensed" />
          </div>
        </div>

      </main>
      <AddMovieDialog isOpen={isAddMovieOpen} onOpenChange={setAddMovieOpen} onMovieAdded={() => {}}/>
    </div>
  );
}
