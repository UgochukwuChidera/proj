
import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import ChangelogHeader from '@/components/layout/changelog-header'; // Updated import

export const metadata: Metadata = {
  title: 'Changelog', 
  description: 'Version history and updates for Landmark University Resource Hub.',
};

export default function ChangelogPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 min-h-[calc(100vh-8rem)]">
      <ChangelogHeader /> {/* Replaced old button div with the new header component */}

      <header className="mb-10 text-center">
        <h1 className="font-headline text-4xl font-bold text-primary">
          Application Changelog
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Tracking updates and improvements to the Landmark University Resource Hub.
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="shadow-md transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-accent">Version 1.0.0</CardTitle>
            <CardDescription>
              Released: YYYY-MM-DD {/* USER: Please replace YYYY-MM-DD with the actual release date */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg text-foreground mb-3">Initial Release Highlights</h3>
            <ul className="space-y-2">
              {[
                "Secure user authentication (login and registration).",
                "View, filter, and search available university resources.",
                "Advanced search capabilities by keywords, year, type, and course code.",
                "User profile management including avatar upload and name update.",
                "Admin panel for uploading new resources.",
                "Admin panel for user management (password resets).",
                "Responsive, mobile-friendly design.",
                "AI-powered chatbot assistant for application guidance."
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-3 mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 
        Example of a future entry structure:
        <Card className="shadow-md transition-shadow hover:shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-accent">Version 0.9.0 (Beta)</CardTitle>
            <CardDescription>Released: YYYY-MM-DD</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg text-foreground mb-3">Beta Features & Fixes</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-3 mt-0.5 shrink-0" />
                <span className="text-foreground/90">Implemented new feature X for beta testing.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-3 mt-0.5 shrink-0" />
                <span className="text-foreground/90">Fixed a critical bug related to Y.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-3 mt-0.5 shrink-0" />
                <span className="text-foreground/90">Improved performance of Z module.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        Future versions will be added above this line as new <Card> sections 
        */}
      </div>
    </div>
  );
}
