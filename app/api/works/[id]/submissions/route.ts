import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    return NextResponse.json({ error: "invalid work id" }, { status: 400 });
  }

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
