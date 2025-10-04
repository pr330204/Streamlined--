
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { UsernameDialog } from '@/components/username-dialog';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/lib/types';

interface UserContextType {
  user: User | null;
  setUser: (name: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

function getUserId(): string {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = uuidv4();
        localStorage.setItem('userId', userId);
    }
    return userId;
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const userId = getUserId();
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as Omit<User, 'id'>;
      setUserState({ id: userId, ...userData });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Coin increment effect
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        coins: increment(1)
      });
      // Optimistically update local state
      setUserState(prevUser => prevUser ? { ...prevUser, coins: (prevUser.coins ?? 0) + 1 } : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const setUser = async (name: string) => {
    const userId = getUserId();
    const newUser: User = { id: userId, name, coins: 0 };
    try {
        await setDoc(doc(db, "users", userId), { name: newUser.name, coins: newUser.coins }, { merge: true });
        setUserState(newUser);
    } catch(error) {
        console.error("Error saving user to Firestore: ", error);
        setUserState(newUser);
    }
  };

  const logout = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        // To start fresh, we remove both userId and username
        localStorage.removeItem('userId');
        localStorage.removeItem('username'); // Old key, remove for cleanup
        setUserState(null);
        // We could also consider deleting the user doc from Firestore, but for now we'll leave it.
    }
  };

  if (loading) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {!user ? <UsernameDialog /> : children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
