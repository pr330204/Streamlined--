import type { Movie } from "@/lib/types";
import { MovieCard } from "./movie-card";

interface MovieListProps {
  movies: Movie[];
  variant?: 'list' | 'grid' | 'grid-condensed';
  className?: string;
}

export function MovieList({ movies, variant = 'grid', className }: MovieListProps) {
  if (!movies || movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center col-span-full">
        <h3 className="text-lg font-semibold tracking-tight">No videos found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different search or add a new video.
        </p>
      </div>
    );
  }

  if (variant === 'list') {
     return (
        <div className={`flex flex-col gap-4 ${className}`}>
           {movies.map((movie) => (
             <MovieCard 
               key={movie.id} 
               movie={movie} 
               variant="list"
             />
           ))}
        </div>
     );
  }
  
  if (variant === 'grid-condensed') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ${className}`}>
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            variant="grid"
          />
        ))}
      </div>
    );
  }


  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 ${className}`}>
      {movies.map((movie) => (
        <MovieCard 
          key={movie.id} 
          movie={movie} 
          variant="grid"
        />
      ))}
    </div>
  );
}
