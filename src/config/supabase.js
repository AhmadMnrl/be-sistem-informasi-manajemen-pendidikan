// Supabase config untuk upload file (dipakai di Vercel)
// NOTE: letakkan di environment variables untuk keamanan.

const SUPABASE_PROJECT_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_REST_URL = process.env.SUPABASE_REST_URL;

module.exports = {
  SUPABASE_PROJECT_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_REST_URL,
};

