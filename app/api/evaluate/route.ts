import { NextResponse } from "next/server";

const dimensions = ["场景匹配度", "风格一致性", "身材适配度", "色彩协调性", "用户需求满足度"] as const;
const schema = {
  type: "object", additionalProperties: false, required: ["scores", "outfit", "visualEvidence"],
  properties: {
    scores: { type: "array", minItems: 5, maxItems: 5, items: {
      type: "object", additionalProperties: false,
      required: ["name", "value", "reason", "advice", "confidence"],
      properties: {
        name: { type: "string", enum: dimensions }, value: { type: "integer", minimum: 0, maximum: 100 },
        reason: { type: "string" }, advice: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 },
      },
    }},
    outfit: { type: "object", additionalProperties: false, required: ["title", "summary", "items", "modelExplanation"], properties: {
      title: { type: "string" }, summary: { type: "string" }, modelExplanation: { type: "string" },
      items: { type: "array", maxItems: 8, items: { type: "object", additionalProperties: false, required: ["name", "detail"], properties: {
        name: { type: "string" }, detail: { type: "string" },
      }}},
    }},
    visualEvidence: { type: "array", maxItems: 10, items: { type: "string" } },
  },
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "服务端尚未配置 OPENAI_API_KEY" }, { status: 503 });
    const input = await request.json();
    if (!input.imageDataUrl || !String(input.imageDataUrl).startsWith("data:image/")) {
      return NextResponse.json({ error: "请上传有效的 JPG、PNG 或 WEBP 图片" }, { status: 400 });
    }

    const model = process.env.OPENAI_VISION_MODEL || "gpt-5.6-terra";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    const prompt = `你是 AI 穿搭产品的资深模型评测员。根据图片中可直接观察到的服装证据，评估穿搭与用户需求的匹配质量。
用户画像：${input.profile || "未提供"}
年龄：${input.age || "未提供"}；身高：${input.height ? `${input.height}cm` : "未提供"}
风格偏好：${Array.isArray(input.styles) ? input.styles.join("、") : "未提供"}；使用场景：${input.scene || "未提供"}

按以下规则评分：场景匹配看正式度、活动与实用性；风格一致性看可见单品与正负偏好；身材适配只评价可观察到的衣长、腰线、松量和视觉比例，不推断被遮挡的身体数据；色彩协调看主辅色、色温、明度和饱和度；需求满足度综合判断明确诉求的覆盖。
每个分数必须引用图片证据和用户需求证据。证据不足时降低 confidence 并明确说明。不得虚构材质、品牌、季节或身体特征。建议必须具体到单品、版型、颜色或搭配调整。`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model, reasoning: { effort: "low" },
        input: [{ role: "user", content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: input.imageDataUrl, detail: "original" },
        ]}],
        text: { format: { type: "json_schema", name: "fashion_evaluation", strict: true, schema } },
        max_output_tokens: 3000,
      }),
    });
    clearTimeout(timeout);
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "OpenAI API 请求失败" }, { status: response.status });
    const outputText = payload.output
      ?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content || [])
      .find((content: { type?: string }) => content.type === "output_text")?.text;
    if (!outputText) return NextResponse.json({ error: "模型未返回可解析的评测结果" }, { status: 502 });
    return NextResponse.json({ taskId: `TASK-${Date.now()}`, status: "completed", model, mock: false, ...JSON.parse(outputText) });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "视觉分析超时，请压缩图片后重试" : error instanceof Error ? error.message : "评测服务异常";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
