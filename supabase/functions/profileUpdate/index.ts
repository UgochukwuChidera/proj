
// supabase/functions/profileUpdate/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Function error: Missing Supabase URL or Service Role Key.');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 2. Get the authenticated user from the request headers
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
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Not authenticated or invalid token.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 3. Get the request body
    const { name, avatarUrl } = await req.json();

    if (!name && !avatarUrl) {
      return new Response(JSON.stringify({ error: 'No update data provided. Please provide a name or avatarUrl.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 4. Construct the update payload
    const updatePayload: { data: { [key: string]: any } } = { data: {} };
    if (name) {
      updatePayload.data.name = name;
    }
    if (avatarUrl) {
      updatePayload.data.avatar_url = avatarUrl;
    }

    // 5. Update the user metadata using the Admin client
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      updatePayload
    );

    if (updateError) {
      console.error(`Error updating user ${user.id}:`, updateError);
      return new Response(JSON.stringify({ error: `Failed to update user profile: ${updateError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 6. Return a success response
    return new Response(JSON.stringify({ message: 'Profile updated successfully.', user: updatedUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    console.error('Unexpected error in profileUpdate Edge Function:', e);
    return new Response(JSON.stringify({ error: e.message || 'An internal server error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
