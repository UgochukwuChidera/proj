
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, KeyRound, UserCog, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export function UserManagementClientPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        router.push('/resources');
      }
    }
  }, [isAuthenticated, user, authLoading, router, toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.isAdmin) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return;
    }
    if (!targetUserEmail.trim() || !newPassword.trim()) {
      toast({ title: 'Missing Fields', description: 'Please enter a User Email and a new password.', variant: 'destructive' });
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetUserEmail)) {
        toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
        return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password Too Short', description: 'New password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      toast({ title: 'Authentication Error', description: 'Could not retrieve current session. Please re-login.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('passwordUpdate', {
        body: { userEmailToUpdate: targetUserEmail, newPassword: newPassword },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        }
      });

      if (functionError) {
        console.error('Edge function invocation error:', functionError);
        const errorMsg = (functionError.context?.json?.error as string) || functionError.message || 'An unexpected error occurred.';
        toast({ title: 'Password Reset Failed', description: errorMsg, variant: 'destructive' });
      } else {
        const responseData = functionResponse as { message?: string };
        toast({ title: 'Password Reset Successful', description: responseData?.message || `Password for user ${targetUserEmail} has been updated.` });
        setTargetUserEmail('');
        setNewPassword('');
      }
    } catch (e: any) {
      console.error('Catch block error calling edge function:', e);
      toast({ title: 'Password Reset Error', description: e.message || 'An unexpected client-side error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!authLoading && (!isAuthenticated || !user?.isAdmin))) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/resources">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resources
        </Link>
      </Button>
      <Card className="max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UserCog className="mr-2 h-7 w-7" /> User Management
          </CardTitle>
          <CardDescription>Administratively set a user's password using their email address.</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordReset}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetUserEmail">Target User Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="targetUserEmail"
                  type="email"
                  value={targetUserEmail}
                  onChange={(e) => setTargetUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={isSubmitting}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter the email address of the account to modify.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                required
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-body" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Setting Password...' : "Set User's Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
