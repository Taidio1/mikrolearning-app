'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import supabase from '../../lib/supabase';
import VideoPlayer from '../../app/components/VideoPlayer';
import VideoControls from '../../app/components/VideoControls';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

interface Video {
  id: string;
  title: string;
  video_url: string;
  category: string;
  likes: number;
}

export default function VideoPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 5;
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Obsługa dotknięcia ekranu (dla urządzeń mobilnych)
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    
    // Przesunięcie w dół
    if (diff > 50) {
      handleNext();
    }
    // Przesunięcie w górę
    else if (diff < -50) {
      handlePrevious();
    }
    
    setTouchStart(null);
  };

  // Funkcja do ładowania większej ilości wideo
  const fetchMoreVideos = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching more videos:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Dodaj nowe filmy do istniejącej listy
        setVideos(prev => [...prev, ...data as Video[]]);
        setPage(prev => prev + 1);
      }
      
      // Jeśli otrzymaliśmy mniej filmów niż PAGE_SIZE, nie ma więcej do załadowania
      if (!data || data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Unexpected error fetching more videos:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Załaduj początkowe wideo
  useEffect(() => {
    async function fetchInitialVideos() {
      setLoading(true);
      setVideos([]);
      setPage(0);
      setHasMore(true);
      
      try {
        let query = supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1);
        
        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching videos:', error);
          return;
        }
        
        if (data) {
          setVideos(data as Video[]);
          setPage(1);
          
          // Jeśli otrzymaliśmy mniej filmów niż PAGE_SIZE, nie ma więcej do załadowania
          if (data.length < PAGE_SIZE) {
            setHasMore(false);
          }
          
          // Pobierz kategorie
          const { data: allVideos } = await supabase.from('videos').select('category');
          if (allVideos) {
            const uniqueCategories = Array.from(
              new Set(allVideos.map((video: any) => video.category))
            );
            setCategories(uniqueCategories as string[]);
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInitialVideos();
  }, [selectedCategory]);

  // Automatycznie załaduj więcej wideo, gdy zbliżamy się do końca
  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex >= videos.length - 2 && hasMore) {
      fetchMoreVideos();
    }
  }, [currentVideoIndex, videos.length, hasMore]);

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleSwipeUp = () => {
    handleNext();
  };

  const handleSwipeDown = () => {
    handlePrevious();
  };

  const handleLike = async (videoId: string) => {
    // Increment likes in database
    const { data, error } = await supabase
      .from('videos')
      .update({ likes: videos[currentVideoIndex].likes + 1 })
      .eq('id', videoId);
      
    if (error) {
      console.error('Error liking video:', error);
      return;
    }
    
    // Update local state
    const updatedVideos = [...videos];
    updatedVideos[currentVideoIndex].likes += 1;
    setVideos(updatedVideos);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentVideoIndex(0);
    setShowCategories(false);
  };

  // Obsługa przewijania kółkiem myszy
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel);
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentVideoIndex]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-pulse text-white text-xl">Ładowanie filmów...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 bg-black text-white">
        <h2 className="text-2xl mb-4">Brak dostępnych filmów</h2>
        {selectedCategory && (
          <button 
            onClick={() => handleCategorySelect(null)}
            className="py-2 px-4 bg-blue-600 text-white rounded-md"
          >
            Pokaż wszystkie filmy
          </button>
        )}
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-16 relative">
      {/* Category toggle */}
      <button
        onClick={() => setShowCategories(!showCategories)}
        className="absolute top-2 right-2 z-50 bg-black bg-opacity-50 p-2 rounded-full"
      >
        {showCategories ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      
      {/* Category selector */}
      {showCategories && (
        <div className="absolute top-12 right-2 z-50 bg-black bg-opacity-80 p-3 rounded-lg max-w-[200px] backdrop-blur-sm">
          <div className="space-y-2">
            <button 
              className={`block px-3 py-1 w-full text-left rounded-md text-sm ${!selectedCategory ? 'bg-blue-600' : 'bg-gray-800'}`}
              onClick={() => handleCategorySelect(null)}
            >
              Wszystkie
            </button>
            
            {categories.map((category) => (
              <button 
                key={category}
                className={`block px-3 py-1 w-full text-left rounded-md text-sm ${selectedCategory === category ? 'bg-blue-600' : 'bg-gray-800'}`}
                onClick={() => handleCategorySelect(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Video player - z obsługą dotyku */}
      <div 
        className="flex-1 flex flex-col" 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentVideo && (
          <div className="relative h-full w-full">
            {/* Swipe areas */}
            <div 
              className="absolute top-0 left-0 w-full h-1/3 z-10" 
              onClick={handleSwipeDown}
            />
            <div 
              className="absolute bottom-0 left-0 w-full h-1/3 z-10" 
              onClick={handleSwipeUp}
            />

            {/* Video */}
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                <VideoPlayer url={currentVideo.video_url} />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <h2 className="text-xl font-semibold mb-1">{currentVideo.title}</h2>
                <p className="text-gray-300 text-sm">{currentVideo.category}</p>
              </div>
              
              <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-8">
                <VideoControls 
                  onLike={() => handleLike(currentVideo.id)}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  likes={currentVideo.likes}
                  hasNext={currentVideoIndex < videos.length - 1}
                  hasPrevious={currentVideoIndex > 0}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Wskaźnik ładowania następnych filmów */}
        {loadingMore && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-16 left-0 w-full px-4">
        <div className="bg-gray-700 h-1 w-full rounded-full overflow-hidden">
          <div 
            className="bg-white h-full rounded-full" 
            style={{ width: `${((currentVideoIndex + 1) / (videos.length + (hasMore ? 5 : 0))) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1 text-center">
          {currentVideoIndex + 1} / {videos.length}{hasMore && '+'} 
        </div>
      </div>
      
      {/* Instrukcje przewijania */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-opacity-50 text-xs uppercase bg-black bg-opacity-30 py-1 px-2 rounded-full">
        <div className="flex flex-col items-center">
          <FaChevronUp className="mb-1" />
          <span>Przewiń</span>
          <FaChevronDown className="mt-1" />
        </div>
      </div>
    </div>
  );
} 