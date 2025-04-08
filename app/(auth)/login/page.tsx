'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, isLoading, user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log("Użytkownik już zalogowany, przekierowuję z /login do /video");
      
      window.location.href = '/video';
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      localStorage.setItem('lastEmail', email);
      
      console.log(`Próba logowania: ${email}`);
      const { error } = await signIn(email, password);

      if (error) {
        console.error('Błąd logowania:', error);
        throw error;
      }

      console.log("Logowanie udane, przekierowuję do /video");
      
      setTimeout(() => {
        window.location.href = '/video';
      }, 300);
    } catch (error: any) {
      console.error('Błąd podczas logowania:', error);
      setError(error.message || 'Wystąpił błąd podczas logowania');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
      <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Zaloguj się do MicroLearn
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-300">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Nie masz jeszcze konta?{' '}
            <Link href="/register" className="text-blue-400 hover:underline">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 