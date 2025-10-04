
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { UsernameDialog } from '@/components/username-dialog';

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

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem('username');
    if (storedName) {
      setUserState({ id: storedName.toLowerCase(), name: storedName });
    }
    setLoading(false);
  }, []);

  const setUser = (name: string) => {
    localStorage.setItem('username', name);
    setUserState({ id: name.toLowerCase(), name });
  };

  const logout = () => {
    localStorage.removeItem('username');
    setUserState(null);
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
