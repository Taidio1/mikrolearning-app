'use client';

import { useState, useEffect } from 'react';

interface FlashcardProps {
  question: string;
  answer: string;
  example: string;
  category: string;
  isFlipped?: boolean;
  onFlip?: (flipped: boolean) => void;
}

export default function Flashcard({ 
  question, 
  answer, 
  example, 
  category, 
  isFlipped: externalIsFlipped, 
  onFlip 
}: FlashcardProps) {
  const [internalIsFlipped, setInternalIsFlipped] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isFlipped = externalIsFlipped !== undefined ? externalIsFlipped : internalIsFlipped;
  
  // Sync internal state with external state
  useEffect(() => {
    if (externalIsFlipped !== undefined) {
      setInternalIsFlipped(externalIsFlipped);
    }
  }, [externalIsFlipped]);
  
  const handleFlip = () => {
    const newFlippedState = !isFlipped;
    setInternalIsFlipped(newFlippedState);
    
    // Notify parent component if callback is provided
    if (onFlip) {
      onFlip(newFlippedState);
    }
  };

  return (
    <div className="relative w-full h-full perspective cursor-pointer" onClick={handleFlip}>
      <div 
        className="w-full h-full relative transition-transform duration-700"
        style={{ 
          transform: isFlipped ? 'rotateY(180deg)' : '', 
          transformStyle: 'preserve-3d' 
        }}
      >
        {/* Front of the card */}
        <div 
          className="w-full  absolute backface-hidden flex flex-col justify-center items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
        >
          <div className="absolute top-2 right-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {category}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-center">{question}</h3>
          <p className="text-gray-500 mt-4 text-center text-sm">Kliknij, aby zobaczyć definicję</p>
        </div>
        
        {/* Back of the card */}
        <div 
          className="w-full  absolute backface-hidden flex flex-col justify-between p-6 bg-blue-50 dark:bg-gray-700 rounded-xl shadow-lg rotate-y-180"
        >
          <div className="absolute top-2 right-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {category}
            </span>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-1">Definicja:</h4>
            <p className="text-gray-800 dark:text-gray-200">{answer}</p>
          </div>
          
          {example && (
            <div className="mt-4">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-1">Przykład:</h4>
              <p className="text-gray-700 dark:text-gray-300">{example}</p>
            </div>
          )}
          
          <p className="text-gray-500 mt-4 text-center text-sm">Kliknij, aby wrócić</p>
        </div>
      </div>
      
      <style jsx>{`
        .perspective {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
} 