
"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot } from "lucide-react";
import { Header } from "@/components/header";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [broadcasts, setBroadcasts] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAddMovieOpen, setAddMovieOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats", user.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatMessage)
      );
      setMessages(msgs);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
      const q = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
          const broadcastsMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
          setBroadcasts(broadcastsMsgs);
      });
      return () => unsub();
  }, []);

  const allMessages = [...messages, ...broadcasts].sort(
    (a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await addDoc(collection(db, "chats", user.id, "messages"), {
      text: newMessage,
      senderId: user.id,
      senderName: user.name,
      timestamp: serverTimestamp(),
    });

    // Also create/update the chat thread doc for the admin view
    await setDoc(doc(db, "chats", user.id), {
        userId: user.id,
        userName: user.name,
        lastMessage: newMessage,
        lastUpdated: serverTimestamp(),
    }, { merge: true });

    setNewMessage("");
  };

  if (!user) {
    return (
       <div className="flex min-h-screen w-full flex-col bg-background text-foreground items-center justify-center">
         <p>Loading user...</p>
       </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <Header onAddMovieClick={() => setAddMovieOpen(true)} />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {allMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                msg.senderId === user?.id ? "justify-end" : "justify-start"
              )}
            >
              {msg.senderId !== user?.id && msg.senderId !== "admin" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                  {msg.senderName?.charAt(0).toUpperCase()}
                </div>
              )}
              {msg.senderId === "admin" && (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={cn(
                  "max-w-xs md:max-w-md p-3 rounded-lg",
                   msg.isBroadcast ? "bg-blue-600/20 border border-blue-500 w-full" : 
                  msg.senderId === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {msg.isBroadcast && <p className="font-bold text-blue-400 text-sm mb-1">Broadcast</p>}
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
           <div ref={messagesEndRef} />
        </div>
        <div className="border-t bg-card p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
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
