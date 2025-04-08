'use client';

import { FaHeart, FaComment, FaChevronUp, FaChevronDown, FaShare } from 'react-icons/fa';

interface VideoControlsProps {
  onLike: () => void;
  onNext: () => void;
  onPrevious: () => void;
  likes: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function VideoControls({
  onLike,
  onNext,
  onPrevious,
  likes,
  hasNext,
  hasPrevious
}: VideoControlsProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <button
        onClick={onLike}
        className="flex flex-col items-center"
      >
        <div className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center mb-1 hover:bg-opacity-70">
          <FaHeart className="text-xl text-white" />
        </div>
        <span className="text-xs text-white">{likes}</span>
      </button>
      
      <button className="flex flex-col items-center">
        <div className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center mb-1 hover:bg-opacity-70">
          <FaComment className="text-xl text-white" />
        </div>
        <span className="text-xs text-white">Komentarze</span>
      </button>
      
      <button className="flex flex-col items-center">
        <div className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center mb-1 hover:bg-opacity-70">
          <FaShare className="text-xl text-white" />
        </div>
        <span className="text-xs text-white">Udostępnij</span>
      </button>
      
      {hasPrevious && (
        <button
          onClick={onPrevious}
          className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 mt-4"
        >
          <FaChevronUp className="text-xl text-white" />
        </button>
      )}
      
      {hasNext && (
        <button
          onClick={onNext}
          className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 mt-2"
        >
          <FaChevronDown className="text-xl text-white" />
        </button>
      )}
    </div>
  );
} 