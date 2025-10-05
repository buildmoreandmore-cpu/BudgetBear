'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, UserPlus, Share2, AlertCircle } from 'lucide-react';

interface InvitationData {
  id: string;
  inviterName: string;
  inviterEmail: string;
  type: 'partner' | 'budget' | 'both';
  message?: string;
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndFetchInvitation = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch invitation details
      try {
        const response = await fetch(`/api/invitations?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid invitation link');
          setLoading(false);
          return;
        }

        setInvitation(data.invitation);
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchInvitation();
  }, [token]);

  const handleSignUp = async () => {
    // Store token in localStorage to use after signup
    localStorage.setItem('pending_invitation', token);
    router.push('/login');
  };

  const handleAccept = async () => {
    if (!user) {
      handleSignUp();
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation');
        setAccepting(false);
        return;
      }

      // Success! Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading invitation...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInvitationType = () => {
    switch (invitation.type) {
      case 'partner':
        return {
          icon: <UserPlus className="h-6 w-6" />,
          title: 'Accountability Partner Invitation',
          description: 'Join as an accountability partner to help each other reach financial goals',
        };
      case 'budget':
        return {
          icon: <Share2 className="h-6 w-6" />,
          title: 'Shared Budget Invitation',
          description: 'Get access to a shared family budget',
        };
      case 'both':
        return {
          icon: <CheckCircle2 className="h-6 w-6" />,
          title: 'Partner & Budget Invitation',
          description: 'Become an accountability partner and access a shared budget',
        };
    }
  };

  const inviteType = getInvitationType();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              {inviteType.icon}
            </div>
            <div className="flex-1">
              <CardTitle>{inviteType.title}</CardTitle>
            </div>
          </div>
          <CardDescription>{inviteType.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-muted-foreground mb-1">You've been invited by</p>
            <p className="font-semibold text-lg">{invitation.inviterName}</p>
            <p className="text-sm text-muted-foreground">{invitation.inviterEmail}</p>
          </div>

          {invitation.message && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium mb-1">Personal Message:</p>
              <p className="text-sm text-gray-700">{invitation.message}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
          </div>

          {user ? (
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Sign up or log in to accept this invitation
              </p>
              <Button
                onClick={handleSignUp}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Sign Up / Log In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
