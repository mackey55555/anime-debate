# 🎬 アニメ考察ひろば

小学生の「読書感想文」を **アニメ考察** に置き換える教育アプリ。

先生がシーンカード（画像＋セリフ）で紙芝居アニメを作り、
生徒が視聴 → 考察メモ → AIディスカッション を経て感想文を提出。
先生はAIによる要約＋採点付きで提出物を確認できます。

> ハッカソン用プロジェクト。認証なし・エラーハンドリング最小限のシンプル構成です。

---

## ✨ 主な機能

| 役割 | できること |
|------|-----------|
| 👨‍🏫 先生 | 作品作成 / シーン追加 / AI画像生成 / シーン並び替え / 提出一覧・採点確認 |
| 🎒 生徒 | 紙芝居ビューア / シーンごとの考察メモ / AIとのディスカッション / 感想文提出 |

ヘッダーの **先生 / 生徒** トグルでモードを切り替えます（React Context + localStorage で保持）。

---

## 🛠 技術構成

- **フレームワーク**: Next.js 15（App Router）+ TypeScript
- **スタイル**: Tailwind CSS
- **DB / ストレージ**: Supabase（Postgres + Storage バケット `scenes`）
- **AI（テキスト）**: Claude API（`claude-sonnet-4-6`）… ディスカッション / 要約＋採点
- **AI（画像）**: OpenAI API（`gpt-image-1`）… シーン画像生成
- **認証**: なし（RLS全開放）。生徒名は初回に localStorage 保存

AIキーを使う処理のみ、Next.js の API ルート（サーバー側）に隔離しています。

---

## 🚀 セットアップと起動

### 前提

- Node.js 18 以上（推奨: 20+ / 動作確認は v24）
- Supabase プロジェクト
- OpenAI APIキー / Anthropic APIキー

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクト直下に `.env.local` を作成し、以下を設定します（**Gitには含めないこと**。`.gitignore`済み）。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx   # publishable(anon)キー
OPENAI_API_KEY=sk-proj-xxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

> Supabaseキーは **publishable（anon）キーのみ** 使用します（RLS全開放前提）。

### 3. データベース & ストレージの初期化

Supabase ダッシュボード → **SQL Editor** に以下を貼り付けて **Run** してください。
テーブル5つ・RLS開放・`scenes` バケット（public）・ストレージポリシー を一括で作成します。

```sql
-- 1) テーブル
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  style text,
  created_at timestamptz not null default now()
);
create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  sort_order int not null default 0,
  prompt_text text,
  dialogue text,
  image_url text
);
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  student_name text not null,
  essay text not null,
  ai_summary text,
  ai_score int,
  ai_comment text,
  created_at timestamptz not null default now()
);
create table if not exists public.scene_notes (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  scene_id uuid not null references public.scenes(id) on delete cascade,
  student_name text not null,
  body text,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete cascade,
  student_name text not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 2) RLS全開放（anon/publishableキーで読み書き可）
do $$
declare t text;
begin
  foreach t in array array['works','scenes','submissions','scene_notes','chat_messages']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "%s_all" on public.%I;', t, t);
    execute format(
      'create policy "%s_all" on public.%I for all to anon, authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;

-- 3) Storage バケット `scenes`（public）
insert into storage.buckets (id, name, public)
values ('scenes', 'scenes', true)
on conflict (id) do update set public = true;

-- 4) Storageへの匿名アクセス許可
drop policy if exists "scenes_public_read" on storage.objects;
drop policy if exists "scenes_anon_insert" on storage.objects;
drop policy if exists "scenes_anon_update" on storage.objects;
create policy "scenes_public_read" on storage.objects for select using (bucket_id = 'scenes');
create policy "scenes_anon_insert" on storage.objects for insert with check (bucket_id = 'scenes');
create policy "scenes_anon_update" on storage.objects for update using (bucket_id = 'scenes');
```

### 4. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

---

## 📖 使い方

