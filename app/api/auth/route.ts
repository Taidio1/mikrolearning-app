import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  return NextResponse.json({ 
    authenticated: !!session, 
    user: session?.user || null 
  });
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  const { action, ...data } = await request.json();
  
  if (action === 'signout') {
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
} 