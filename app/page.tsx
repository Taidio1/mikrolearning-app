'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaVideo, FaBook, FaUser } from 'react-icons/fa';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // Ensure the router is ready before redirecting
      console.log("Użytkownik zalogowany na stronie głównej, przekierowuję do /video");
      
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Użyj window.location dla bezpośredniego przekierowania
          window.location.href = '/video';
        } else {
          router.push('/video');
        }
      }, 100);
    }
  }, [user, isLoading, router]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-pulse text-white text-xl">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-3 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          MicroLearn
        </h1>
        <h2 className="text-xl mb-8 text-center text-gray-300">
          Mikro-nauka w 3 zakładkach
        </h2>
        
        <div className="space-y-4 mb-10">
          <div className="block p-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                <FaVideo className="text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Video</h3>
                <p className="text-sm text-gray-300">Krótkie, edukacyjne filmy w pionowym formacie</p>
              </div>
            </div>
          </div>
          
          <div className="block p-5 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                <FaBook className="text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Fiszki</h3>
                <p className="text-sm text-gray-300">Szybka nauka przez fiszki z kategoriami tematycznymi</p>
              </div>
            </div>
          </div>
          
          <div className="block p-5 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mr-4">
                <FaUser className="text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Konto</h3>
                <p className="text-sm text-gray-300">Twoje postępy i ulubione treści</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link href="/login" className="block py-4 px-8 bg-blue-600 text-center text-white rounded-full font-semibold hover:bg-blue-700 transition-colors flex-1">
            Zaloguj się
          </Link>
          <Link href="/register" className="block py-4 px-8 bg-gray-800 text-center text-white rounded-full font-semibold hover:bg-gray-700 transition-colors flex-1">
            Zarejestruj się
          </Link>
        </div>
      </div>
    </div>
  );
} 