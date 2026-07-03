'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const { data: session } = useSession();
  const [isFullAdmin, setIsFullAdmin] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('fullAdminUnlocked');
    if (stored === 'true') {
      setIsFullAdmin(true);
    }
  }, []);

  // Reset on logout
  useEffect(() => {
    if (!session) {
      setIsFullAdmin(false);
      localStorage.removeItem('fullAdminUnlocked');
    }
  }, [session]);

  const unlockFullAdmin = () => {
    setIsFullAdmin(true);
    localStorage.setItem('fullAdminUnlocked', 'true');
  };

  const exitFullAdmin = () => {
    setIsFullAdmin(false);
    localStorage.removeItem('fullAdminUnlocked');
  };

  return (
    <RoleContext.Provider value={{ isFullAdmin, unlockFullAdmin, exitFullAdmin }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}