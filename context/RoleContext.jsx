'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const { data: session } = useSession();
  const [isFullAdmin, setIsFullAdmin] = useState(false);

  // Reset when session changes (logout)
  useEffect(() => {
    if (!session) {
      setIsFullAdmin(false);
    }
  }, [session]);

  const unlockFullAdmin = () => setIsFullAdmin(true);

  return (
    <RoleContext.Provider value={{ isFullAdmin, unlockFullAdmin }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}