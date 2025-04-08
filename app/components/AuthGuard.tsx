'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Jeśli już przekierowaliśmy albo wciąż ładujemy, nie rób nic
    if (redirectedRef.current || isLoading) return;
    
    if (!user) {
      // Zapisujemy obecną ścieżkę, aby móc wrócić po zalogowaniu
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        localStorage.setItem('redirectAfterLogin', path);
        console.log(`AuthGuard: Zapisano przekierowanie po logowaniu na ${path}`);
      }
      
      console.log('AuthGuard: Przekierowanie niezalogowanego użytkownika do /login');
      redirectedRef.current = true;
      
      // Użyj window.location zamiast router dla bardziej bezpośredniego przekierowania
      window.location.href = '/login';
    }
  }, [user, isLoading, router]);

  // Wyświetl loader podczas sprawdzania sesji
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-pulse text-white text-xl">Ładowanie...</div>
      </div>
    );
  }

  // Jeśli użytkownik jest zalogowany, wyświetl zawartość strony
  if (user) {
    return <>{children}</>;
  }

  // Pokaż loader podczas przekierowania
  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="animate-pulse text-white text-xl">Przekierowywanie...</div>
    </div>
  );
} 