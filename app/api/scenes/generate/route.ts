import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { workId, sceneId, promptText } = await req.json();
    if (!workId || !sceneId) {
      return NextResponse.json(
        { error: "workId と sceneId が必要です" },
        { status: 400 }
      );
    }

    // 作品の画風を取得してプロンプトに前置
    const { data: work } = await supabase
      .from("works")
      .select("style")
      .eq("id", workId)
      .single();

    const style = work?.style ?? "";
    const prompt = `${style}。${promptText ?? ""}。テキストや文字は画像に入れない。`;

    // gpt-image-1 で生成。組織未認証エラー時のみ dall-e-3 にフォールバック
    let b64: string | undefined;
    try {
      const res = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1536x1024",
        n: 1,
      });
      b64 = res.data?.[0]?.b64_json;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      console.error("gpt-image-1 失敗:", msg);
      if (msg.includes("organization must be verified")) {
        const res = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          size: "1792x1024",
          response_format: "b64_json",
          n: 1,
        });
        b64 = res.data?.[0]?.b64_json;
      } else {
        throw e;
      }
    }

    if (!b64) {
      return NextResponse.json(
        { error: "画像データが取得できませんでした" },
        { status: 500 }
      );
    }

    // b64_json → Buffer → Storage `scenes` バケットへ
    const buffer = Buffer.from(b64, "base64");
    const path = `${workId}/${sceneId}.png`;
    const { error: upErr } = await supabase.storage
      .from("scenes")
      .upload(path, buffer, { contentType: "image/png", upsert: true });
    if (upErr) {
      console.error("アップロード失敗:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from("scenes").getPublicUrl(path);
    const imageUrl = pub.publicUrl;

    // DBには public URL のみ保存
    const { error: updErr } = await supabase
      .from("scenes")
      .update({ image_url: imageUrl })
      .eq("id", sceneId);
    if (updErr) console.error("scenes更新失敗:", updErr);

    return NextResponse.json({ imageUrl });
  } catch (e: any) {
    console.error("generate エラー:", e);
    return NextResponse.json(
      { error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
