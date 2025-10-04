
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { UsernameDialog } from '@/components/username-dialog';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // I will add this dependency

interface User {
  id: string;
  name: string;
}

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
      setUserState({ id: userId, name: userSnap.data().name });
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const setUser = async (name: string) => {
    const userId = getUserId();
    const newUser = { id: userId, name };
    try {
        await setDoc(doc(db, "users", userId), { name });
        setUserState(newUser);
    } catch(error) {
        console.error("Error saving user to Firestore: ", error);
        // Fallback to local state if firestore fails
        setUserState(newUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setUserState(null);
    // We don't remove the localStorage 'username' because we want to start fresh with a new ID
    localStorage.removeItem('username');
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
