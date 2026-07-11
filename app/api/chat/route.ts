import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import type { Scene } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  try {
    const { workId, sceneId, studentName, messages } = (await req.json()) as {
      workId: string;
      sceneId?: string | null;
      studentName: string;
      messages: ChatTurn[];
    };

    if (!workId || !studentName || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "workId / studentName / messages が必要です" },
        { status: 400 }
      );
    }

    // 作品情報と全シーンをsystemに含める
    const [{ data: work }, { data: scenes }] = await Promise.all([
      supabase.from("works").select("*").eq("id", workId).single(),
      supabase
        .from("scenes")
        .select("*")
        .eq("work_id", workId)
        .order("sort_order", { ascending: true }),
    ]);

    const sceneLines = (scenes as Scene[] | null ?? [])
      .map(
        (s, i) =>
          `${i + 1}. 絵: ${s.prompt_text ?? "（なし）"} / セリフ: ${s.dialogue ?? "（なし）"}`
      )
      .join("\n");

    const system = `あなたは小学生のアニメ考察を手伝う先生です。答えを直接教えず、問いかけで子どもの考えを深めさせてください。小学生に分かる言葉で、2〜3文で短く返してください。

【作品】
タイトル: ${work?.title ?? ""}
説明: ${work?.description ?? ""}

【シーン一覧】
${sceneLines}`;

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply =
      res.content[0]?.type === "text" ? res.content[0].text : "…";

    // 直近のユーザー発言とAI応答を保存
    const lastUser = messages[messages.length - 1];
    await supabase.from("chat_messages").insert([
      {
        work_id: workId,
        scene_id: sceneId ?? null,
        student_name: studentName,
        role: "user",
        content: lastUser.content,
      },
      {
        work_id: workId,
        scene_id: sceneId ?? null,
        student_name: studentName,
        role: "assistant",
        content: reply,
      },
    ]);

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("chat エラー:", e?.message ?? e);
    return NextResponse.json(
      { error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
