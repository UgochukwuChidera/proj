
"use client";

import type { Resource } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Download, FileText, FileType, HardDrive, Tag, User, Hash } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

interface ResourceDetailClientPageProps {
  resource: Resource;
  uploaderName: string;
}

const FILE_STORAGE_BUCKET = 'resource-files'; 
const EDGE_FUNCTION_SIGNED_URL_ENDPOINT = 'generateUrl';

const formatBytes = (bytes?: number, decimals = 2) => {
  if (bytes === undefined || bytes === null || bytes === 0) return 'N/A';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export function ResourceDetailClientPage({ resource, uploaderName }: ResourceDetailClientPageProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
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

      // Trigger download
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
    <div className="container mx-auto max-w-4xl py-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/resources">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Resources
        </Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">{resource.name}</CardTitle>
          <CardDescription>
            A <Badge variant="secondary">{resource.type}</Badge> resource for course <Badge variant="secondary">{resource.course}</Badge>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-2">Description</h3>
            <p className="text-foreground/80 whitespace-pre-wrap">{resource.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="text-foreground"><span className="font-semibold">Year:</span> {resource.year}</span>
              </div>
              <div className="flex items-center">
                <Hash className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="text-foreground"><span className="font-semibold">Course Code:</span> {resource.course}</span>
              </div>
              <div className="flex items-start">
                <Tag className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <span className="font-semibold">Keywords:</span>
                  {resource.keywords && resource.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {resource.keywords.map(kw => <Badge key={kw} variant="outline">{kw}</Badge>)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground ml-1">None</span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
                <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground"><span className="font-semibold">Uploaded by:</span> {uploaderName}</span>
                </div>
              {resource.file_name && (
                <>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground truncate" title={resource.file_name}><span className="font-semibold">Filename:</span> {resource.file_name}</span>
                  </div>
                  <div className="flex items-center">
                    <HardDrive className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground"><span className="font-semibold">Size:</span> {formatBytes(resource.file_size_bytes)}</span>
                  </div>
                  <div className="flex items-center">
                    <FileType className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground"><span className="font-semibold">Type:</span> {resource.file_mime_type || 'Unknown'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {resource.file_name && (
            <div className="text-center pt-6">
              <Button size="lg" onClick={handleDownload} disabled={isDownloading} className="font-body shadow-lg hover:shadow-xl transition-shadow">
                {isDownloading ? <Loader2 className="animate-spin mr-2"/> : <Download className="mr-2 h-5 w-5" />}
                {isDownloading ? 'Preparing...' : 'Download Resource'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
