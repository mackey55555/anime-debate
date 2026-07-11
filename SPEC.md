# アニメ感想ディベート - ハッカソン仕様書

小学生の読書感想文を「アニメ考察」に置き換える教育アプリ。
先生がシーンカード(画像+セリフ)で紙芝居アニメを作り、
生徒が視聴・考察メモ・AIディスカッションを経て感想文を提出。
先生はAI要約+採点付きで提出物を確認できる。

## 技術構成
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres + Storage(バケット `scenes`、public設定済み)
- Claude API (claude-sonnet-4-6): ディスカッション / 要約+採点
- OpenAI API (gpt-image-1): シーン画像生成
- 認証なし。ヘッダーに「👨‍🏫 先生 / 🎒 生徒」モード切替トグル(React Contextで保持)
- 生徒名は初回にlocalStorageへ保存する簡易方式

## ページ構成
- `/`                      作品一覧(両モード共通の入口)
- `/teacher/works/new`     作品作成(タイトル、説明、画風style)
- `/teacher/works/[id]`    シーン編集(追加・生成・並び替え)+ 提出一覧タブ
- `/works/[id]`            生徒: 紙芝居ビューア + シーンメモ + AIチャット
- `/works/[id]/submit`     生徒: 感想文の提出

## APIルート(AIキーを使う処理のみサーバー側に隔離)
- `POST /api/scenes/generate`
  入力: { workId, sceneId, promptText }
  処理: works.styleを前置したプロンプトでgpt-image-1呼び出し
        → b64_jsonをBufferに変換 → Supabase Storageにアップロード
        → public URLをscenes.image_urlに保存して返却
  注意: レスポンスは4MB超のbase64。DBにbase64を保存しない。
- `POST /api/chat`
  入力: { workId, sceneId?, studentName, messages[] }
  処理: 作品情報+全シーンのprompt_text/dialogueをsystemに含めてClaude呼び出し。
        会話はchat_messagesに保存。
- `POST /api/submissions`
  入力: { workId, studentName, essay }
  処理: 保存後、Claudeで要約+採点をJSON出力させ
        ai_summary / ai_score / ai_comment に格納。
- `GET /api/works/[id]/submissions` 先生用提出一覧

works/scenes/scene_notesのCRUDはSupabaseクライアント(publishable key)から直接行う。

## DBスキーマ(実行済み。マイグレーション不要、参照用)
works        : id, title, description, style, created_at
scenes       : id, work_id, sort_order, prompt_text, dialogue, image_url
submissions  : id, work_id, student_name, essay, ai_summary, ai_score, ai_comment, created_at
scene_notes  : id, work_id, scene_id, student_name, body, created_at
chat_messages: id, work_id, scene_id, student_name, role, content, created_at

## 画像生成プロンプト骨格
「{works.style}。{promptText}。テキストや文字は画像に入れない。」
sizeは 1536x1024。

## AIプロンプト方針
- チャットsystem: 「あなたは小学生のアニメ考察を手伝う先生。答えを教えず、
  問いかけで考えを深めさせる。小学生に分かる言葉で、2〜3文で短く返す」
- 要約+採点: JSONのみ出力 { "summary": string, "score": 1-5, "comment": string }
  観点: 自分の考えがあるか / シーンを根拠にしているか / 感じたことを表現できているか
  commentは小学生向けの励ましトーン。

## 実装順(この順で。各ステップ動作確認してから次へ)
1. Next.js雛形 + モードトグル + Supabaseクライアント + 作品一覧
2. 先生: 作品作成 → シーン追加(画像なし、テキストのみで動作確認)
3. /api/scenes/generate 接続(最重要リスク。ここを最優先で疎通)
4. 生徒: 紙芝居ビューア(1枚ずつ送る) + シーンメモ
5. /api/chat(シーン文脈付きディスカッション)
6. 感想文提出 → 要約+採点表示
7. 先生: 提出一覧タブ
8. シーン並び替え(↑↓ボタンで実装。dnd-kitは時間があれば)

## 切り捨て済み(実装しない)
検索機能 / クラス別表示 / 認証 / レスポンシブ対応の作り込み