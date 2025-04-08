'use client';

import { useState } from 'react';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

interface VideoControlsProps {
  videoId: string;
  isAuthenticated: boolean;
  initialLikes: number;
  initialLiked: boolean;
  onLike: (videoId: string, liked: boolean) => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  videoId,
  isAuthenticated,
  initialLikes,
  initialLiked,
  onLike,
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      // If not authenticated, don't change state or call onLike
      return;
    }

    const newLikedState = !liked;
    setLiked(newLikedState);
    // Update like count: +1 if now liked, -1 if unliked
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    // Callback to parent component
    onLike(videoId, newLikedState);
  };

  return (
    <div className="absolute right-3 bottom-24 flex flex-col items-center z-10">
      <button
        onClick={handleLikeClick}
        className={`flex flex-col items-center mb-4 rounded-full p-2 ${
          isAuthenticated ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
        }`}
        disabled={!isAuthenticated}
        aria-label={liked ? "Unlike video" : "Like video"}
      >
        <div className="text-white text-3xl mb-1">
          {liked ? (
            <AiFillHeart className="text-red-500" />
          ) : (
            <AiOutlineHeart />
          )}
        </div>
        <span className="text-white text-xs">
          {likeCount > 0 ? likeCount : ''}
        </span>
      </button>
    </div>
  );
};

export default VideoControls; 