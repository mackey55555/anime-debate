import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("work_id", id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("submissions取得エラー:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ submissions: data ?? [] });
}
