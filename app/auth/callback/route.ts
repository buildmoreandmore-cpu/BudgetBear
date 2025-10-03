import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent(error_description || error)}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Exchange code error:', exchangeError);
        return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent(exchangeError.message)}`);
      }
    } catch (err) {
      console.error('Callback error:', err);
      return NextResponse.redirect(`${requestUrl.origin}/?error=authentication_failed`);
    }
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
