'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import RedirectHandler from './RedirectHandler';

// Dynamiczny import komponentów klienckich
const Navigation = dynamic(() => import('./Navigation'), { ssr: false });
const AuthDebug = dynamic(() => import('./AuthDebug'), { ssr: false });

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {process.env.NODE_ENV === 'development' && <AuthDebug />}
      <RedirectHandler />
      <main className="flex flex-col min-h-screen max-w-md mx-auto overflow-hidden">
        <div className="flex-1 pb-16 overflow-auto">
          {children}
        </div>
        <Navigation />
      </main>
    </>
  );
} 