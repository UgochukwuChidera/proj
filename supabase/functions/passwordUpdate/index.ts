
// supabase/functions/passwordUpdate/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_PAGES_TO_FETCH = 100; // Safety limit: 100 pages * 1000 users/page = 100,000 users
const USERS_PER_PAGE = 1000;    // Max users Supabase typically returns per page for admin.listUsers

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase URL or Service Role Key');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Supabase credentials.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!, 
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user: callingUser }, error: callingUserAuthError } = await supabaseClient.auth.getUser();

    if (callingUserAuthError || !callingUser) {
      console.error('Auth error for calling user:', callingUserAuthError);
      return new Response(JSON.stringify({ error: 'Not authenticated or authentication error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', callingUser.id)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      console.error('Admin check failed:', profileError, profile);
      return new Response(JSON.stringify({ error: 'Forbidden: Caller is not an administrator.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    
    const { userEmailToUpdate, newPassword } = await req.json();

    if (!userEmailToUpdate || typeof userEmailToUpdate !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid userEmailToUpdate parameter.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Missing or invalid newPassword (must be at least 6 characters).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let targetUser = null;
    let currentPage = 1;
    let hasMorePages = true;
    let safetyCounter = 0;

    console.log(`Searching for user by email: ${userEmailToUpdate}`);

    while (!targetUser && hasMorePages && safetyCounter < MAX_PAGES_TO_FETCH) {
      safetyCounter++;
      console.log(`Fetching page ${currentPage} of users (up to ${USERS_PER_PAGE} users)...`);
      const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: currentPage,
        perPage: USERS_PER_PAGE,
      });

      if (listError) {
        console.error(`Error listing users on page ${currentPage}:`, listError);
        return new Response(JSON.stringify({ error: `Error searching for user: ${listError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
      }

      if (usersList && usersList.users) {
        targetUser = usersList.users.find(u => u.email === userEmailToUpdate);
        console.log(`Page ${currentPage}: Found ${usersList.users.length} users. Target user ${targetUser ? 'found' : 'not found in this page'}.`);
        if (usersList.users.length < USERS_PER_PAGE) {
          hasMorePages = false; // Last page
        } else {
          currentPage++;
        }
      } else {
        hasMorePages = false; // No users returned or error
      }
    }
     if (safetyCounter >= MAX_PAGES_TO_FETCH && !targetUser) {
      console.warn(`Reached max pages (${MAX_PAGES_TO_FETCH}) to fetch while searching for ${userEmailToUpdate}. User not found within this limit.`);
    }


    if (!targetUser) {
      console.log(`User with email '${userEmailToUpdate}' not found after searching.`);
      return new Response(JSON.stringify({ error: `User with email '${userEmailToUpdate}' not found.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const targetUserId = targetUser.id;
    console.log(`Found user ID: ${targetUserId} for email: ${userEmailToUpdate}. Attempting password update.`);

    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password for user ID', targetUserId, updateError);
      return new Response(JSON.stringify({ error: `Failed to update password: ${updateError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Password for user ${userEmailToUpdate} (ID: ${targetUserId}) updated successfully.`);
    return new Response(JSON.stringify({ message: `Password for user ${userEmailToUpdate} (ID: ${targetUserId}) updated successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    console.error('Unexpected error in passwordUpdate Edge Function:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
