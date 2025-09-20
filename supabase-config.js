// supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';

// 你的 Supabase 项目 URL 和 anon 公钥
const supabaseUrl = 'https://gboujpgswtpyftlakvsm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdib3VqcGdzd3RweWZ0bGFrdnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNjU4MjYsImV4cCI6MjA3Mzg0MTgyNn0.JacF3xi3xzqThgBCk7xVlKGVipBPiDCIbVgA5GZB7Zs';

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
