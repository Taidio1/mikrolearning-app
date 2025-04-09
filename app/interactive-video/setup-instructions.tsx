'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaDatabase, FaCode, FaLightbulb, FaTimesCircle } from 'react-icons/fa';

export default function SetupInstructions() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 max-w-sm bg-blue-900 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold flex items-center">
          <FaDatabase className="mr-2" /> 
          Konfiguracja Checkpointów
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-300"
        >
          <FaTimesCircle />
        </button>
      </div>
      
      <div className="mb-4">
        <p className="mb-2">
          Wygląda na to, że tabela <code className="bg-blue-800 px-1 rounded">video_checkpoints</code> nie 
          została jeszcze skonfigurowana w bazie danych Supabase.
        </p>
        <p className="mb-2">
          Na razie używane są automatycznie generowane pytania co 15 minut, ale możesz skonfigurować 
          własne pytania wykonując poniższe kroki:
        </p>
      </div>
      
      <div className="space-y-3 mb-3">
        <div className="flex">
          <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
            1
          </div>
          <p>Zaloguj się do panelu Supabase i przejdź do zakładki SQL</p>
        </div>
        
        <div className="flex">
          <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
            2
          </div>
          <p>Utwórz nowe zapytanie i wklej poniższy skrypt SQL:</p>
        </div>
        
        <div className="bg-blue-800 p-3 rounded overflow-auto text-xs">
          <pre>
{`CREATE TABLE IF NOT EXISTS video_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  time_in_seconds FLOAT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT positive_time CHECK (time_in_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS video_checkpoints_video_id_idx 
ON video_checkpoints(video_id);`}
          </pre>
        </div>
        
        <div className="flex">
          <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
            3
          </div>
          <p>Uruchom zapytanie i odśwież stronę</p>
        </div>
      </div>
      
      <div className="flex items-center text-blue-300 mt-3">
        <FaLightbulb className="mr-2" />
        <p className="text-sm">
          Możesz także dodać przykładowe checkpointy dla wybranego filmu. 
          <Link href="/docs/interactive-videos" className="underline ml-1">
            Zobacz dokumentację
          </Link>
        </p>
      </div>
    </div>
  );
} 