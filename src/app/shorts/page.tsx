
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchShortsAction } from "@/lib/actions";
import { Loader2 } from "lucide-react";

interface YouTubeShort {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
  };
}

function ShortCard({ item }: { item: YouTubeShort }) {
  const videoId = item.id.videoId;
  return (
    <section className="h-[calc(100vh-56px)] w-full flex items-center justify-center relative snap-center">
      <div className="w-[360px] h-[640px] max-w-[92vw] max-h-[94vh] rounded-lg overflow-hidden relative bg-black shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}`}
          frameBorder="0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
        <div className="absolute right-2 bottom-28 flex flex-col gap-4 items-center z-10">
          <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-xl">👍</div>
          <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-xl">💬</div>
          <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-xl">↗️</div>
        </div>
      </div>
    </section>
  );
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<YouTubeShort[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const handleFetchShorts = useCallback(async (query: string, pageToken: string | null) => {
    setLoading(true);
    try {
      const result = await fetchShortsAction(query, pageToken);
      if (result.success && result.data) {
        setShorts(prev => pageToken ? [...prev, ...result.data.items] : result.data.items);
        setNextPageToken(result.data.nextPageToken || null);
      } else {
        console.error(result.message);
        alert('Error fetching videos. Please check the API key and quota in your .env file.');
      }
    } catch (error) {
      console.error(error);
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
      if(initialLoad) setInitialLoad(false);
    }
  }, [initialLoad]);

  const handleSearch = () => {
    setShorts([]);
    setNextPageToken(null);
    handleFetchShorts(searchQuery || 'shorts', null);
  };

  useEffect(() => {
    handleFetchShorts('shorts', null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between px-4 bg-gradient-to-b from-black/60 to-transparent">
        <h1 className="text-xl font-bold">Shorts</h1>
        <div className="flex gap-2">
          <Input 
            placeholder="Search..." 
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="destructive">Search</Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto snap-y snap-mandatory">
        {initialLoad && loading ? (
           <div className="flex h-full w-full items-center justify-center text-lg">
             <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading Shorts...
           </div>
        ) : shorts.length > 0 ? (
          shorts.map((item) => <ShortCard key={item.id.videoId} item={item} />)
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg text-gray-400">
            No results found.
          </div>
        )}
      </main>

      {nextPageToken && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button onClick={() => handleFetchShorts(searchQuery || 'shorts', nextPageToken)} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
