'use client';

import { useState, useRef, useEffect } from 'react';
import { AiOutlinePlayCircle, AiOutlineReload } from 'react-icons/ai';
import { BsVolumeMute, BsVolumeUp } from 'react-icons/bs';
import VideoControls from './VideoControls';
import { formatStorageUrl } from '../../lib/formatStorageUrl';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  videoUrl: string;
  isAuthenticated: boolean;
  likes?: number;
  userLiked?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onLike: (videoId: string, liked: boolean) => void;
  onVideoEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  videoUrl,
  isAuthenticated,
  likes = 0,
  userLiked = false,
  autoPlay = true,
  loop = false,
  muted = true,
  onLike,
  onVideoEnded,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(muted);
  const [userInteracted, setUserInteracted] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxRetries = 3;

  // Funkcja określająca typ MIME na podstawie rozszerzenia pliku
  const getMimeType = (url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
        return 'video/ogg';
      case 'mov':
        return 'video/quicktime';
      default:
        return 'video/mp4'; // Domyślnie
    }
  };

  // Ustaw URL wideo przy pierwszym renderowaniu i gdy zmienia się videoUrl
  useEffect(() => {
    try {
      // Sprawdź czy URL wideo jest dostępny
      if (!videoUrl || videoUrl === 'Download') {
        setError(`Nieprawidłowy URL wideo: "${videoUrl}". Sprawdź dane w bazie.`);
        setIsLoading(false);
        return;
      }

      // Resetujemy licznik ponownych prób przy zmianie URL
      setRetryCount(0);
      
      const formattedUrl = formatStorageUrl(videoUrl);
      
      // Jeśli formatStorageUrl zwróciło pusty string, znaczy że URL jest nieprawidłowy
      if (!formattedUrl) {
        setError(`Nie można sformatować URL wideo: "${videoUrl}". Sprawdź dane w bazie.`);
        setIsLoading(false);
        return;
      }
      
      console.log('VideoPlayer: Formatted URL:', { original: videoUrl, formatted: formattedUrl });
      setVideoSrc(formattedUrl);
      setError(null);
    } catch (err: any) {
      console.error('Error setting video URL:', err);
      setError(`Błąd podczas przetwarzania URL wideo: ${err.message || 'Nieznany błąd'}`);
      setIsLoading(false);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (!videoSrc) return;
    
    if (videoRef.current) {
      if (isPlaying) {
        // Zawsze odtwarzamy z wyciszonym dźwiękiem przy pierwszym odtworzeniu
        if (!userInteracted) {
          videoRef.current.muted = true;
          setIsMuted(true);
        }
        
        // Sprawdź, czy strona jest aktywna przed odtwarzaniem
        const isDocumentVisible = !document.hidden;
        
        if (isDocumentVisible) {
          videoRef.current.play().catch(err => {
            console.error('Video playback error:', err);
            
            // Obsługa błędu związanego z oszczędzaniem energii
            if (err.message && err.message.includes('play() request was interrupted')) {
              console.log('Power saving error detected, will retry when page is visible');
              
              // Nie zmieniamy stanu isPlaying, aby automatycznie ponowić próbę
              // gdy strona ponownie stanie się aktywna
            } else {
              setIsPlaying(false);
              setError(`Błąd odtwarzania: ${err.message}`);
            }
          });
        } else {
          console.log('Document not visible, delaying playback');
          // Nie próbuj odtwarzać gdy strona jest nieaktywna
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, userInteracted, videoSrc]);

  // Dodajemy nasłuchiwacz na widoczność strony
  useEffect(() => {
    // Funkcja obsługująca zmiany widoczności dokumentu
    const handleVisibilityChange = () => {
      if (!document.hidden && isPlaying && videoRef.current) {
        console.log('Document became visible, attempting to play video');
        videoRef.current.play().catch(err => {
          console.error('Error when resuming playback:', err);
        });
      }
    };
    
    // Dodajemy nasłuchiwacz
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Sprzątanie
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Efekt do obsługi zmian wyciszenia
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    setUserInteracted(true);
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Uniemożliwia wywołanie togglePlay przy kliknięciu przycisku wyciszenia
    setUserInteracted(true);
    setIsMuted(!isMuted);
  };

  const handleVideoLoaded = () => {
    console.log('VideoPlayer: Video loaded successfully');
    setIsLoading(false);
    setError(null);
    // Reset retry count on successful load
    setRetryCount(0);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e.currentTarget;
    
    // Bezpieczne logowanie błędu - zabezpieczenie przed pustym obiektem
    try {
      console.error('VideoPlayer: Video error:', videoElement.error || 'Empty error object');
    } catch (err) {
      console.error('VideoPlayer: Error while logging video error');
    }
    
    let errorMessage = 'Błąd podczas ładowania wideo.';
    
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Odtwarzanie przerwane przez użytkownika.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Błąd sieci podczas pobierania wideo.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Format wideo nie jest obsługiwany przez przeglądarkę.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Nie znaleziono obsługiwanego źródła wideo.';
          break;
        default:
          errorMessage = `Nieznany błąd (kod: ${videoElement.error.code}).`;
      }
    } else {
      // Handle case where error object is null or empty
      errorMessage = 'Nie można załadować wideo. Sprawdź czy plik istnieje i jest dostępny.';
      
      // Dodatkowa diagnoza specyficzna dla problemu z pustym obiektem błędu
      if (videoSrc.includes('supabase')) {
        // Sprawdzenie, czy URL zawiera specyficzne rozszerzenie pliku
        const hasVideoExtension = /\.(mp4|webm|mov|ogg)$/i.test(videoSrc);
        
        if (!hasVideoExtension) {
          errorMessage = 'URL wideo nie ma rozszerzenia pliku. Spróbuj dodać .mp4 do nazwy pliku w bazie danych.';
        } else {
          errorMessage = 'Problem z dostępem do pliku. Sprawdź uprawnienia bucketa w Supabase i czy plik istnieje.';
        }
      } else if (!videoSrc) {
        errorMessage = 'Brak źródła wideo.';
      }
    }
    
    setIsLoading(false);
    setError(errorMessage);
    
    // Auto-retry loading if under max retry count
    if (retryCount < maxRetries) {
      console.log(`VideoPlayer: Auto-retrying (${retryCount + 1}/${maxRetries})...`);
      setRetryCount(prev => prev + 1);
      
      // Auto-retry with delay
      setTimeout(() => {
        handleRetry(new Event('auto-retry') as unknown as React.MouseEvent);
      }, 1000);
    }
    
    // Wyświetl dodatkowe informacje o URL w konsoli
    console.log('VideoPlayer: URL details:', {
      original: videoUrl,
      processed: videoSrc,
      supabaseURL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      retryCount,
      videoExtension: videoSrc ? videoSrc.split('.').pop() : 'none'
    });
  };
  
  // Funkcja ponownego załadowania wideo
  const handleRetry = (e: React.MouseEvent) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    setIsLoading(true);
    setError(null);
    
    // Spróbuj ponownie załadować wideo po krótkim opóźnieniu
    setTimeout(() => {
      const video = videoRef.current;
      if (video) {
        const currentSrc = video.src;
        video.src = '';
        // Trigger browser to reload the video
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.src = currentSrc;
          }
        }, 50);
      }
    }, 100);
  };

  // Obsługa zakończenia odtwarzania filmu
  const handleVideoEnded = () => {
    console.log('VideoPlayer: Video playback ended');
    if (onVideoEnded) {
      onVideoEnded(); // Wywołujemy funkcję callback przekazaną z rodzica
    } else if (loop) {
      // Jeśli loop=true i nie ma onVideoEnded, zapętlamy odtwarzanie
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(err => {
          console.error('Error restarting video:', err);
        });
      }
    }
  };

  return (
    <div className="relative w-full h-full flex justify-center items-start bg-black">
      {/* Full-screen video container */}
      <div className="relative w-full h-[90%] max-w-full overflow-hidden">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="text-white text-center p-4">
              <p className="text-lg font-semibold">Błąd</p>
              <p>{error}</p>
              {videoSrc && (
                <details className="mt-4 text-xs opacity-70">
                  <summary>Szczegóły</summary>
                  <p className="truncate">{videoSrc}</p>
                  <p>Próby: {retryCount}/{maxRetries}</p>
                </details>
              )}
              <button 
                onClick={handleRetry}
                className="mt-4 bg-primary text-white px-4 py-2 rounded-full flex items-center mx-auto"
              >
                <AiOutlineReload className="mr-2" /> Spróbuj ponownie
              </button>
            </div>
          </div>
        )}

        {/* Video element */}
        {videoSrc && (
          <video 
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            autoPlay={autoPlay}
            loop={false}
            muted={isMuted}
            crossOrigin="anonymous"
            onLoadedData={handleVideoLoaded}
            onError={handleVideoError}
            onClick={togglePlay}
            onEnded={handleVideoEnded}
          >
            {/* Wykorzystujemy source element dla lepszej kompatybilności */}
            <source src={videoSrc} type={getMimeType(videoSrc)} />
            {/* Dodatkowe źródło dla .webm jeśli URL wskazuje na mp4 */}
            {videoSrc.endsWith('.mp4') && (
              <source 
                src={videoSrc.replace('.mp4', '.webm')} 
                type="video/webm"
              />
            )}
            Twoja przeglądarka nie obsługuje odtwarzania wideo HTML5.
          </video>
        )}

        {/* Play/Pause overlay - only visible when video is paused */}
        {!isPlaying && !isLoading && !error && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
            onClick={togglePlay}
          >
            <AiOutlinePlayCircle className="text-white text-6xl opacity-80" />
          </div>
        )}

        {/* Volume control */}
        {!error && (
          <button 
            onClick={toggleMute}
            className="absolute bottom-24 right-4 z-20 bg-black/30 rounded-full p-2 text-white"
            aria-label={isMuted ? "Włącz dźwięk" : "Wycisz"}
          >
            {isMuted ? <BsVolumeMute size={20} /> : <BsVolumeUp size={20} />}
          </button>
        )}

        {/* Title overlay */}
        {!error && (
          <div className="absolute bottom-12 left-0 right-0 px-4 z-10">
            <h2 className="text-white text-lg font-bold truncate shadow-text">
              {title}
            </h2>
          </div>
        )}

        {/* Video controls */}
        {!error && (
          <VideoControls
            videoId={videoId}
            isAuthenticated={isAuthenticated}
            initialLikes={likes}
            initialLiked={userLiked}
            onLike={onLike}
          />
        )}
      </div>
    </div>
  );
};

export default VideoPlayer; 