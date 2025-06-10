// supabase/functions/_shared/cors.ts
// These are standard CORS headers.
// For production, you MUST restrict 'Access-Control-Allow-Origin'
// to your specific frontend domain(s) instead of using '*'.
export const corsHeaders = {
  // IMPORTANT: Replace 'YOUR_FRONTEND_DOMAIN_HERE' with your actual frontend URL (e.g., https://yourapp.com)
  // Using '*' with 'Access-Control-Allow-Credentials: true' is not allowed by browsers.
  'Access-Control-Allow-Origin': 'YOUR_FRONTEND_DOMAIN_HERE', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 
  'Access-Control-Allow-Credentials': 'true', // Added to allow credentials
};
