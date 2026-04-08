import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Supabaseが設定済みかどうか
export const isSupabaseConfigured =
  supabaseUrl !== "" &&
  supabaseAnonKey !== "" &&
  supabaseUrl !== "https://your-project.supabase.co";

// 未設定時はダミーURLで初期化（実際には使われない）
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-key"
);
