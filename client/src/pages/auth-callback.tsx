import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

async function fetchUserRole(userId: string): Promise<'user' | 'agent' | 'admin'> {
  if (!supabase) return 'user';
  try {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    return (data?.role as 'user' | 'agent' | 'admin') || 'user';
  } catch {
    return 'user';
  }
}

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          setError('Authentication service unavailable');
          setProcessing(false);
          return;
        }

        // Get session from URL hash (Supabase OAuth redirect includes tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorDescription = hashParams.get('error_description');

        if (errorDescription) {
          setError(decodeURIComponent(errorDescription));
          setProcessing(false);
          return;
        }

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(sessionError.message);
            setProcessing(false);
            return;
          }

          if (data.user) {
            // Ensure user exists in our users table
            const { error: upsertError } = await supabase
              .from('users')
              .upsert({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
                profile_image: data.user.user_metadata?.avatar_url || null,
                role: 'user'
              }, { onConflict: 'id', ignoreDuplicates: true });

            if (upsertError) {
              console.error('Failed to create user profile:', upsertError);
            }

            // Fetch user role and redirect
            const role = await fetchUserRole(data.user.id);
            
            if (role === 'agent') {
              setLocation('/agent-dashboard');
            } else if (role === 'admin') {
              setLocation('/admin');
            } else {
              setLocation('/');
            }
            return;
          }
        }

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          if (role === 'agent') {
            setLocation('/agent-dashboard');
          } else if (role === 'admin') {
            setLocation('/admin');
          } else {
            setLocation('/');
          }
          return;
        }

        // No session found
        setError('Authentication failed. Please try again.');
        setProcessing(false);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [setLocation]);

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <Card className="max-w-md w-full p-8 shadow-xl text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Completing Sign In...</h2>
            <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-t-red-500 text-center">
            <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/login">
              <Button className="w-full" data-testid="button-try-again">
                Try Again
              </Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return null;
}
