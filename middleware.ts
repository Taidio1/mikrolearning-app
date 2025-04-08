import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Tworzymy i przypisujemy odpowiedź
  const res = NextResponse.next();
  
  // UWAGA: Middleware tymczasowo wyłączone, przekierowania obsługiwane przez RedirectHandler
  return res;
  
  // Inicjalizujemy klienta Supabase dla middleware
  /* 
  const supabase = createMiddlewareClient({ req, res });
  
  try {
    // Pobieramy sesję
    const { data: { session } } = await supabase.auth.getSession();
    
    // Ścieżki dostępne dla niezalogowanych użytkowników
    const publicPaths = ['/login', '/register'];
    
    // Aktualna ścieżka
    const path = req.nextUrl.pathname;

    // Logowanie dla debugowania
    console.log(`Middleware: Sprawdzanie ścieżki ${path}, status sesji: ${session ? 'zalogowany' : 'niezalogowany'}`);
    
    // Jeśli użytkownik nie jest zalogowany i próbuje uzyskać dostęp do chronionej ścieżki
    if (!session && !publicPaths.includes(path) && path !== '/') {
      console.log('Middleware: Przekierowanie niezalogowanego użytkownika do /login');
      const redirectUrl = new URL('/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Jeśli użytkownik jest zalogowany i próbuje uzyskać dostęp do strony logowania/rejestracji
    if (session && publicPaths.includes(path)) {
      console.log('Middleware: Przekierowanie zalogowanego użytkownika do /video');
      const redirectUrl = new URL('/video', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Jeśli użytkownik jest zalogowany i jest na stronie głównej, przekieruj do sekcji wideo
    if (session && path === '/') {
      console.log('Middleware: Przekierowanie zalogowanego użytkownika ze strony głównej do /video');
      const redirectUrl = new URL('/video', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Dodajemy sesję do headerów dla debugu
    if (session) {
      res.headers.set('x-user-email', session.user.email || 'unknown');
    }
    
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
  */
}

// Zobacz: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 