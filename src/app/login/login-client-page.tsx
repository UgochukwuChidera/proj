
"use client";
import { AuthForm } from '@/components/auth/auth-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginClientPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Login</CardTitle>
          <CardDescription>Access your Landmark University Resource Hub account.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
        </CardContent>
      </Card>
    </div>
  );
}
