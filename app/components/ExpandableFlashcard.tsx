'use client';

import { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaCheckCircle } from 'react-icons/fa';

interface ExpandableFlashcardProps {
  question: string;
  answer: string;
  example: string;
  category: string;
  id: string;
  onMarkAsLearned?: (id: string) => void;
  isLearned?: boolean;
}

export default function ExpandableFlashcard({ 
  question, 
  answer, 
  example, 
  category,
  id,
  onMarkAsLearned,
  isLearned = false
}: ExpandableFlashcardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const toggleExpand = () => {
    // Nie rozwijaj jeśli trwa przeciąganie
    if (!isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  // Obsługa rozpoczęcia przeciągania
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // Pobierz pozycję X z myszy lub dotyku
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    setDragStartX(clientX);
    setIsDragging(true);
  };

  // Obsługa podczas przeciągania
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const diff = clientX - dragStartX;
    
    // Ograniczamy przesunięcie tylko w prawo
    if (diff > 0) {
      setOffset(diff);
    }
  };

  // Obsługa zakończenia przeciągania
  const handleDragEnd = () => {
    if (dragStartX === null) {
      setIsDragging(false);
      return;
    }
    
    // Jeśli przesunięto o ponad 50% szerokości karty, oznacz jako nauczone lub usuń z nauczonych
    if (cardRef.current && offset > cardRef.current.offsetWidth * 0.5) {
      if (onMarkAsLearned) {
        onMarkAsLearned(id);
      }
    }
    
    // Reset stanu
    setDragStartX(null);
    setOffset(0);
    setIsDragging(false);
  };

  return (
    <div 
      className="w-full mb-4 relative"
      ref={cardRef}
    >
      {/* Wskaźnik "już umiem" */}
      {isLearned && (
        <div 
          className="absolute right-0 top-0 m-2 z-10 text-green-500 flex items-center cursor-pointer hover:text-green-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (onMarkAsLearned) {
              onMarkAsLearned(id);
            }
          }}
        >
          <FaCheckCircle className="mr-1" />
          <span className="text-xs">Już umiem</span>
        </div>
      )}
      
      <div 
        className={`rounded-xl shadow-lg transition-all duration-300 ${
          isExpanded ? 'bg-blue-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
        } ${isLearned ? 'opacity-50' : 'opacity-100'}`}
        style={{ 
          transform: `translateX(${offset}px)`,
          opacity: isLearned 
            ? Math.max(0.6 - (offset / (cardRef.current?.offsetWidth || 500) * 0.6), 0.1) // Efekt usuwania
            : 1 - (offset / (cardRef.current?.offsetWidth || 500)), // Efekt dodawania
        }}
        onMouseDown={handleDragStart}
        onMouseMove={isDragging ? handleDragMove : undefined}
        onMouseUp={handleDragEnd}
        onMouseLeave={isDragging ? handleDragEnd : undefined}
        onTouchStart={handleDragStart}
        onTouchMove={isDragging ? handleDragMove : undefined}
        onTouchEnd={handleDragEnd}
      >
        {/* Question header (always visible) */}
        <div 
          className={`p-5 flex justify-between items-center ${isDragging ? '' : 'cursor-pointer'}`}
          onClick={toggleExpand}
        >
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {category}
              </span>
              {isExpanded ? 
                <FaChevronUp className="text-gray-500" /> : 
                <FaChevronDown className="text-gray-500" />
              }
            </div>
            <h3 className="text-xl md:text-2xl font-semibold">{question}</h3>
          </div>
        </div>
        
        {/* Expandable content */}
        <div 
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-5 pt-0 border-t border-gray-200 dark:border-gray-600">
            <div className="mb-4">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-1">Definicja:</h4>
              <p className="text-gray-800 dark:text-gray-200">{answer}</p>
            </div>
            
            {example && (
              <div className="mt-4">
                <h4 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-1">Przykład:</h4>
                <p className="text-gray-700 dark:text-gray-300">{example}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Wskazówka przeciągania (dostosowana do stanu nauczenia) */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 opacity-30 pointer-events-none">
          <div className="flex flex-col items-center">
            <span className="text-xs">Przesuń w prawo</span>
            <span className="text-xs">
              {isLearned ? 'aby usunąć z nauczonych' : 'jeśli już umiesz'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 