
"use client";
import type React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarNavItems } from '@/components/layout/sidebar-nav-items';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { LogOut, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 
import { supabase } from '@/lib/supabaseClient';

const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter(); 

  const handleLogout = async () => {
    // Calling signOut directly from the supabase client
    // to avoid issues with potentially stale context functions.
    await supabase.auth.signOut();
    router.push('/login'); 
  };

  const avatarSrc = user?.avatarUrl && !user.avatarUrl.includes('placehold.co')
    ? user.avatarUrl
    : `https://placehold.co/128x128.png?text=${getInitials(user?.name || user?.email || "U")}`;


  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
        <SidebarHeader className="p-4">
          {isLoading && !user && !isAuthenticated ? ( 
            <div className="flex items-center justify-center group-data-[collapsible=icon]:hidden">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isAuthenticated && user ? ( 
             <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                <div className="relative w-10 h-10 shrink-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
                  <Image 
                    src={avatarSrc} 
                    alt={user.name || 'User Avatar'}
                    fill
                    className="object-cover bg-muted rounded-full"
                    data-ai-hint="user avatar" 
                  />
                </div>
               <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                 <span className="font-semibold text-sm truncate max-w-[120px]">{user.name || user.email?.split('@')[0]}</span>
                 <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
               </div>
             </div>
           ) : null}
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNavItems />
        </SidebarContent>
        <SidebarFooter className="p-2">
          {isAuthenticated && (
            <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
