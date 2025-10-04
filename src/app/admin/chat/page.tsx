
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Bot, Users } from "lucide-react";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { cn } from "@/lib/utils";
import type { ChatThread, ChatMessage } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const ADMIN_PASSWORD = "Prashant";

export default function AdminChatPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, "chats"), orderBy("lastUpdated", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatThread)
      );
      setChatThreads(threads);
    });

    return () => unsub();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    };

    const q = query(
      collection(db, "chats", selectedThread.userId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatMessage)
      );
      setMessages(msgs);
    });

    return () => unsub();
  }, [selectedThread]);
  
   useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect Password",
        description: "Please try again.",
      });
    }
    setPassword("");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    await addDoc(collection(db, "chats", selectedThread.userId, "messages"), {
      text: newMessage,
      senderId: "admin",
      senderName: "Admin",
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
        await addDoc(collection(db, "broadcasts"), {
            text: broadcastMessage,
            senderId: "admin",
            senderName: "Admin",
            timestamp: serverTimestamp(),
            isBroadcast: true,
        });
        setBroadcastMessage("");
        toast({
            title: "Broadcast Sent",
            description: "Your message has been sent to all users.",
        });
    } catch (error) {
        console.error("Error sending broadcast: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not send broadcast message.",
        });
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <Header onAddMovieClick={() => setAddMovieOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="container max-w-md mx-auto pt-10">
              <h1 className="text-2xl font-bold text-center mb-2">Admin Chat</h1>
              <p className="text-muted-foreground text-center mb-6">
                Please enter the password to access the chat dashboard.
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Access Dashboard
                </Button>
              </form>
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

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <Header onAddMovieClick={() => setAddMovieOpen(true)} />
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2"><Users size={20} /> Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {chatThreads.map(thread => (
                    <button key={thread.id} 
                           onClick={() => setSelectedThread(thread)}
                           className={cn(
                               "w-full text-left p-4 border-b hover:bg-muted",
                               selectedThread?.id === thread.id && "bg-muted"
                           )}>
                        <p className="font-semibold">{thread.userName}</p>
                        <p className="text-sm text-muted-foreground truncate">{thread.lastMessage}</p>
                    </button>
                ))}
            </div>
             <div className="p-4 border-t">
                <form onSubmit={handleSendBroadcast} className="space-y-2">
                    <Label htmlFor="broadcast">Send Broadcast to All</Label>
                    <Textarea 
                        id="broadcast"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="Type a message for all users..."
                        rows={3}
                    />
                    <Button type="submit" className="w-full" disabled={!broadcastMessage.trim()}>Send Broadcast</Button>
                </form>
            </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Chat with {selectedThread.userName}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      msg.senderId === "admin" ? "justify-end" : "justify-start"
                    )}
                  >
                     {msg.senderId !== "admin" && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                          {msg.senderName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    <div
                      className={cn(
                        "max-w-xs md:max-w-md p-3 rounded-lg",
                        msg.senderId === "admin"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                     {msg.senderId === "admin" && (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                      )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t bg-card p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedThread.userName}...`}
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a conversation to start chatting.</p>
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
