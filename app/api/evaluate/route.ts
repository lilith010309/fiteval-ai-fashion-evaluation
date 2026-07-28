import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const input = await request.json();
  // LLM 接入预留：将 input 转发给模型服务，并要求返回结构化 scores / outfit。
  // 生产环境建议在此加入鉴权、超时、重试、可观测性与 PII 脱敏。
  return NextResponse.json({
    taskId: `TASK-${Date.now()}`,
    status: "completed",
    model: process.env.STYLE_MODEL_NAME ?? "StyleMind-v2.4-mock",
    mock: true,
    input,
    scores,
  });
}

const scores = [
  { dimension: "scene_match", score: 86 },
  { dimension: "style_consistency", score: 92 },
  { dimension: "body_fit", score: 74 },
  { dimension: "color_harmony", score: 89 },
  { dimension: "need_fulfillment", score: 83 },
];
