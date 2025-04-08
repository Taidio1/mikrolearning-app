'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaVideo, FaBook, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut, isLoading } = useAuth();
  
  // Jeśli nie pokazuj nawigacji na stronach logowania/rejestracji
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }
  
  // Jeśli trwa ładowanie, pokaż pusty element
  if (isLoading) {
    return (
      <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-gray-800 pb-safe">
        <div className="h-16"></div>
      </nav>
    );
  }
  
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-gray-800 pb-safe">
      <div className="flex justify-around py-3 px-2 max-w-md mx-auto">
        <Link href={user ? "/video" : "/login"} className={`flex flex-col items-center ${pathname === '/video' ? 'text-white' : 'text-gray-500'}`}>
          <div className={`p-1 rounded-full ${pathname === '/video' ? 'bg-blue-600' : ''}`}>
            <FaVideo className="text-xl mb-1" />
          </div>
          <span className="text-xs">Video</span>
        </Link>
        
        <Link href={user ? "/flashcards" : "/login"} className={`flex flex-col items-center ${pathname === '/flashcards' ? 'text-white' : 'text-gray-500'}`}>
          <div className={`p-1 rounded-full ${pathname === '/flashcards' ? 'bg-purple-600' : ''}`}>
            <FaBook className="text-xl mb-1" />
          </div>
          <span className="text-xs">Fiszki</span>
        </Link>
        
        <Link href={user ? "/profile" : "/login"} className={`flex flex-col items-center ${pathname === '/profile' ? 'text-white' : 'text-gray-500'}`}>
          <div className={`p-1 rounded-full ${pathname === '/profile' ? 'bg-gray-600' : ''}`}>
            <FaUser className="text-xl mb-1" />
          </div>
          <span className="text-xs">Konto</span>
        </Link>
        
        {user ? (
          <button 
            onClick={() => signOut()}
            className="flex flex-col items-center text-gray-500"
          >
            <div className="p-1 rounded-full">
              <FaSignOutAlt className="text-xl mb-1" />
            </div>
            <span className="text-xs">Wyloguj</span>
          </button>
        ) : (
          <Link href="/login" className="flex flex-col items-center text-gray-500">
            <div className="p-1 rounded-full">
              <FaUser className="text-xl mb-1" />
            </div>
            <span className="text-xs">Zaloguj</span>
          </Link>
        )}
      </div>
    </nav>
  );
} 