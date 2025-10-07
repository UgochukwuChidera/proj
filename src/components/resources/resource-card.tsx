
"use client";
import type { Resource } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, BookOpen, FlaskConical, MonitorPlay, Video, FileQuestion, Download, Trash2, Loader2, FileArchive, Image as ImageIcon, FileCode, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
const EDGE_FUNCTION_SIGNED_URL_ENDPOINT = 'generateUrl';

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
    if (mimeType.startsWith('audio/')) return MonitorPlay;
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    setIsDeleting(true);
    let storageFileDeleted = false;
    let storageErrorOccurred = false;
    let storageErrorMessage = '';

    if (resource.file_name && resource.id) {
      const filePathForStorage = `public/${resource.id}/${resource.file_name}`; 
      try {
        const { error: storageError } = await supabase
          .storage
          .from(FILE_STORAGE_BUCKET)
          .remove([filePathForStorage]);

        if (storageError) {
          if (storageError.message.includes("Not found")) {
            console.warn(`Storage file '${filePathForStorage}' not found during deletion.`);
          } else {
            storageErrorOccurred = true;
            storageErrorMessage = `Storage delete error: ${storageError.message}.`;
          }
        } else {
          storageFileDeleted = true;
        }
      } catch (e: any) {
        storageErrorOccurred = true;
        storageErrorMessage = `File deletion exception: ${e.message}.`;
      }
    }

    const { error: dbError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resource.id);

    setIsDeleting(false);

    if (dbError) {
      toast({
        title: 'DB Record Deletion Failed',
        description: `Could not delete resource record: ${dbError.message}.`,
        variant: 'destructive',
      });
    } else {
      let toastTitle = 'Resource Deleted';
      let toastDescription = `"${resource.name}" database record removed.`;
      let toastVariant: "default" | "destructive" = "default";

      if (resource.file_name && resource.id) {
        if (storageFileDeleted) {
          toastDescription += ' Associated file also deleted.';
        } else if (storageErrorOccurred) {
          toastTitle = 'DB Record Deleted, Storage Issue';
          toastDescription += ` Associated file NOT deleted. ${storageErrorMessage}`;
          toastVariant = "destructive"; 
        }
      }
      toast({ title: toastTitle, description: toastDescription, variant: toastVariant, duration: storageErrorOccurred ? 10000 : 5000 });
      onDeleteSuccess(resource.id);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    if (!resource.file_name || !resource.id) {
      toast({ title: 'Download Error', description: 'File details missing for download.', variant: 'destructive' });
      return;
    }
    setIsDownloading(true);
    try {
      const filePathInBucket = `public/${resource.id}/${resource.file_name}`;
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Could not retrieve current session. Please re-login.');
      }

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
        throw new Error(`Failed to get download URL: ${functionError.message}`);
      }
      
      const responseData = functionResponse as { signedUrl?: string; error?: string };

      if (responseData.error || !responseData.signedUrl) {
        throw new Error(responseData.error || 'Signed URL not found in response.');
      }

      const link = document.createElement('a');
      link.href = responseData.signedUrl;
      link.setAttribute('download', resource.file_name || 'download');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error: any) {
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
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
      <Link href={`/resources/${resource.id}`} className="flex flex-col flex-grow">
        <CardHeader className="p-4">
          <div className="flex items-center justify-center h-32 w-full bg-muted mb-3 overflow-hidden rounded-md">
            <DisplayIcon className="w-16 h-16 text-primary shrink-0 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <CardTitle className="font-headline text-lg truncate group-hover:text-primary transition-colors" title={resource.name}>
            {resource.name}
          </CardTitle>
          <CardDescription className="flex items-center text-xs text-muted-foreground">
            <DisplayIcon className="w-4 h-4 mr-1.5 shrink-0" />
            <span className="truncate" title={`${resource.type} - ${resource.course}`}>
              {resource.type} - {resource.course}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow min-h-0">
          <p className="text-sm text-foreground/80 line-clamp-3 mb-3 h-[3.75rem] overflow-hidden" title={resource.description}>
            {resource.description}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-2 flex flex-wrap gap-2 items-center justify-between text-xs border-t mt-auto">
        <div className="flex gap-1.5 items-center overflow-hidden min-w-0 flex-grow">
            <Badge variant="secondary" className="font-normal shrink-0">{resource.year}</Badge>
        </div>
        <div className="flex items-center gap-2">
            {resource.file_name && resource.id && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDownload}
                    disabled={isDownloading || isDeleting}
                    className="font-body text-xs h-7 px-2 py-1 shrink-0"
                    title={`Download ${resource.file_name} (${formatBytes(resource.file_size_bytes)})`}
                >
                    {isDownloading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                    Download
                </Button>
            )}
            {isAdmin && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="font-body text-xs h-7 px-2 py-1 shrink-0" disabled={isDeleting || isDownloading} onClick={(e) => {e.stopPropagation(); e.preventDefault();}}>
                    {isDeleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                    Delete
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => {e.stopPropagation(); e.preventDefault();}}>
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
        </div>
      </CardFooter>
    </Card>
  );
}
