
"use client"; 

import React from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import ConditionalAppShell from './conditional-app-shell';

export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ConditionalAppShell>{children}</ConditionalAppShell>
    </AuthProvider>
  );
}
