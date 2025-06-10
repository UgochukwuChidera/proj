
"use client";
import type { Resource } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, BookOpen, FlaskConical, MonitorPlay, Video, FileQuestion, Download, Trash2, Loader2, FileArchive, Image as ImageIcon, FileCode, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean;
  onDeleteSuccess: (resourceId: string) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  'Lecture Notes': FileText,
  'Textbook': BookOpen,
  'Research Paper': FileText,
  'Lab Equipment': FlaskConical,
  'Software License': MonitorPlay,
  'Video Lecture': Video,
  'PDF Document': FileText,
  'Other': FileQuestion,
};

const FILE_STORAGE_BUCKET = 'resource-files'; 
const EDGE_FUNCTION_SIGNED_URL_ENDPOINT = 'generateUrl'; // Updated endpoint name

const formatBytes = (bytes?: number, decimals = 2) => {
  if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getDisplayIcon = (resource: Resource): React.ElementType => {
  const mimeType = resource.file_mime_type;
  if (mimeType) {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return MonitorPlay; // Example: could be specific icon for audio
    if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-rar-compressed') || mimeType.startsWith('application/x-7z-compressed') || mimeType.startsWith('application/gzip')) return FileArchive;
    if (mimeType.startsWith('text/html') || mimeType.startsWith('application/xml') || mimeType.startsWith('application/json')) return FileCode;
    if (mimeType.startsWith('text/csv') || mimeType.startsWith('application/vnd.ms-excel') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return FileSpreadsheet;
    if (mimeType.startsWith('text/')) return FileText;
  }
  return typeIcons[resource.type] || FileQuestion;
};


export function ResourceCard({ resource, isAdmin, onDeleteSuccess }: ResourceCardProps) {
  const DisplayIcon = getDisplayIcon(resource);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    let storageFileDeleted = false;
    let storageErrorOccurred = false;
    let storageErrorMessage = '';

    console.log(`Resource Card: Initiating delete for resource ID: ${resource.id}, Name: "${resource.name}"`);

    // Path construction based on upload logic: public/${resourceId}/${fileName}
    if (resource.file_name && resource.id) {
      const filePathForStorage = `public/${resource.id}/${resource.file_name}`; 
      console.log(`Resource Card: Attempting to delete associated file. Path: '${filePathForStorage}', Bucket: ${FILE_STORAGE_BUCKET}`);
      try {
        const { error: storageError } = await supabase
          .storage
          .from(FILE_STORAGE_BUCKET)
          .remove([filePathForStorage]);

        if (storageError) {
          if (storageError.message.includes("Not found") || storageError.message.includes("The resource was not found")) {
            console.warn(`Resource Card: Storage file '${filePathForStorage}' not found during deletion (possibly already deleted or path mismatch). Message: ${storageError.message}`);
          } else {
            console.error("Resource Card: Error deleting file from storage:", JSON.stringify(storageError, null, 2));
            storageErrorOccurred = true;
            storageErrorMessage = `Storage delete error: ${storageError.message}. Check RLS policies on the '${FILE_STORAGE_BUCKET}' bucket.`;
          }
        } else {
          console.log(`Resource Card: Successfully deleted '${filePathForStorage}' from storage bucket '${FILE_STORAGE_BUCKET}'.`);
          storageFileDeleted = true;
        }
      } catch (e: any) {
        console.error("Resource Card: Exception during storage file deletion attempt. Error:", e.message, e.stack);
        storageErrorOccurred = true;
        storageErrorMessage = `File deletion exception: ${e.message}.`;
      }
    } else {
      console.log("Resource Card: No file_name or resource.id; skipping storage deletion.");
      if (resource.file_url) { 
         storageErrorMessage = 'File details (name/id) missing for constructing storage path; file not deleted from storage.';
      }
    }

    const { error: dbError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resource.id);

    setIsDeleting(false);

    if (dbError) {
      console.error("Resource Card: Error deleting resource from DB:", JSON.stringify(dbError, null, 2));
      toast({
        title: 'DB Record Deletion Failed',
        description: `Could not delete resource record: ${dbError.message}. Check RLS policies on 'resources' table.`,
        variant: 'destructive',
      });
    } else {
      let toastTitle = 'Resource Deleted';
      let toastDescription = `"${resource.name}" database record removed.`;
      let toastVariant: "default" | "destructive" = "default";

      if (resource.file_name && resource.id) { // Check if there was a file to begin with
        if (storageFileDeleted) {
          toastDescription += ' Associated file also deleted from storage.';
        } else if (storageErrorOccurred) {
          toastTitle = 'DB Record Deleted, Storage Issue';
          toastDescription += ` Associated file NOT deleted from storage. ${storageErrorMessage}`;
          toastVariant = "destructive"; 
        } else {
          // This case covers "file not found" or other non-error scenarios where it wasn't deleted but not due to a permission error etc.
          toastDescription += ` ${storageErrorMessage || 'Associated file in storage: Status undetermined or file not found (may have been deleted previously or path issue).'}`;
        }
      }
      toast({ title: toastTitle, description: toastDescription, variant: toastVariant, duration: storageErrorOccurred ? 10000 : 5000 });
      onDeleteSuccess(resource.id);
    }
  };

  const handleDownload = async () => {
    if (!resource.file_name || !resource.id) {
      toast({ title: 'Download Error', description: 'File details (name or ID) missing for download.', variant: 'destructive' });
      return;
    }
    setIsDownloading(true);
    try {
      // The file path in the bucket is constructed based on how it was uploaded
      // (see UploadResourceClientPage.tsx: `public/${resourceId}/${file.name}`)
      const filePathInBucket = `public/${resource.id}/${resource.file_name}`;
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast({ title: 'Authentication Error', description: 'Could not retrieve current session. Please re-login.', variant: 'destructive' });
        setIsDownloading(false);
        return;
      }

      // Call the Supabase Edge Function to get a signed URL
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke(
        EDGE_FUNCTION_SIGNED_URL_ENDPOINT, 
        {
          body: { filePath: filePathInBucket },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          }
        }
      );

      if (functionError) {
        console.error('Edge function invocation error:', functionError);
        const errorDetails = functionError.context?.json ? JSON.stringify(functionError.context.json()) : functionError.message;
        throw new Error(`Failed to get download URL from function. Details: ${errorDetails}`);
      }
      
      const responseData = functionResponse as { signedUrl?: string; error?: string };

      if (responseData.error || !responseData.signedUrl) {
        throw new Error(responseData.error || 'Signed URL not found in function response.');
      }

      // Programmatically trigger download
      const link = document.createElement('a');
      link.href = responseData.signedUrl;
      link.setAttribute('download', resource.file_name || 'download'); // Use original filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Could not retrieve the file for download.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center justify-center h-32 w-full bg-muted mb-3 overflow-hidden">
          <DisplayIcon className="w-16 h-16 text-primary shrink-0" />
        </div>
        <CardTitle className="font-headline text-lg truncate" title={resource.name}>{resource.name}</CardTitle>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
          <DisplayIcon className="w-4 h-4 mr-1.5 shrink-0" />
          <span className="truncate" title={`${resource.type} - ${resource.course}`}>
            {resource.type} - {resource.course}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow min-h-0">
        <p className="text-sm text-foreground/80 line-clamp-3 mb-3 h-[3.75rem] overflow-hidden" title={resource.description}>{resource.description}</p>
        {resource.file_name && resource.id && ( // Ensure resource.id and file_name are present for download
          <div className="mt-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={isDownloading || isDeleting}
              className="font-body text-xs w-full justify-start overflow-hidden px-2 py-1 h-auto min-h-8"
              title={`Download ${resource.file_name} (${formatBytes(resource.file_size_bytes)})`}
            >
              <div className="flex items-center w-full min-w-0">
                {isDownloading ? <Loader2 className="mr-2 h-3.5 w-3.5 shrink-0 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5 shrink-0" />}
                <span className="truncate flex-grow min-w-0" title={resource.file_name}>{resource.file_name}</span>
                <span className="ml-1 text-muted-foreground/70 shrink-0 text-[0.7rem] self-end whitespace-nowrap">
                  ({formatBytes(resource.file_size_bytes)})
                </span>
              </div>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex flex-wrap gap-2 items-center justify-between text-xs border-t mt-auto">
        <div className="flex gap-1.5 items-center overflow-hidden min-w-0 flex-grow">
            <Badge variant="secondary" className="font-normal shrink-0">{resource.year}</Badge>
            {resource.keywords && resource.keywords.length > 0 && (
                 <Badge variant="outline" className="font-normal truncate max-w-[calc(100%-7rem)] sm:max-w-[calc(100%-8rem)]" title={resource.keywords.join(', ')}>
                    {resource.keywords[0]}{resource.keywords.length > 1 ? ', ...' : ''}
                </Badge>
            )}
        </div>
        {isAdmin && (
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="font-body text-xs h-7 px-2 py-1 shrink-0" disabled={isDeleting || isDownloading}>
                {isDeleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the resource
                  &quot;{resource.name}&quot; and its associated file (if any) from storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={cn(buttonVariants({variant: "destructive"}))}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Yes, delete it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}

