
// supabase/functions/profileUpdate/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated or invalid token.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const body = await req.json();
    const { name, avatarUrl } = body;

    if (!name && !avatarUrl) {
      return new Response(JSON.stringify({ error: 'No update data provided. Please provide a name or avatarUrl.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Part 1: Update auth.users user_metadata (good practice)
    const metadataPayload: { [key: string]: any } = {};
    if (name) metadataPayload.name = name;
    if (avatarUrl) metadataPayload.avatar_url = avatarUrl;
    
    if (Object.keys(metadataPayload).length > 0) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { data: metadataPayload }
      );

      if (updateError) {
        return new Response(JSON.stringify({ error: `Failed to update user auth metadata: ${updateError.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    // Part 2: Update the public 'profiles' table (the critical fix)
    const profileUpdatePayload: { [key: string]: any } = {
      id: user.id, // Always specify the ID for the upsert
      updated_at: new Date().toISOString(),
    };
    if (name) profileUpdatePayload.name = name;
    if (avatarUrl) profileUpdatePayload.avatar_url = avatarUrl; 

    if (Object.keys(profileUpdatePayload).length > 2) { // More than just id and updated_at
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert(profileUpdatePayload);

        if (profileError) {
           return new Response(JSON.stringify({ error: `Failed to update profile table: ${profileError.message}` }), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             status: 500,
           });
        }
    }

    return new Response(JSON.stringify({ message: 'Profile updated successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'An internal server error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
