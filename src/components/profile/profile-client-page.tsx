
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UploadCloud, UserCircle, Loader2, LogOutIcon, Camera } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const AVATAR_STORAGE_BUCKET = 'avatars';
const EDGE_FUNCTION_PROFILE_UPDATE = 'profileUpdate';

const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function ProfileClientPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [isAuthenticated, user, authLoading]);

  const avatarSrc = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    if (user?.avatarUrl && !user.avatarUrl.includes('placehold.co')) return user.avatarUrl;
    return `https://placehold.co/128x128.png?text=${getInitials(user?.name || user?.email || "U")}`;
  }, [avatarPreview, user?.avatarUrl, user?.name, user?.email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const nameChanged = name !== (user.name || "");
    const avatarChanged = !!avatarFile;

    if (!nameChanged && !avatarChanged) {
      toast({ title: "No Changes Detected", description: "Your profile information remains the same." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatePayload: { name?: string; avatarUrl?: string } = {};
      
      if (avatarFile) {
        const filePath = `public/${user.id}/${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(AVATAR_STORAGE_BUCKET)
          .upload(filePath, avatarFile, { upsert: true, cacheControl: '3600' });

        if (uploadError) {
            throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }
        
        const { data: urlData } = supabase.storage
          .from(AVATAR_STORAGE_BUCKET)
          .getPublicUrl(filePath);
        
        updatePayload.avatarUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      }
      
      if (nameChanged) {
        updatePayload.name = name;
      }

      console.log("[CLIENT] Preparing to call Edge Function with payload:", JSON.stringify(updatePayload, null, 2));

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Could not retrieve a valid session. Please re-login.');
      }
      
      const { error: functionError } = await supabase.functions.invoke(
        EDGE_FUNCTION_PROFILE_UPDATE,
        {
          body: updatePayload,
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );
      
      if (functionError) {
        console.error("[CLIENT] Edge Function call failed:", functionError);
        throw new Error(`Profile update failed on the server: ${functionError.message}`);
      }

      console.log("[CLIENT] Edge Function call successful.");

      toast({
        title: "Profile Updated Successfully!",
        description: "Your changes have been saved.",
      });

      window.location.reload();

    } catch (error: any) {
      console.error("[CLIENT] Profile update process failed:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not save your profile. Please try again.",
        variant: "destructive",
        duration: 10000
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Redirecting to login...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p>User data not available. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UserCircle className="mr-2 h-7 w-7" /> User Profile
          </CardTitle>
          <CardDescription>
            Manage your account details and profile picture. {user.isAdmin && (
              <span className="font-semibold text-accent">(Administrator)</span>
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group w-32 h-32">
                <label htmlFor="avatarFile" className="cursor-pointer rounded-full">
                  <div className="relative w-32 h-32 rounded-full border-4 border-transparent group-hover:border-primary/50 transition-colors">
                    <Image
                      src={avatarSrc}
                      alt="User Avatar Preview"
                      fill
                      className="object-cover bg-muted rounded-full"
                      data-ai-hint="user avatar"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </label>
                <Input
                  id="avatarFile"
                  name="avatarFile"
                  type="file"
                  className="sr-only"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleFileChange}
                  disabled={isSubmitting || isLoggingOut}
                />
              </div>
               {avatarFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{avatarFile.name}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name"
                disabled={isSubmitting || isLoggingOut}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled placeholder="your.email@landmark.edu" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={handleLogout} disabled={isSubmitting || isLoggingOut}>
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOutIcon className="mr-2 h-4 w-4" />
              )} Logout
            </Button>
            <Button type="submit" className="font-body" disabled={isSubmitting || isLoggingOut}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
