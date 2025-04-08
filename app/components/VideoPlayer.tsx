'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const previousUrlRef = useRef<string>(url);

  useEffect(() => {
    // Jeśli URL się zmienił, oznacz jako ładowanie
    if (previousUrlRef.current !== url) {
      setIsLoading(true);
      previousUrlRef.current = url;
    }

    let mounted = true;

    // Funkcja do odtwarzania wideo po załadowaniu
    const playVideo = async () => {
      if (videoRef.current && mounted) {
        try {
          // Zatrzymaj aktualne odtwarzanie przed zmianą źródła
          videoRef.current.pause();
          
          // Aktualizuj src zamiast używać load()
          const videoElement = videoRef.current;
          if (videoElement.querySelector('source')) {
            videoElement.querySelector('source')!.src = url;
          }
          
          // Załaduj nowe źródło
          videoElement.load();
          setIsPlaying(true);
        } catch (error) {
          console.error('Video loading failed:', error);
          setIsPlaying(false);
        }
      }
    };

    playVideo();

    // Funkcja czyszcząca - zatrzymaj wideo przed odmontowaniem
    return () => {
      mounted = false;
      if (videoRef.current) {
        // Zatrzymaj wideo przed zmianą
        videoRef.current.pause();
        // Usuń źródło wideo, aby zapobiec ładowaniu w tle
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, [url]);
  
  // Obsługa zdarzenia załadowania metadanych
  const handleMetadataLoaded = () => {
    setIsLoading(false);
    // Sprawdź, czy element wciąż istnieje w DOM
    if (videoRef.current && document.contains(videoRef.current) && isPlaying) {
      // Opóźnij odtwarzanie o krótki moment, aby mieć pewność, że element jest gotowy
      setTimeout(() => {
        if (videoRef.current && document.contains(videoRef.current)) {
          videoRef.current.play().catch(error => {
            console.error('Auto-play failed after metadata loaded:', error);
            setIsPlaying(false);
          });
        }
      }, 100);
    }
  };

  // Obsługa błędu wideo
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    // Wyodrębnij tylko użyteczne informacje z obiektu błędu
    const videoElement = e.target as HTMLVideoElement;
    
    // Zapisz informacje o błędzie bez używania console.error
    const errorCode = videoElement.error?.code || 'unknown';
    const errorMessage = videoElement.error?.message || 'Nieznany błąd';
    
    // Aktualizuj stan bez logowania do konsoli
    setIsLoading(false);
    setIsPlaying(false);
  };
  
  const togglePlayPause = () => {
    if (videoRef.current && document.contains(videoRef.current)) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('Play failed:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full h-full max-h-screen relative" onClick={togglePlayPause}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <video 
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay={false} 
        playsInline
        loop
        muted
        onLoadedMetadata={handleMetadataLoaded}
        onError={handleVideoError}
        key={`video-player-${url.split('/').pop()}`}
      >
        <source src={url} type="video/mp4" />
        Twoja przeglądarka nie obsługuje odtwarzania wideo.
      </video>
      
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
} 