// supabase/functions/generateUrl/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const STORAGE_BUCKET_NAME = 'resource-files';
const SIGNED_URL_EXPIRES_IN = 60; // URL expires in 60 seconds

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Function error: Missing Supabase URL or Service Role Key in environment variables.');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Create a Supabase client with the service role key for admin-level access
    // This is necessary for generating signed URLs without RLS constraints on the URL generation itself.
    // The invocation of this Edge Function should be protected (e.g., by Supabase's default JWT auth for functions).
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { filePath } = await req.json();

    if (!filePath || typeof filePath !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid filePath parameter.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Extract filename from the full path (e.g., "public/uuid/filename.ext" -> "filename.ext")
    const fileName = filePath.split('/').pop();
    if (!fileName) {
        return new Response(JSON.stringify({ error: 'Could not extract filename from filePath.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRES_IN, {
        download: fileName, // This is crucial: sets Content-Disposition: attachment; filename="fileName"
      });

    if (error) {
      console.error('Error generating signed URL:', error);
      return new Response(JSON.stringify({ error: `Failed to generate signed URL: ${error.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    console.error('Unexpected error in generateUrl Edge Function:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
