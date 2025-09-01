
// supabase/functions/profileUpdate/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  console.log("[SERVER] profileUpdate function invoked.");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[SERVER] Handling OPTIONS preflight request.");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin Client
    console.log("[SERVER] Initializing Supabase admin client.");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[SERVER] Function error: Missing Supabase URL or Service Role Key.');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log("[SERVER] Supabase admin client initialized.");

    // 2. Get the authenticated user from the request headers
    console.log("[SERVER] Authenticating user from request headers.");
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[SERVER] Auth error: Missing Authorization header.");
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
      console.error('[SERVER] Auth error:', userError?.message || 'User not found.');
      return new Response(JSON.stringify({ error: 'Not authenticated or invalid token.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log(`[SERVER] Authenticated user ID: ${user.id}`);

    // 3. Get the request body
    const body = await req.json();
    console.log("[SERVER] Received request body:", JSON.stringify(body, null, 2));
    const { name, avatarUrl } = body;


    if (!name && !avatarUrl) {
      console.error("[SERVER] Validation error: No name or avatarUrl in payload.");
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
    console.log("[SERVER] Constructed update payload for Supabase:", JSON.stringify(updatePayload, null, 2));

    // 5. Update the user metadata using the Admin client
    console.log(`[SERVER] Attempting to update user metadata for user ID: ${user.id}`);
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      updatePayload
    );

    if (updateError) {
      console.error(`[SERVER] Error updating user ${user.id}:`, updateError);
      return new Response(JSON.stringify({ error: `Failed to update user profile: ${updateError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 6. Return a success response
    console.log(`[SERVER] Successfully updated user ${user.id}.`);
    return new Response(JSON.stringify({ message: 'Profile updated successfully.', user: updatedUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    console.error('[SERVER] Unexpected error in profileUpdate Edge Function:', e);
    return new Response(JSON.stringify({ error: e.message || 'An internal server error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
