const { createClient } = require("@supabase/supabase-js");

let cached = null;
function getSupabase() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars");
  }

  cached = createClient(url, anonKey);
  return cached;
}

function getPublicUrl(bucket, objectPath) {
  const base = process.env.SUPABASE_PUBLIC_URL || process.env.SUPABASE_URL;
  if (!base) return null;

  const cleanBase = String(base).replace(/\/+$/, "");
  const cleanPath = String(objectPath).replace(/^\/+/, "");

  // Supabase public bucket URL: {projectUrl}/storage/v1/object/public/{bucket}/{path}
  return `${cleanBase}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

async function uploadToSupabase({ bucket, fileName, fileBuffer, contentType }) {
  const supabase = getSupabase();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const publicUrl = getPublicUrl(bucket, fileName);
  return { publicUrl };
}

module.exports = {
  uploadToSupabase,
  getPublicUrl,
};

