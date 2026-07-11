import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// 認証なし・RLS全開放のためブラウザ/サーバー共通のpublishableクライアント
export const supabase = createClient(url || "https://example.supabase.co", anonKey || "dummy-key");
