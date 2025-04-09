'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabase';
import InteractiveVideoPlayer from '../components/InteractiveVideoPlayer';
import { FiLoader } from 'react-icons/fi';
import Link from 'next/link';
import SetupInstructions from './setup-instructions';

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

export default function InteractiveVideoPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  
  const { isLoading, user } = useAuth();
  const router = useRouter();
  
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
  
  // Funkcja walidująca URL wideo
  const isValidVideoUrl = (url: string): boolean => {
    if (!url) return false;
    if (url === 'Download') return false;
    
    // Sprawdź czy URL zawiera rozszerzenie wideo
    const hasVideoExtension = /\.(mp4|webm|mov|ogg)$/i.test(url);
    const isFullUrl = url.startsWith('http://') || url.startsWith('https://');
    
    if (isFullUrl) return true;
    return true;
  };
  
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
    } catch (err) {
      console.error('Błąd podczas obsługi polubienia:', err);
    }
  };
  
  // Przejście do następnego filmu
  const goToNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };
  
  // Przejście do poprzedniego filmu
  const goToPrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };
  
  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FiLoader className="animate-spin text-3xl mr-2" />
        <p>Ładowanie interaktywnych filmów...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <h2 className="text-2xl mb-4">Błąd wczytywania</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchVideos}
          className="py-2 px-4 bg-blue-600 text-white rounded-md"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <h2 className="text-2xl mb-4">Brak dostępnych filmów</h2>
        <Link href="/video" className="py-2 px-4 bg-blue-600 text-white rounded-md">
          Przejdź do zwykłych filmów
        </Link>
      </div>
    );
  }
  
  const currentVideo = videos[currentVideoIndex];
  
  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Video Header */}
      <div className="p-4 bg-gray-900 text-white">
        <h1 className="text-xl font-bold">Filmy Interaktywne z Checkpointami</h1>
        <p className="text-sm text-gray-300">
          Film zatrzyma się co 15 minut i będziesz musiał odpowiedzieć na pytanie, 
          aby kontynuować oglądanie.
        </p>
      </div>
      
      {/* Video Container */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <InteractiveVideoPlayer
            videoId={currentVideo.id}
            title={currentVideo.title}
            videoUrl={currentVideo.video_url}
            isAuthenticated={!!user}
            likes={currentVideo.likes}
            userLiked={userLikes.includes(currentVideo.id)}
            onLike={handleLike}
            onVideoEnded={goToNextVideo}
          />
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
        <button 
          onClick={goToPrevVideo}
          disabled={currentVideoIndex === 0}
          className={`py-2 px-4 rounded-md ${
            currentVideoIndex === 0 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Poprzedni film
        </button>
        
        <div className="text-center">
          {currentVideoIndex + 1} / {videos.length}
        </div>
        
        <button 
          onClick={goToNextVideo}
          disabled={currentVideoIndex === videos.length - 1}
          className={`py-2 px-4 rounded-md ${
            currentVideoIndex === videos.length - 1 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Następny film
        </button>
      </div>
      
      {/* Setup Instructions */}
      <SetupInstructions />
    </div>
  );
} 