import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import type { Scene } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { workId, studentName, essay } = (await req.json()) as {
      workId: string;
      studentName: string;
      essay: string;
    };

    if (!workId || !studentName || !essay?.trim()) {
      return NextResponse.json(
        { error: "workId / studentName / essay が必要です" },
        { status: 400 }
      );
    }

    // まず感想文を保存
    const { data: submission, error: insErr } = await supabase
      .from("submissions")
      .insert({ work_id: workId, student_name: studentName, essay })
      .select()
      .single();
    if (insErr || !submission) {
      console.error("submission保存エラー:", insErr?.message);
      return NextResponse.json(
        { error: insErr?.message ?? "保存に失敗しました" },
        { status: 500 }
      );
    }

    // 作品・シーン情報を取得
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

    const system = `あなたは小学生の感想文を読む、やさしい先生です。
感想文を読んで、JSONだけを出力してください。前後に説明やコードブロック(\`\`\`)は付けないこと。

出力形式:
{"summary": "感想文の要約(1〜2文)", "score": 1から5の整数, "comment": "小学生向けの励ましのコメント(2〜3文)"}

採点(score)の観点:
- 自分の考えがあるか
- シーンを根拠にしているか
- 感じたことを表現できているか
commentは小学生が読んで うれしくなる励ましトーンにしてください。`;

    const userMsg = `【作品】
タイトル: ${work?.title ?? ""}
説明: ${work?.description ?? ""}

【シーン一覧】
${sceneLines}

【${studentName}さんの感想文】
${essay}`;

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = res.content[0]?.type === "text" ? res.content[0].text : "";
    let summary = "";
    let score: number | null = null;
    let comment = "";
    try {
      // 念のためコードフェンスを除去してからパース
      const jsonText = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);
      summary = String(parsed.summary ?? "");
      score = Number(parsed.score) || null;
      comment = String(parsed.comment ?? "");
    } catch (e) {
      console.error("採点JSONパース失敗:", raw);
    }

    const { error: updErr } = await supabase
      .from("submissions")
      .update({ ai_summary: summary, ai_score: score, ai_comment: comment })
      .eq("id", submission.id);
    if (updErr) console.error("submission採点更新エラー:", updErr.message);

    return NextResponse.json({
      id: submission.id,
      summary,
      score,
      comment,
    });
  } catch (e: any) {
    console.error("submissions エラー:", e?.message ?? e);
    return NextResponse.json(
      { error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
