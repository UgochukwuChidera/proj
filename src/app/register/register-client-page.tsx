
"use client";
import { AuthForm } from '@/components/auth/auth-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterClientPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Register</CardTitle>
          <CardDescription>Create a new account for Landmark University Resource Hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="register" />
        </CardContent>
      </Card>
    </div>
  );
}
