import { createClient } from "@supabase/supabase-js";

// Server-side client with service role key (for uploads)
export function createStorageClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Client-side client with anon key (for public access)
export function createPublicStorageClient(url: string, anonKey: string) {
  return createClient(url, anonKey);
}

export type StorageClient = ReturnType<typeof createStorageClient>;
