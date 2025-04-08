'use client';

import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import VideoControls from './VideoControls';
import { FaLock } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  likes: number;
  userLiked?: boolean;
}

interface VideoListProps {
  videos: Video[];
}

const VideoList: React.FC<VideoListProps> = ({ videos }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle case when no videos are available
  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h2 className="text-xl font-semibold mb-4">No videos available</h2>
        <p>Check back later for new content</p>
      </div>
    );
  }

  // Set up refs array for each video
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, videos.length);
  }, [videos]);

  // Handle scrolling to implement snap functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const height = container.clientHeight;
      const newIndex = Math.round(scrollPosition / height);
      
      if (newIndex !== currentVideoIndex) {
        setCurrentVideoIndex(newIndex);
      }
    };

    // Add scroll event listener
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentVideoIndex]);

  // This handles snapping to the current video
  useEffect(() => {
    const container = containerRef.current;
    const videoElement = videoRefs.current[currentVideoIndex];
    
    if (container && videoElement) {
      container.scrollTo({
        top: videoElement.offsetTop,
        behavior: 'smooth'
      });
    }
  }, [currentVideoIndex]);

  // Handle user interaction with video player
  const handleVideoClick = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle like for a video
  const handleLike = (videoId: string) => {
    if (!isAuthenticated) return;
    
    // In a real app, you would call API to update likes
    console.log('Like video:', videoId);
    
    // You could also update local state of videos with optimistic update
    // Update would include API call to your backend
  };

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black"
    >
      {videos.map((video, index) => (
        <div 
          key={video.id}
          ref={el => videoRefs.current[index] = el}
          className="h-screen w-full snap-start relative overflow-hidden"
        >
          <VideoPlayer 
            url={video.url}
            isPlaying={isPlaying && currentVideoIndex === index}
            onClick={handleVideoClick}
          />
          
          {/* Video Info Overlay - Bottom Left */}
          <div className="absolute bottom-16 left-4 max-w-[70%] z-10">
            <h3 className="text-white text-lg font-semibold mb-2 drop-shadow-md">
              {video.title}
            </h3>
            <p className="text-white text-sm drop-shadow-md">
              {video.description}
            </p>
          </div>
          
          {/* Video Controls - Right Side */}
          <VideoControls 
            videoId={video.id}
            likes={video.likes}
            userLiked={video.userLiked}
            isAuthenticated={isAuthenticated}
            onLike={() => handleLike(video.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoList; 