
"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/', '/login', '/register', '/changelog'];

// A simple full-screen loader component
const FullScreenLoader = ({ message }: { message: string }) => (
  <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
    <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
    <p className="text-lg">{message}</p>
  </div>
);

export default function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname) || PUBLIC_PATHS.some(p => p !== '/' && pathname.startsWith(p) && p.length > 1);
      if (!isPublicPath) {
        // Redirect to login if not authenticated and trying to access a protected path.
        // The actual redirect is handled here, the return below will show a message.
        router.push('/login'); 
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return <FullScreenLoader message="Verifying access, please wait..." />;
  }

  const isPublicPath = PUBLIC_PATHS.includes(pathname) || PUBLIC_PATHS.some(p => p !== '/' && pathname.startsWith(p) && p.length > 1);

  if (!isAuthenticated) {
    if (isPublicPath) {
      // Unauthenticated user on a public path (e.g., /login, /register, /landing, /changelog).
      // Render children directly without AppShell.
      return <>{children}</>;
    } else {
      // Unauthenticated user on a protected path.
      // useEffect is handling the redirect. Show a "Redirecting to login" message.
      return <FullScreenLoader message="Access Denied. Redirecting to login page..." />;
    }
  }

  // User IS authenticated from this point onwards.
  if (isPublicPath) {
    // Authenticated user on a public path (e.g., landing page '/', or /changelog).
    // Login/Register pages are also public, but an authenticated user typically wouldn't land there.
    // Render children directly WITHOUT AppShell.
    return <>{children}</>;
  } else {
    // Authenticated user on a protected path (e.g., /resources, /profile, /admin/*).
    // Render WITH AppShell.
    return <AppShell>{children}</AppShell>;
  }
}
