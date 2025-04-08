'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any, user: User | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Funkcja do pobierania aktualnej sesji
  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Błąd pobierania sesji:', error);
        return;
      }
      
      if (data.session) {
        console.log('Session found:', data.session.user.email);
        setSession(data.session);
        setUser(data.session.user);
      } else {
        console.log('Brak aktywnej sesji');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Błąd:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Inicjalizacja...");
    
    // Funkcja do sprawdzania czy sesja jest dostępna
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Pobierz sesję z localStorage zamiast polegać na ciasteczkach
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Błąd inicjalizacji auth:', error);
          return;
        }
        
        if (data?.session) {
          console.log('Znaleziono sesję dla:', data.session.user.email);
          setSession(data.session);
          setUser(data.session.user);
        } else {
          console.log('Brak aktywnej sesji podczas inicjalizacji');
        }
      } catch (err) {
        console.error('Błąd podczas inicjalizacji auth:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Wywołaj sprawdzenie autoryzacji
    checkAuth();
    
    // Ustaw nasłuchiwanie na zmiany stanu autoryzacji
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Zmiana stanu autoryzacji:', event);
        
        if (newSession) {
          console.log('Nowa sesja dla:', newSession.user.email);
          setSession(newSession);
          setUser(newSession.user);
        } else {
          console.log('Brak sesji po zmianie stanu');
          setSession(null);
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // Sprzątanie po unmount
    return () => {
      console.log('Sprzątanie AuthProvider');
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Logowanie
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log(`Próba logowania: ${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Błąd logowania:', error);
        return { error };
      }
      
      console.log('Logowanie udane:', data.user?.email);
      setUser(data.user);
      setSession(data.session);
      
      // Zapisz session w localStorage dla dodatkowego bezpieczeństwa
      if (typeof window !== 'undefined') {
        localStorage.setItem('authUser', JSON.stringify(data.user));
        localStorage.setItem('authTimestamp', Date.now().toString());
      }
      
      return { error: null };
    } catch (error) {
      console.error('Nieoczekiwany błąd podczas logowania:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Rejestracja
  const signUp = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    try {
      console.log(`Próba rejestracji: ${email}`);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        console.error('Błąd rejestracji:', error);
        return { error, user: null };
      }

      console.log('Rejestracja udana:', data.user.email);
      
      // Utwórz profil użytkownika
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: data.user.id,
          email: email,
          username: username,
          avatar_url: null,
          selected_topics: [],
          liked_videos: [],
        },
      ]);

      if (profileError) {
        console.error('Błąd tworzenia profilu:', profileError);
        return { error: profileError, user: data.user };
      }

      setUser(data.user);
      setSession(data.session);
      
      return { error: null, user: data.user };
    } catch (error) {
      console.error('Nieoczekiwany błąd podczas rejestracji:', error);
      return { error, user: null };
    } finally {
      setIsLoading(false);
    }
  };

  // Wylogowanie
  const signOut = async () => {
    try {
      console.log('Wylogowywanie...');
      await supabase.auth.signOut();
      
      // Wyczyść dane użytkownika
      setUser(null);
      setSession(null);
      
      // Wyczyść localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authUser');
        localStorage.removeItem('authTimestamp');
        localStorage.removeItem('supabase.auth.token');
      }
      
      console.log('Wylogowanie udane, przekierowanie do /login');
      
      // Zredukowane opóźnienie do przekierowania dla lepszego UX
      setTimeout(() => {
        window.location.href = '/login';
      }, 50);
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook do korzystania z kontekstu auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 