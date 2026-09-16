import { createClient } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;

  let rawUrl = storedUrl || import.meta.env.VITE_SUPABASE_URL || 'https://qavcgqftxomlcdfpbuxa.supabase.co';
  if (rawUrl.endsWith('/rest/v1/')) {
    rawUrl = rawUrl.replace('/rest/v1/', '');
  } else if (rawUrl.endsWith('/rest/v1')) {
    rawUrl = rawUrl.replace('/rest/v1', '');
  }

  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmNncWZ0eG9tbGNkZnBidXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTgyMzQsImV4cCI6MjEwNTA3NDIzNH0.Bz2dfyhrclBgmrXJHJIFWeblPksIovsCNuGSedO8hN0';
  const anonKey = storedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

  return {
    url: rawUrl,
    anonKey: anonKey
  };
}

const creds = getSupabaseCredentials();
export const supabase = createClient(creds.url, creds.anonKey || 'placeholder-key');

export function updateSupabaseClient(url: string, anonKey: string) {
  localStorage.setItem('supabase_url', url.trim());
  localStorage.setItem('supabase_anon_key', anonKey.trim());
  window.location.reload();
}
