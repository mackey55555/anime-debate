export type Work = {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  created_at: string;
};

export type Scene = {
  id: string;
  work_id: string;
  sort_order: number;
  prompt_text: string | null;
  dialogue: string | null;
  image_url: string | null;
};

export type Submission = {
  id: string;
  work_id: string;
  student_name: string;
  essay: string;
  ai_summary: string | null;
  ai_score: number | null;
  ai_comment: string | null;
  created_at: string;
};

export type SceneNote = {
  id: string;
  work_id: string;
  scene_id: string;
  student_name: string;
  body: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  work_id: string;
  scene_id: string | null;
  student_name: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};
