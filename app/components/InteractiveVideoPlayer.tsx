'use client';

import { useState, useRef, useEffect } from 'react';
import { AiOutlinePlayCircle } from 'react-icons/ai';
import VideoPlayer from './VideoPlayer';
import supabase from '../../lib/supabase';

interface Checkpoint {
  id: string;
  videoId: string;
  timeInSeconds: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface InteractiveVideoPlayerProps {
  videoId: string;
  title: string;
  videoUrl: string;
  isAuthenticated: boolean;
  likes?: number;
  userLiked?: boolean;
  onLike: (videoId: string, liked: boolean) => void;
  onVideoEnded?: () => void;
}

const InteractiveVideoPlayer: React.FC<InteractiveVideoPlayerProps> = ({
  videoId,
  title,
  videoUrl,
  isAuthenticated,
  likes = 0,
  userLiked = false,
  onLike,
  onVideoEnded
}) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<Checkpoint | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Create automatic checkpoints every 15 minutes
  const CHECKPOINT_INTERVAL = 15 * 60; // 15 minutes in seconds
  
  // Mock questions for testing - in production these would come from the database
  const mockQuestions = [
    "Jakie jest główne zagadnienie omawiane w tym segmencie?",
    "Który z przedstawionych przykładów najlepiej ilustruje omawianą koncepcję?",
    "Co jest następnym krokiem w procesie opisanym w filmie?",
    "Które z poniższych twierdzeń jest prawdziwe na podstawie obejrzanego materiału?"
  ];
  
  // Generate sample options for questions
  const generateOptions = (questionIndex: number) => {
    const baseOptions = [
      ["Architektura mikroserwisów", "Programowanie obiektowe", "Systemy rozproszone", "Integracja ciągła"],
      ["Przykład A z kodem", "Przykład B z diagramem", "Przykład C z procesem", "Przykład D z algorytmem"],
      ["Testowanie jednostkowe", "Wdrożenie rozwiązania", "Analiza wymagań", "Projektowanie interfejsu"],
      ["Twierdzenie A", "Twierdzenie B", "Twierdzenie C", "Twierdzenie D"]
    ];
    
    return baseOptions[questionIndex % baseOptions.length];
  };
  
  // Generate automatic checkpoints
  useEffect(() => {
    // Fetch checkpoints from the database
    const fetchCheckpoints = async () => {
      try {
        const { data, error } = await supabase
          .from('video_checkpoints')
          .select('*')
          .eq('video_id', videoId)
          .order('time_in_seconds', { ascending: true });
        
        if (error) {
          console.error('Error fetching checkpoints:', error);
          // Check if the error is due to a missing table
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.info('The video_checkpoints table does not exist yet. Using auto-generated checkpoints.');
          } else {
            console.warn('Could not fetch checkpoints from database. Using auto-generated checkpoints instead.');
          }
          // Fall back to auto-generated checkpoints
          generateAutoCheckpoints();
        } else if (data && data.length > 0) {
          // Map database checkpoints to our format
          const mappedCheckpoints = data.map(checkpoint => ({
            id: checkpoint.id,
            videoId: checkpoint.video_id,
            timeInSeconds: checkpoint.time_in_seconds,
            question: checkpoint.question,
            options: checkpoint.options, // This is already in the right format as JSONB
            correctAnswer: checkpoint.correct_answer
          }));
          setCheckpoints(mappedCheckpoints);
        } else {
          // No checkpoints found, generate automatic ones
          generateAutoCheckpoints();
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch checkpoints:', err);
        // Provide more user-friendly error message
        if (err instanceof Error) {
          console.info(`Error details: ${err.message}`);
        }
        console.info('Falling back to auto-generated checkpoints');
        // Fall back to auto-generated checkpoints
        generateAutoCheckpoints();
      }
    };
    
    // Function to generate automatic checkpoints
    const generateAutoCheckpoints = () => {
      if (!videoRef.current) return;
      
      const duration = videoRef.current.duration;
      if (!duration || isNaN(duration)) return;
      
      const autoCheckpoints: Checkpoint[] = [];
      let checkpointTime = CHECKPOINT_INTERVAL;
      let checkpointId = 1;
      
      // Create checkpoints every 15 minutes until the end of the video
      while (checkpointTime < duration) {
        const questionIndex = (checkpointId - 1) % mockQuestions.length;
        autoCheckpoints.push({
          id: `checkpoint-${videoId}-${checkpointId}`,
          videoId: videoId,
          timeInSeconds: checkpointTime,
          question: mockQuestions[questionIndex],
          options: generateOptions(questionIndex),
          correctAnswer: Math.floor(Math.random() * 4) // Random correct answer for demo
        });
        
        checkpointTime += CHECKPOINT_INTERVAL;
        checkpointId++;
      }
      
      setCheckpoints(autoCheckpoints);
      setLoading(false);
    };
    
    // Start by trying to fetch checkpoints from db
    fetchCheckpoints();
    
  }, [videoId, videoRef.current?.duration]);
  
