import { NextRequest } from "next/server";
import { ATULYA_SYSTEM_PROMPT } from "@/lib/atulya-prompt";
import { demoReply } from "@/lib/demo-atulya";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function providerConfig() {
  const apiKey =
    process.env.ATULYA_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    "";
  const baseUrl =
    process.env.ATULYA_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";
  const model = process.env.ATULYA_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { apiKey, baseUrl: baseUrl.replace(/\/$/, ""), model };
}

function textStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chars = Array.from(text);
  const step = Math.max(2, Math.round(chars.length / 220));
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      if (i >= chars.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chars.slice(i, i + step).join("")));
      i += step;
      await new Promise((r) => setTimeout(r, 14));
    },
  });
}

export async function POST(req: NextRequest) {
  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.messages)) {
      messages = body.messages
        .filter((m: ChatMessage) => m && (m.role === "user" || m.role === "assistant"))
        .map((m: ChatMessage) => ({ role: m.role, content: String(m.content ?? "") }))
        .slice(-24);
    }
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  if (messages.length === 0) {
    return new Response("Kuch toh bolo! 😊", { status: 400 });
  }

  const { apiKey, baseUrl, model } = providerConfig();

  if (!apiKey) {
    return new Response(textStream(demoReply(messages)), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Atulya-Mode": "demo",
      },
    });
  }

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.85,
        messages: [
          { role: "system", content: ATULYA_SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const fallback = demoReply(messages);
      return new Response(textStream(fallback), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Atulya-Mode": "demo",
          "X-Atulya-Error": String(upstream.status),
        },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = upstream.body.getReader();
    let buffer = "";

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let out = "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") out += delta;
          } catch {
            // ignore malformed chunks
          }
        }
        if (out) controller.enqueue(encoder.encode(out));
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Atulya-Mode": "live",
      },
    });
  } catch {
    return new Response(textStream(demoReply(messages)), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Atulya-Mode": "demo",
      },
    });
  }
}
