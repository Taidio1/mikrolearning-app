'use client';

import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function AuthDebug() {
  const { user, isLoading, refreshSession } = useAuth();
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className="fixed top-2 right-2 z-50 bg-black bg-opacity-70 p-2 rounded text-xs"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="cursor-pointer">
        Status: {isLoading ? '⏳ Ładowanie...' : user ? '✅ Aktywny' : '❌ Niezalogowany'}
      </div>
      
      {expanded && (
        <div className="mt-2 space-y-2">
          {user && (
            <div className="text-green-400">
              Email: {user.email} <br />
              ID: {user.id.substring(0, 8)}...
            </div>
          )}
          
          <button 
            className="bg-blue-600 text-white px-2 py-1 rounded text-xs w-full"
            onClick={(e) => {
              e.stopPropagation();
              refreshSession();
            }}
          >
            Odśwież sesję
          </button>
          
          <div className="text-gray-400 text-xs">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
} 