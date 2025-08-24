
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import type { Resource } from '@/lib/mock-data';
import { Loader2, UploadCloud, ArrowLeft, FileUp } from 'lucide-react';
import Link from 'next/link';

const RESOURCE_TYPES: Resource['type'][] = ['Lecture Notes', 'Textbook', 'Research Paper', 'Lab Equipment', 'Software License', 'Video Lecture', 'PDF Document', 'Other'];
const FILE_STORAGE_BUCKET = 'resource-files'; 

export function UploadResourceClientPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<Resource['type']>('Other');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        router.push('/resources');
      }
    }
  }, [isAuthenticated, user, authLoading, router, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.isAdmin) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    if (!name || !type || !course || !year || !description || !file) {
      toast({ title: 'Missing Fields', description: 'Please fill in all required text fields and select a file.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const resourceId = crypto.randomUUID();
    let uploadedFileUrl: string | undefined = undefined;
    let uploadedFileName: string | undefined = undefined;
    let uploadedFileMimeType: string | undefined = undefined;
    let uploadedFileSizeBytes: number | undefined = undefined;

    if (file) {
      const filePath = `public/${resourceId}/${file.name}`; 
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(FILE_STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        toast({ title: 'File Upload Failed', description: uploadError.message, variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from(FILE_STORAGE_BUCKET)
        .getPublicUrl(uploadData.path);
      
      uploadedFileUrl = publicUrlData.publicUrl;
      uploadedFileName = file.name;
      uploadedFileMimeType = file.type; 
      uploadedFileSizeBytes = file.size;
    }

    const newResourceData: Omit<Resource, 'id' | 'created_at' | 'updated_at'> & { uploader_id?: string, id: string } = {
      id: resourceId,
      name,
      type,
      course,
      year: Number(year),
      description,
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      file_url: uploadedFileUrl,
      file_name: uploadedFileName,
      file_mime_type: uploadedFileMimeType,
      file_size_bytes: uploadedFileSizeBytes,
      uploader_id: user.id,
    };

    console.log("Attempting to insert resource data:", JSON.stringify(newResourceData, null, 2));
    
    const { error: dbError } = await supabase.from('resources').insert(newResourceData);

    setIsSubmitting(false);
    if (dbError) {
      let errorDescription = `Database error: ${dbError.message}`;
      if (dbError.code === 'PGRST204') {
        const match = dbError.message.match(/Could not find the '([^']+)' column/);
        const columnName = match ? match[1] : 'a specific';
        errorDescription = `Database schema mismatch (Code: PGRST204): Could not find the '${columnName}' column. Please ensure your 'resources' table schema is correct in the Supabase database AND reload the schema cache in Supabase Dashboard (Project Settings > API > Reload Schema). Details: ${dbError.details || 'N/A'}. Hint: ${dbError.hint || 'N/A'}`;
      } else {
        errorDescription = `Database error: ${dbError.message} (Code: ${dbError.code}) Details: ${dbError.details || 'N/A'} Hint: ${dbError.hint || 'N/A'}.`;
      }
      toast({ title: 'Resource Creation Failed', description: errorDescription, variant: 'destructive', duration: 20000 });
      console.error("Error inserting resource:", dbError);
    } else {
      toast({ title: 'Resource Uploaded!', description: `"${name}" has been added.` });
      router.push('/resources');
      setName('');
      setType('Other');
      setCourse('');
      setYear('');
      setDescription('');
      setKeywords('');
      setFile(null);
      if (document.getElementById('file')) { 
        (document.getElementById('file') as HTMLInputElement).value = "";
      }
    }
  };

  if (authLoading || (!authLoading && (!isAuthenticated || !user?.isAdmin))) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/resources">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resources
        </Link>
      </Button>
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UploadCloud className="mr-2 h-7 w-7" /> Upload New Resource
          </CardTitle>
          <CardDescription>Fill in the details and upload the resource file.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Resource Name*</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Quantum Physics Lecture Slides" required disabled={isSubmitting} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type">Resource Type*</Label>
                <Select value={type} onValueChange={(value) => setType(value as Resource['type'])} required disabled={isSubmitting}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course Code*</Label>
                <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g., PHY301" required disabled={isSubmitting} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="year">Year of Publication/Availability*</Label>
                <Input id="year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || '')} placeholder="e.g., 2023" required disabled={isSubmitting} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g., physics, quantum, notes" disabled={isSubmitting} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description*</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the resource..." required disabled={isSubmitting} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Resource File*</Label>
              <Input id="file" type="file" onChange={handleFileChange} disabled={isSubmitting} className="pt-2 text-sm" required />
              {file && <p className="text-xs text-muted-foreground mt-1">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
              <p className="text-xs text-muted-foreground">Upload a PDF, document, video, etc. Max size depends on Supabase plan.</p>
            </div>
            
            <p className="text-xs text-muted-foreground">* Required fields</p>

            <Button type="submit" className="w-full font-body" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <FileUp className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
    

    
