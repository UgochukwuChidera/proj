
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { UploadCloud, UserCircle, Loader2, LogOutIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function ProfileClientPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUserMetadata } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // ConditionalAppShell handles redirect for unauthenticated users trying to access this page.
    // So, we only need to populate form if user is authenticated and loaded.
    if (!authLoading && isAuthenticated && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrlInput(user.avatarUrl || '');
    }
  }, [isAuthenticated, user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    let metadataAttempted = false;
    let metadataUpdated = false;

    const metadataUpdates: { name?: string; avatarUrl?: string } = {};
    if (name !== (user.name || '')) {
        metadataUpdates.name = name;
        metadataAttempted = true;
    }
    if (avatarUrlInput !== (user.avatarUrl || '')) {
        metadataUpdates.avatarUrl = avatarUrlInput;
        metadataAttempted = true;
    }
    
    if (Object.keys(metadataUpdates).length > 0) {
      const { error } = await updateUserMetadata(metadataUpdates);
      if (error) {
        toast({ title: 'Profile Update Failed', description: `Could not update profile: ${error.message}`, variant: 'destructive' });
      } else {
        metadataUpdated = true;
      }
    }
    
    if (metadataUpdated) {
      toast({ title: 'Profile Updated', description: 'Your name and/or avatar have been saved.' });
    } else if (metadataAttempted) {
      // Error already shown by updateUserMetadata toast or no actual update was needed despite form changes
    } else {
      toast({ title: 'No Changes Detected', description: 'Your profile information remains the same.', variant: 'default' });
    }
    setIsSubmitting(false);
  };
  
  const handleLogout = async () => {
    setIsLoggingOut(true); 
    await logout();
    router.push('/login'); 
    // setIsLoggingOut(false); // Component will redirect, state cleanup not critical here
  };

  // If auth is loading, ConditionalAppShell will show a global loader.
  // If not authenticated after loading, ConditionalAppShell will redirect.
  // So, this component should only render its content when authenticated.
  // The checks below are fallbacks or for scenarios where this page might be rendered outside ConditionalAppShell.
  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }
  
  if (!isAuthenticated && !authLoading) {
     // This state should be handled by ConditionalAppShell redirecting to /login
     return (
        <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Redirecting to login...</p>
        </div>
      );
  }

  if (!user) { // Should not happen if isAuthenticated is true, but as a safeguard
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p>User data not available. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UserCircle className="mr-2 h-7 w-7" /> User Profile
          </CardTitle>
          <CardDescription>Manage your account details and profile picture. {user.isAdmin && <span className="font-semibold text-accent">(Administrator)</span>}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Image
                src={avatarUrlInput || `https://placehold.co/128x128.png?text=${(user.name || user.email || 'U').charAt(0).toUpperCase()}`}
                alt="User Avatar"
                width={128}
                height={128}
                className="object-cover bg-muted"
                data-ai-hint="user avatar"
              />
              <div className="w-full max-w-xs">
                <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                <Input 
                  id="avatarUrl" 
                  type="url" 
                  value={avatarUrlInput} 
                  onChange={(e) => setAvatarUrlInput(e.target.value)} 
                  placeholder="https://example.com/avatar.png"
                  disabled={isSubmitting || isLoggingOut}
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">Enter a publicly accessible image URL.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Full Name" disabled={isSubmitting || isLoggingOut} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled placeholder="your.email@landmark.edu" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
             <Button variant="outline" type="button" onClick={handleLogout} disabled={isSubmitting || isLoggingOut}>
              {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOutIcon className="mr-2 h-4 w-4" />} Logout
            </Button>
            <Button type="submit" className="font-body" disabled={isSubmitting || isLoggingOut}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />} 
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
