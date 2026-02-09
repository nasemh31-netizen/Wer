
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
// Since we are client-side only for this demo, these keys are exposed.
// In a real production app, enable Row Level Security (RLS) on Supabase.

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Sync Helper (Basic Implementation)
export const syncService = {
  async pushTable(tableName: string, data: any[]) {
    if (data.length === 0) return;
    const { error } = await supabase.from(tableName).upsert(data);
    if (error) console.error(`Sync error on ${tableName}:`, error);
  }
};
