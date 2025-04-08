'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function RedirectHandler() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const redirectedRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Zabezpieczenie przed zapętleniem
    if (redirectedRef.current || isLoading) return;
    
    // Publicznie dostępne ścieżki
    const publicPaths = ['/login', '/register'];
    
    // Zapamiętaj ostatnie przekierowanie w localStorage
    const lastRedirectKey = 'lastRedirect';
    const lastRedirectTime = localStorage.getItem(lastRedirectKey);
    const currentTime = Date.now();
    
    // Jeśli ostatnie przekierowanie było mniej niż 2 sekundy temu, przerwij
    if (lastRedirectTime && currentTime - parseInt(lastRedirectTime) < 2000) {
      console.log('Przerwanie potencjalnej pętli przekierowań');
      return;
    }
    
    if (user) {
      // Użytkownik zalogowany, ale na publicznie dostępnej ścieżce
      if (publicPaths.includes(pathname)) {
        console.log('RedirectHandler: Przekierowuję zalogowanego użytkownika do /video');
        redirectedRef.current = true;
        localStorage.setItem(lastRedirectKey, currentTime.toString());
        window.location.href = '/video';
      }
    } else {
      // Użytkownik niezalogowany, ale na chronionej ścieżce
      if (!publicPaths.includes(pathname) && pathname !== '/') {
        console.log('RedirectHandler: Przekierowuję niezalogowanego użytkownika do /login');
        redirectedRef.current = true;
        localStorage.setItem(lastRedirectKey, currentTime.toString());
        window.location.href = '/login';
      }
    }
  }, [user, isLoading, pathname]);
  
  // Komponent nie renderuje niczego - działa tylko jako logika
  return null;
} 