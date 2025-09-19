// supabase-config.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gboujpgswtpyftlakvsm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdib3VqcGdzd3RweWZ0bGFrdnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNjU4MjYsImV4cCI6MjA3Mzg0MTgyNn0.JacF3xi3xzqThgBCk7xVlKGVipBPiDCIbVgA5GZB7Zs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);