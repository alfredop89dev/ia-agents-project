import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Conversation } from "@/lib/models";
import { createCompletionStream } from "@/lib/openrouter";
import type { Message as OpenRouterMessage } from "@/lib/openrouter";
import { chatBodySchema } from "@/lib/validation";
import { readFile } from "fs/promises";
import path from "path";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function isImage(mime: string) {
  return IMAGE_TYPES.includes(mime);
}

async function buildUserContent(text: string, files: { name: string; url: string; type: string; size: number; extractedText?: string }[], supportsVision: boolean) {
  const imageParts: { type: "image_url"; image_url: { url: string } }[] = [];
  let extraText = "";

  for (const file of files) {
    if (isImage(file.type)) {
      if (supportsVision) {
        const filepath = path.join(process.cwd(), "public", file.url);
        const buffer = await readFile(filepath);
        const base64 = buffer.toString("base64");
        imageParts.push({ type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } });
      } else {
        extraText += `\n[Imagen adjunta: ${file.name}]`;
      }
    } else if (file.extractedText) {
      extraText += `\n\n--- Contenido de "${file.name}" ---\n${file.extractedText}`;
    }
  }

  if (imageParts.length === 0) {
    return text + extraText;
  }

  const parts: { type: "text"; text: string }[] = [];
  const fullText = text + extraText;
  if (fullText) parts.push({ type: "text", text: fullText });

  return [...parts, ...imageParts];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = chatBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }

    const { conversationId, message, files = [] } = parsed.data;

    await connectDB();

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return NextResponse.json(
          { error: "Conversación no encontrada" },
          { status: 404 },
        );
      }
    } else {
      conversation = await Conversation.create({
        title: "Chat nuevo",
        messages: [],
      });
    }

    const userContent = files.length > 0
      ? await buildUserContent(message.trim(), files, parsed.data.supportsVision ?? false)
      : message.trim();

    const userMsgData: Record<string, unknown> = { role: "user", content: userContent };
    if (files.length > 0) {
      userMsgData.files = files.map((f) => ({
        name: f.name,
        url: f.url,
        type: f.type,
        size: f.size,
        extractedText: f.extractedText ?? "",
      }));
    }
    conversation.messages.push(userMsgData);

    const apiMessages: OpenRouterMessage[] = [];
    if (conversation.systemPrompt) {
      apiMessages.push({ role: "system", content: conversation.systemPrompt });
    }
    apiMessages.push(
      ...conversation.messages.map((m: { role: string; content: unknown }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    );

    const stream = createCompletionStream({
      messages: apiMessages,
      model: conversation.model,
      maxTokens: conversation.maxCompletionTokens,
    });

    const responseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullContent = "";
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(Boolean);

            for (const line of lines) {
              try {
                const event = JSON.parse(line);

                if (event.type === "token") {
                  fullContent += event.content;
                  controller.enqueue(
                    encoder.encode(JSON.stringify({ type: "token", content: event.content }) + "\n"),
                  );
                } else if (event.type === "done") {
                  const model = conversation.model;
                  const assistantMessage = { role: "assistant" as const, content: fullContent };
                  conversation.messages.push(assistantMessage);
                  conversation.tokensUsed = event.tokensUsed ?? 0;

                  if (!conversation.title || conversation.title === "Chat nuevo") {
                    conversation.title =
                      message.trim().slice(0, 40) + (message.trim().length > 40 ? "…" : "");
                  }

                  await conversation.save();

                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "done",
                        id: conversation._id.toString(),
                        tokensUsed: conversation.tokensUsed,
                        model,
                        title: conversation.title,
                      }) + "\n",
                    ),
                  );
                } else if (event.type === "error") {
                  controller.enqueue(
                    encoder.encode(JSON.stringify({ type: "error", message: event.message }) + "\n"),
                  );
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "error", message: "Error procesando el stream" }) + "\n"),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    const message = error instanceof Error ? error.message : "Error al procesar mensaje";
    const status =
      message.includes("restringido temporalmente") || message.includes("rate limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
