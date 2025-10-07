
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { ResourceDetailClientPage } from '@/components/resources/resource-detail-client-page';
import { notFound } from 'next/navigation';
import type { Resource } from '@/lib/mock-data';

type Props = {
  params: { id: string };
};

// This function generates metadata for the page based on the resource details.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: resource } = await supabase
    .from('resources')
    .select('name, description')
    .eq('id', params.id)
    .single();

  if (!resource) {
    return {
      title: 'Resource Not Found',
    };
  }

  return {
    title: resource.name, // Will be "LURH - [Resource Name]"
    description: resource.description,
  };
}

// The main page component for the resource detail view.
export default async function ResourceDetailPage({ params }: Props) {
  // Fetch the full resource details from Supabase.
  const { data: resource, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', params.id)
    .single();

  // If there's an error or the resource is not found, show the 404 page.
  if (error || !resource) {
    console.error('Error fetching resource details:', error?.message);
    notFound();
  }

  // Fetch the uploader's name if an uploader_id exists.
  let uploaderName = 'Unknown';
  if (resource.uploader_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', resource.uploader_id)
      .single();
    if (profile?.name) {
      uploaderName = profile.name;
    }
  }

  // Pass the resource and uploader name to the client component for rendering.
  return <ResourceDetailClientPage resource={resource as Resource} uploaderName={uploaderName} />;
}
