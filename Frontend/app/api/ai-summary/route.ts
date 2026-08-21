import { NextResponse } from "next/server";
import OpenAI from "openai";
export async function POST(request: Request) {
  const { village, context } = await request.json();
  const fallback = `For ${village}: ${context} Prioritize a local health-worker visit, share the advisory in local language, and review new reports tomorrow. This is decision support, not a clinical diagnosis.`;
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ summary: fallback, provider: "demo" });
  try { const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); const completion = await openai.chat.completions.create({ model:"gpt-4o-mini", messages:[{role:"system",content:"Write concise, plain-language public health response guidance. Never diagnose. No chemical readings."},{role:"user",content:`Village: ${village}. Context: ${context}`}], max_tokens:120 }); return NextResponse.json({summary:completion.choices[0]?.message.content ?? fallback,provider:"openai"}); }
  catch { return NextResponse.json({summary:fallback,provider:"fallback"}); }
}
