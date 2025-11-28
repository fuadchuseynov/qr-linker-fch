import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bnugodrnpehoywwtgqug.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWdvZHJucGVob3l3d3RncXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjg5MDYsImV4cCI6MjA3OTg0NDkwNn0.4zKpdR-lhZW66v21__e9djeMm2rgQXfiSOp1JQ6nHtY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
