# 制約
- Next.js App Router + TypeScript + Tailwind。仕様は SPEC.md に従う
- SPEC.mdの実装順1→8を厳守。各ステップで `npm run dev` で動作確認してから次へ
- DBスキーマは適用済み。マイグレーションファイルは作らない
- Supabaseキーはpublishable key(NEXT_PUBLIC_SUPABASE_ANON_KEY)のみ。RLSは全開放済み
- 画像生成: gpt-image-1。`organization must be verified` エラー時のみ dall-e-3 に切替
- 画像はb64_json→Buffer→Supabase Storage `scenes` バケットへ。DBにはpublic URLのみ保存
- Claudeモデルは claude-sonnet-4-6
- エラーハンドリングは最小限でよい(ハッカソン)。console.errorで十分
- 環境変数は .env.local に設定済み:
  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
  OPENAI_API_KEY / ANTHROPIC_API_KEY
- UIは日本語。小学生が使う想定なので大きめのボタン・平易な文言