  // Time update handler
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const currentVideoTime = videoRef.current.currentTime;
    setCurrentTime(currentVideoTime);
    
    // Check if we've reached a checkpoint
    for (const checkpoint of checkpoints) {
      // If we're within 1 second of the checkpoint and video is playing
      if (Math.abs(currentVideoTime - checkpoint.timeInSeconds) < 1 && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setCurrentCheckpoint(checkpoint);
        setShowQuestion(true);
        setSelectedOption(null);
        setIsCorrect(null);
        break;
      }
    }
  };
  
  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (currentCheckpoint === null || selectedOption === null) return;
    
    const correct = selectedOption === currentCheckpoint.correctAnswer;
    setIsCorrect(correct);
    
    // If answer is correct, resume video after a short delay
    if (correct) {
      setTimeout(() => {
        setShowQuestion(false);
        setCurrentCheckpoint(null);
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.error("Error playing video:", err));
        }
      }, 2000);
    }
  };
  
  // Continue anyway if answer is wrong
  const handleContinueAnyway = () => {
    setShowQuestion(false);
    setCurrentCheckpoint(null);
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Error playing video:", err));
    }
  };
  
  // Custom video control handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Error playing video:", err));
    }
  };
  
  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  // Handle video like
  const handleLike = (videoId: string, liked: boolean) => {
    onLike(videoId, liked);
  };

  return (
    <div className="relative w-full h-full">
      {/* Main Video Player */}
      <VideoPlayer
        videoId={videoId}
        title={title}
        videoUrl={videoUrl}
        isAuthenticated={isAuthenticated}
        likes={likes}
        userLiked={userLiked}
        autoPlay={false} // We want to control playback ourselves
        muted={false}
        onLike={handleLike}
        onVideoEnded={onVideoEnded}
      />
      
      {/* Video event handlers */}
      <video 
        ref={videoRef}
        className="hidden" // Hidden video element just for tracking time
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      
      {/* Checkpoint Question Overlay */}
      {showQuestion && currentCheckpoint && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-blue-800">Sprawdźmy twoją wiedzę</h3>
            <p className="mb-4 text-gray-800">{currentCheckpoint.question}</p>
            
            <div className="space-y-3 mb-6">
              {currentCheckpoint.options.map((option, index) => (
                <button 
                  key={index} 
                  className={`w-full text-left p-3 border rounded-md ${
                    selectedOption === index 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'bg-gray-50 border-gray-300'
                  }`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {isCorrect === null ? (
              <button 
                onClick={handleAnswerSubmit}
                disabled={selectedOption === null}
                className={`w-full py-2 rounded-md ${
                  selectedOption === null 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Sprawdź odpowiedź
              </button>
            ) : isCorrect ? (
              <div className="text-green-600 font-bold text-center py-2">
                Poprawna odpowiedź! Kontynuowanie za moment...
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-red-600 font-bold text-center py-2">
                  Niestety, to nieprawidłowa odpowiedź.
                </div>
                <button 
                  onClick={handleContinueAnyway}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Kontynuuj mimo to
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Ładowanie interaktywnego wideo...</div>
        </div>
      )}
    </div>
  );
};

export default InteractiveVideoPlayer; 