1. ヘッダー右の **👨‍🏫 先生** を選択
2. トップの **＋ 作品をつくる** → タイトル・説明・画風を入力して作成
3. シーン編集画面で **絵の説明（プロンプト）** と **セリフ** を入力し「＋ シーンを追加」
4. 各シーンの **🎨 画像を生成** を押すと gpt-image-1 が画像を作成（30〜60秒ほど）
5. ヘッダーの **🎒 生徒** に切り替え → 作品を開いて紙芝居を視聴・考察・提出

---

## 🗂 ディレクトリ構成

```
app/
  page.tsx                      作品一覧（トップ / 両モード共通の入口）
  layout.tsx                    共通レイアウト（ヘッダー + モードProvider）
  globals.css
  teacher/works/new/page.tsx    先生: 作品作成
  teacher/works/[id]/page.tsx   先生: シーン編集（追加・画像生成）+ 提出一覧タブ
  works/[id]/page.tsx           生徒: 紙芝居ビューア + メモ + AIチャット   ※実装予定
  works/[id]/submit/page.tsx    生徒: 感想文の提出                        ※実装予定
  api/
    scenes/generate/route.ts    画像生成（gpt-image-1 → Storage → URL保存）
    chat/route.ts               AIディスカッション                        ※実装予定
    submissions/route.ts        感想文の要約+採点                         ※実装予定
    works/[id]/submissions/     先生用 提出一覧取得                        ※実装予定
components/
  Header.tsx                    ヘッダー + 先生/生徒トグル
  ModeContext.tsx               モード・生徒名の状態（Context + localStorage）
lib/
  supabase.ts                   Supabaseクライアント（publishableキー）
  types.ts                      DBの型定義
```

---

## 🔌 APIルート

| メソッド / パス | 役割 |
|---|---|
| `POST /api/scenes/generate` | `works.style` を前置したプロンプトで gpt-image-1 を呼び出し、画像を `scenes` バケットへ保存して public URL を `scenes.image_url` に格納 |
| `POST /api/chat` ※予定 | 作品・全シーン文脈付きで Claude を呼び出し、会話を `chat_messages` に保存 |
| `POST /api/submissions` ※予定 | 感想文を保存後、Claude で要約＋採点（JSON）を生成して格納 |
| `GET /api/works/[id]/submissions` ※予定 | 先生用の提出一覧取得 |

### 画像生成の仕様

- プロンプト骨格: `「{works.style}。{promptText}。テキストや文字は画像に入れない。」`
- サイズ: `1536x1024`
- `organization must be verified` エラー時のみ `dall-e-3`（`1792x1024`）へ自動フォールバック
- `b64_json` → `Buffer` → Storage `scenes` バケットへアップロード。**DBには public URL のみ保存**（base64は保存しない）

---

## ✅ 実装状況

SPEC.md の実装順に沿って進めています。

- [x] 1. Next.js雛形 + モードトグル + Supabaseクライアント + 作品一覧
- [x] 2. 先生: 作品作成 → シーン追加（テキスト）
- [x] 3. `/api/scenes/generate` 画像生成（**疎通確認済み**）
- [ ] 4. 生徒: 紙芝居ビューア + シーンメモ
- [ ] 5. `/api/chat`（シーン文脈付きディスカッション）
- [ ] 6. 感想文提出 → 要約+採点表示
- [ ] 7. 先生: 提出一覧タブ
- [ ] 8. シーン並び替え

---

## 🧯 トラブルシューティング

**作品作成で `violates row-level security policy` が出る**
→ 上記セットアップSQLの「2) RLS全開放」が未実行です。SQL Editor で再実行してください。

**`Could not find the table 'public.works'` が出る**
→ スキーマ未適用です。セットアップSQLを実行してください（実行後PostgRESTが自動でスキーマを再読込します）。

**画像生成で `organization must be verified` が出る**
→ OpenAI組織が未認証です。自動で `dall-e-3` にフォールバックしますが、gpt-image-1 を使う場合は OpenAI 側で組織認証を行ってください。

**画像が表示されない / アップロードに失敗する**
→ `scenes` バケットが存在し public になっているか、ストレージポリシーが適用されているか確認してください（セットアップSQLの 3・4）。

---

## 📦 npm スクリプト

```bash
npm run dev     # 開発サーバー
npm run build   # 本番ビルド
npm run start   # 本番サーバー
npm run lint    # Lint
```
