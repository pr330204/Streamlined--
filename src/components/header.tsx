
"use client";

import { Play, Search, ArrowLeft, Mic, MicOff, Video, LogOut, Coins, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


interface HeaderProps {
  onAddMovieClick: () => void;
  onSearch?: (query: string) => void;
}

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

export function Header({ onAddMovieClick, onSearch }: HeaderProps) {
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout } = useUser();

  const isWatchPage = pathname === '/watch';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!SpeechRecognition) {
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      onSearch?.(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast({
            variant: "destructive",
            title: "Voice Search Error",
            description: "Could not recognize your speech. Please try again.",
        })
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };

  }, [onSearch, toast]);


  const handleSearchToggle = () => {
    if (isSearchVisible) {
      setSearchQuery("");
      onSearch?.("");
    }
    setSearchVisible(!isSearchVisible);
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
        toast({
            variant: "destructive",
            title: "Not Supported",
            description: "Your browser does not support voice search.",
        })
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  }

  const UserMenu = () => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            {user && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Hi, {user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground flex items-center">
                       <Coins className="mr-1 h-3 w-3 text-yellow-500" /> {user.coins ?? 0} Coins
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onAddMovieClick}>
              <Video className="mr-2 h-4 w-4" />
              <span>Add Video</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isWatchPage) {
     return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-lg">
          <div className="container flex h-16 max-w-7xl items-center mx-auto px-4">
             <div className="mr-4 flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                  <ArrowLeft className="h-6 w-6" />
              </Button>
              <Link href="/" className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-md p-2">
                  <Play className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold hidden sm:inline">Streamlined</span>
              </Link>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-2">
               {user && <UserMenu />}
            </div>
          </div>
        </header>
     )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 max-w-7xl items-center mx-auto px-4">
        <div className={`mr-4 flex items-center gap-3 ${isSearchVisible ? 'hidden sm:flex' : 'flex'}`}>
           <div className="bg-primary text-primary-foreground rounded-md p-2">
             <Play className="h-6 w-6" />
           </div>
           <span className="text-2xl font-bold">Streamlined</span>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
            <div className={`flex-1 mx-auto max-w-md ${isSearchVisible ? 'block' : 'hidden'} sm:block`}>
                <div className="relative">
                    {isSearchVisible && <Button size="icon" variant="ghost" className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 sm:hidden" onClick={handleSearchToggle}><ArrowLeft/></Button>}
                    <Input 
                        type="search" 
                        placeholder="Search videos..."
                        className={`w-full bg-muted/40 pr-10 ${isSearchVisible ? 'pl-10 sm:pl-3' : ''}`}
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    {isClient && SpeechRecognition && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                            onClick={handleMicClick}
                        >
                            {isListening ? <MicOff className="text-destructive" /> : <Mic />}
                        </Button>
                    )}
                </div>
            </div>
           
            <Button size="icon" variant="ghost" className="sm:hidden rounded-full" onClick={handleSearchToggle}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
            </Button>
            
            {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
