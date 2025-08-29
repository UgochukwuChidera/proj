
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound } from 'lucide-react';

export function UpdatePasswordClientPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hasValidSession, setHasValidSession] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs when the component mounts.
    // It checks for a 'SIGNED_IN' event which occurs when a user follows a magic link or password reset link.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // If the user signed in via a reset link, they have a valid session to update their password.
        setHasValidSession(true);
        setMessage('You have a valid session. Please enter your new password.');
      }
    });

    // Also check if there's already a session on mount (e.g., if the page is refreshed after clicking the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            setHasValidSession(true);
            setMessage('You have a valid session. Please enter your new password.');
        } else {
             setMessage('Waiting for a valid password reset session...');
        }
    })

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    // As per your request, we will not wait for feedback to avoid a stuck loading state.
    // We will optimistically show a success message and force a redirect.
    if (updateError) {
      // We'll still log the error and show it, but the redirect will happen anyway if we proceed.
      // For a better UX, we'll stop the redirect on a clear failure.
       setError(`Failed to update password: ${updateError.message}`);
      toast({
        title: 'Update Failed',
        description: `Error: ${updateError.message}`,
        variant: 'destructive',
      });
       setIsSubmitting(false); // Only stop on error.
       return;
    } 

    toast({
      title: 'Password Updated Successfully!',
      description: 'You will be redirected to the login page shortly.',
    });
    
    await supabase.auth.signOut();
    
    setTimeout(() => {
        router.push('/login');
        // We don't need to set isSubmitting to false, as the page will navigate away.
    }, 2000); // 2-second delay to allow toast to be read.
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <KeyRound className="mr-2" /> Set New Password
          </CardTitle>
          <CardDescription>
            Enter and confirm your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasValidSession ? (
            <div className="flex items-center justify-center p-6 text-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                <p>{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full font-body" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
