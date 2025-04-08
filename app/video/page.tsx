'use client';

import React, { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabase';
import VideoPlayer from '../components/VideoPlayer';
import { FiLoader } from 'react-icons/fi';

// Definicja typów dla filmów
interface Video {
  id: string;
  title: string;
  video_url: string;
  category: string;
  likes: number;
  created_at: string;
}

interface UserLike {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

// Funkcja walidująca URL wideo
const isValidVideoUrl = (url: string): boolean => {
  if (!url) return false;
  if (url === 'Download') return false;
  
  // Sprawdź czy URL zawiera rozszerzenie wideo
  const hasVideoExtension = /\.(mp4|webm|mov|ogg)$/i.test(url);
  const isFullUrl = url.startsWith('http://') || url.startsWith('https://');
  
  // Pełne URL-e zawsze uznajemy za potencjalnie prawidłowe
  if (isFullUrl) return true;
  
  // Dla lokalnych plików wymagamy rozszerzenia wideo lub uznajemy, że można dodać .mp4
  return true;
};

export default function VideoPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  
  const { isLoading, user } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Prevent scrolling on body when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    
    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);
  
  // Przekieruj do logowania, jeśli użytkownik nie jest zalogowany
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);
  
  // Touch handlers for swipe navigation
  const handleTouchStart = (e: TouchEvent) => {
    // Zapisujemy pozycję początkową tylko gdy dotknięto głównego obszaru, nie przycisków kontrolnych
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    setTouchStartY(e.touches[0].clientY);
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartY === null) return;
    
    // Upewniamy się, że interakcja nie była z przyciskiem
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    const touchEndY = e.changedTouches[0].clientY;
    const yDiff = touchStartY - touchEndY;
    
    // If the swipe is significant enough (more than 50px)
    if (Math.abs(yDiff) > 50) {
      if (yDiff > 0) {
        // Swipe up - go to next video
        goToNextVideo();
      } else {
        // Swipe down - go to previous video
        goToPrevVideo();
      }
    }
    
    setTouchStartY(null);
  };
  
  // Sprawdź czy plik wideo istnieje
  const checkVideoExists = useCallback(async (videoUrl: string) => {
    // Ignoruj pełne URLe zewnętrzne
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      return true;
    }
    
    try {
      // Jeśli URL to tylko nazwa pliku, sprawdź czy istnieje w buckecie
      const fileName = videoUrl.split('/').pop();
      const { data, error } = await supabase
        .storage
        .from('videos')
        .list('', { 
          search: fileName 
        });
      
      if (error) {
        console.error('Błąd podczas sprawdzania istnienia pliku wideo:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (err) {
      console.error('Błąd podczas sprawdzania istnienia pliku wideo:', err);
      return false;
    }
  }, []);
  
  // Pobierz filmy z Supabase
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Filtruj filmy z nieprawidłowymi URL
        const validVideos = data.filter(video => isValidVideoUrl(video.video_url));
        
        // Debugowanie URL wideo
        console.log('Pobrane filmy:', data.map(v => ({ 
          id: v.id, 
          title: v.title, 
          url: v.video_url,
          valid: isValidVideoUrl(v.video_url)
        })));
        
        if (validVideos.length === 0) {
          setVideos([]);
          setError('Brak prawidłowych filmów do wyświetlenia. Sprawdź URL w bazie danych.');
        } else {
          setVideos(validVideos as Video[]);
        }
      } else {
        setVideos([]);
        setError('Brak filmów do wyświetlenia');
      }
    } catch (err) {
      console.error('Błąd podczas pobierania filmów:', err);
      setError('Nie można załadować filmów. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Pobierz polubione filmy użytkownika
  const fetchUserLikes = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('video_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (data) {
        setUserLikes(data.map((like: { video_id: string }) => like.video_id));
      }
    } catch (err) {
      console.error('Błąd podczas pobierania polubionych filmów:', err);
      // Cicho obsługujemy błąd, aby nie przerywać działania aplikacji
    }
  }, [user]);
  
  // Aktualizuj dane przy zmianie użytkownika
  useEffect(() => {
    fetchVideos();
    fetchUserLikes();
  }, [fetchVideos, fetchUserLikes]);
  
  // Obsługa polubienia filmu
  const handleLike = async (videoId: string, liked: boolean) => {
    if (!user || videos.length === 0) return;
    
    try {
      // Aktualizacja stanu lokalnego (optymistyczne renderowanie)
      if (liked) {
        if (!userLikes.includes(videoId)) {
          setUserLikes([...userLikes, videoId]);
        }
      } else {
        setUserLikes(userLikes.filter(id => id !== videoId));
      }
      
      // Aktualizacja liczby polubień dla filmu
      const videoIndex = videos.findIndex(v => v.id === videoId);
      if (videoIndex >= 0) {
        const updatedVideos = [...videos];
        updatedVideos[videoIndex] = {
          ...updatedVideos[videoIndex],
          likes: liked 
            ? updatedVideos[videoIndex].likes + 1 
            : Math.max(0, updatedVideos[videoIndex].likes - 1)
        };
        setVideos(updatedVideos);
      }
      
      // Zapisanie zmiany w bazie danych
      if (!liked) {
        // Usuń polubienie
        await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId);
      } else {
        // Dodaj polubienie
        await supabase
          .from('user_likes')
          .insert([{ user_id: user.id, video_id: videoId }]);
      }
      
      // Aktualizacja liczby polubień filmu w bazie danych
      await supabase
        .from('videos')
        .update({ likes: videos.find(v => v.id === videoId)?.likes || 0 })
        .eq('id', videoId);
        
    } catch (err) {
      console.error('Błąd podczas aktualizacji polubienia:', err);
      // Cofnij zmiany w przypadku błędu
      fetchUserLikes();
      fetchVideos();
    }
  };
  
  // Nawigacja do następnego filmu
  const goToNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };
  
  // Nawigacja do poprzedniego filmu
  const goToPrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };
  
  // Jeśli trwa ładowanie danych autoryzacji, pokaż komunikat ładowania
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FiLoader className="animate-spin text-4xl text-primary" />
      </div>
    );
  }
  
  return (
    <div 
      className="flex flex-col h-screen w-full overflow-hidden bg-black touch-none"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Główny obszar wideo */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <FiLoader className="animate-spin text-4xl text-primary" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            <div className="bg-gray-800/90 p-6 rounded-lg max-w-md">
              <p className="text-gray-200">{error}</p>
              <button 
                onClick={() => fetchVideos()}
                className="mt-4 bg-primary text-white px-4 py-2 rounded-full"
              >
                Odśwież
              </button>
            </div>
          </div>
        ) : videos.length > 0 ? (
          <div className="absolute inset-0">
            <VideoPlayer
              key={videos[currentVideoIndex].id}
              videoId={videos[currentVideoIndex].id}
              title={videos[currentVideoIndex].title}
              videoUrl={videos[currentVideoIndex].video_url}
              isAuthenticated={!!user}
              likes={videos[currentVideoIndex].likes}
              userLiked={userLikes.includes(videos[currentVideoIndex].id)}
              onLike={handleLike}
              onVideoEnded={goToNextVideo}
            />
            
            {/* Video debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute bottom-48 left-4 right-4 bg-black/50 p-2 rounded text-xs text-white z-10 overflow-hidden">
                <details>
                  <summary>Debug info</summary>
                  <p className="truncate">URL: {videos[currentVideoIndex].video_url}</p>
                  <p>ID: {videos[currentVideoIndex].id}</p>
                </details>
              </div>
            )}
            
            {/* Swipe indicator when on first or last video */}
            {currentVideoIndex === 0 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/30 px-3 py-1 rounded-full text-white text-xs z-10">
                Przesuń w górę dla następnego
              </div>
            )}
            {currentVideoIndex === videos.length - 1 && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/30 px-3 py-1 rounded-full text-white text-xs z-10">
                Przesuń w dół dla poprzedniego
              </div>
            )}
            
            {/* Video counter */}
            <div className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded text-xs text-white z-10">
              {currentVideoIndex + 1} / {videos.length}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
} 