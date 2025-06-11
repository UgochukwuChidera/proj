
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

// Note: `export const metadata` is not used in "use client" components.
// Title for this page will be set by RootLayout's default or template if not overridden by a parent server component.
// For the root page.tsx, the RootLayout's metadata applies. We can set a specific default in RootLayout.

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Image src="/images/logo.png" alt="Landmark University Logo" width={80} height={80} className="mb-4 animate-pulse" data-ai-hint="university logo" />
        <p className="text-lg text-foreground">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-6 text-center">
      <header className="mb-12">
        <div className="flex items-center justify-center mb-6">
          <Image src="/images/logo.png" alt="Landmark University Logo" width={100} height={100} className="drop-shadow-lg" data-ai-hint="university logo" />
        </div>
        <h1 className="font-headline text-5xl font-bold text-primary mb-3 tracking-tight">
          Landmark University Resource Hub
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
          Discover, access, and manage academic resources with ease. Your central hub for learning and research materials.
        </p>
      </header>

      <main className="space-y-8">
        <section>
          <h2 className="font-headline text-3xl font-semibold text-foreground mb-4">Get Started</h2>
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="font-body shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
                <Link href="/login">
                  <LogIn className="mr-2" /> Login
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="font-body shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
                <Link href="/register">
                  <UserPlus className="mr-2" /> Register
                </Link>
              </Button>
            </div>
          ) : (
             <Button size="lg" asChild className="font-body shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/resources">
                  Go to Resources <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
          )}
        </section>
        
        <section className="max-w-3xl mx-auto pt-8">
            <h3 className="font-headline text-2xl font-semibold text-foreground mb-3">Features</h3>
            <ul className="list-disc list-inside text-left text-foreground/70 space-y-1">
                <li>Advanced search and filtering for all university resources.</li>
                <li>Personalized user profiles and secure authentication.</li>
                <li>Access lecture notes, research papers, and more.</li>
                <li>Mobile-friendly design for access on any device.</li>
            </ul>
        </section>
      </main>

      <footer className="mt-16 text-sm text-muted-foreground">
        <Button variant="link" asChild className="p-0 h-auto text-sm font-normal text-muted-foreground hover:text-primary hover:no-underline">
          <Link href="/changelog">Changelog (v1.0.0)</Link>
        </Button>
        <span className="mx-2">|</span>
        &copy; {new Date().getFullYear()} Landmark University. All rights reserved.
      </footer>
    </div>
  );
}
// If you want a specific title for the root page like "LURH - Welcome",
// and it's a client component, this can be tricky.
// The RootLayout's `metadata.title.default` will be used.
// To make it "LURH - Welcome", RootLayout's default would need to be "Welcome",
// and template "%s | LURH" would make it "Welcome | LURH".
// For now, the default from RootLayout is "Landmark University Resource Hub".
// We can refine RootLayout metadata `title.default` to "Welcome" to achieve "LURH - Welcome".
// Let's adjust RootLayout's metadata title for this in this set of changes.
// The `metadata` object in `src/app/layout.tsx` has been updated to `title: { default: 'Welcome', template: 'LURH - %s' }`
// This way, the landing page will have the title "LURH - Welcome".

