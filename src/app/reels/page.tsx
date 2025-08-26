
"use client";

import type { Movie } from "@/lib/types";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { fetchReelsAction } from "@/lib/actions";
import { ReelsViewer } from "@/components/reels-viewer";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReelsPage() {
  const [reels, setReels] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);

  useEffect(() => {
    const getReels = async () => {
      setLoading(true);
      const fetchedReels = await fetchReelsAction();
      if(fetchedReels) {
        setReels(fetchedReels);
      }
      setLoading(false);
    };

    getReels();
  }, []);
  
  return (
    <div className="flex h-screen w-full flex-col bg-black text-foreground">
      <Header onAddMovieClick={() => setAddMovieOpen(true)} />
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
          <ReelsViewer reels={reels} />
        )}
      </main>
      <AddMovieDialog
        isOpen={isAddMovieOpen}
        onOpenChange={setAddMovieOpen}
        onMovieAdded={() => {
            // Quick and dirty refresh
            window.location.reload();
        }}
      />
    </div>
  );
}
