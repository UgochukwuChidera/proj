
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"
import AppClientLayout from './app-client-layout';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : new URL('http://localhost:9002'),
  title: {
    default: 'Welcome', // Updated default title for the landing page
    template: 'LURH - %s', // Template for other pages
  },
  description: 'Manage and discover resources at Landmark University.',
  // Add other global metadata like openGraph, twitter, etc. if needed
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // themeColor: '#ffffff', // Example theme color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon links - Ensure these files exist in public/images/ */}
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/images/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" sizes="180x180" />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..0,900;1,200..1,900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AppClientLayout>
          {children}
        </AppClientLayout>
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
