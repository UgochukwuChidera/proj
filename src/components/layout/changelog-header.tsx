
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function ChangelogHeader() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex justify-between items-center mb-10">
      <Button 
        variant="outline" 
        asChild 
        className="font-body shadow-sm hover:shadow-md transition-shadow"
      >
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Welcome Page
        </Link>
      </Button>

      {!isLoading && !isAuthenticated && (
        <div className="flex items-center gap-2">
          <Button 
            size="default" 
            asChild 
            className="font-body shadow-sm hover:shadow-md transition-shadow"
          >
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="default" 
            asChild 
            className="font-body shadow-sm hover:shadow-md transition-shadow"
          >
            <Link href="/register">
              <UserPlus className="mr-2 h-4 w-4" /> Register
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
