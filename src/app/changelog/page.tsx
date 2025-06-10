
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog', // Will be combined with RootLayout template to "LURH - Changelog"
  description: 'Version history and updates for Landmark University Resource Hub.',
};

export default function ChangelogPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 min-h-[calc(100vh-8rem)]">
      <header className="mb-10 text-center">
        <h1 className="font-headline text-4xl font-bold text-primary">
          Application Changelog
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Tracking updates and improvements to the Landmark University Resource Hub.
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-12">
        <article className="pb-8 border-b border-border last:border-b-0">
          <div className="mb-3">
            <h2 className="font-headline text-2xl font-semibold text-foreground">
              Version 1.0.0
            </h2>
            <p className="text-sm text-muted-foreground">
              Released: YYYY-MM-DD {/* USER: Please replace YYYY-MM-DD with the actual release date */}
            </p>
          </div>
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-foreground/90">
            <h3 className="font-semibold text-foreground">Initial Release</h3>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Secure user authentication (login and registration).</li>
              <li>View, filter, and search available university resources.</li>
              <li>Advanced search capabilities by keywords, year, type, and course code.</li>
              <li>User profile management including avatar upload and name update.</li>
              <li>Admin panel for uploading new resources.</li>
              <li>Admin panel for user management (password resets).</li>
              <li>Responsive, mobile-friendly design.</li>
              <li>AI-powered chatbot assistant for application guidance.</li>
            </ul>
          </div>
        </article>

        {/* Future versions will be added above this line as new <article> sections */}
      </div>
    </div>
  );
}
