'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signUp, isLoading } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { error, user } = await signUp(email, password, username);

      if (error) {
        throw error;
      }

      if (user) {
        router.push('/video');
      }
    } catch (error: any) {
      setError(error.message || 'Wystąpił błąd podczas rejestracji');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
      <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Zarejestruj się w MicroLearn
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister}>
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
          
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium mb-1 text-gray-300">
              Nazwa użytkownika
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              minLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Hasło musi zawierać minimum 6 znaków
            </p>
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Masz już konto?{' '}
            <Link href="/login" className="text-blue-400 hover:underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 