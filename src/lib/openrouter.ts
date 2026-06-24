const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-nano-30b-a3b:free";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type Message = { role: "user" | "assistant" | "system"; content: string | ContentPart[] };

type CompletionParams = {
  messages: Message[];
  model?: string;
  maxTokens?: number;
};

type CompletionResult = {
  content: string;
  tokensUsed: number;
  model: string;
};

async function requestCompletion(
  params: CompletionParams,
  stream: boolean,
): Promise<Response> {
  const { messages, model = OPENROUTER_MODEL, maxTokens = 1024 } = params;
  return fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI Chat Agent",
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: maxTokens,
      stream,
    }),
  });
}

async function handleErrorResponse(response: Response) {
  const errorBody = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(errorBody);
  } catch {
    /* not JSON */
  }

  const err = parsed?.error as Record<string, unknown> | undefined;
  const providerName = (err?.metadata as Record<string, unknown> | undefined)
    ?.provider_name as string | undefined;

  if (response.status === 429) {
    throw new Error(
      `El proveedor ${providerName ? `"${providerName}"` : "del modelo"} ha restringido temporalmente el acceso. Esperá unos minutos o probá con otro modelo.`,
    );
  }

  throw new Error(`Error del proveedor: ${err?.message ?? errorBody}`);
}

export function createCompletionStream(
  params: CompletionParams,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const response = await requestCompletion(params, true);
      if (!response.ok) {
        const errorBody = await response.text();
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: errorBody }) + "\n"));
        controller.close();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: "Sin respuesta del stream" }) + "\n"));
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(JSON.stringify({ type: "token", content: delta }) + "\n"));
              }

              const finishReason = parsed.choices?.[0]?.finish_reason;
              if (finishReason === "error") {
                const errMsg = parsed.choices?.[0]?.error?.message ?? "Error del proveedor";
                controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: errMsg }) + "\n"));
              }

              if (finishReason === "stop" || finishReason === "length" || finishReason === "content_filter") {
                const metadata = {
                  type: "done" as const,
                  tokensUsed: parsed.usage?.total_tokens ?? 0,
                  model: parsed.model ?? "",
                  finishReason,
                };
                controller.enqueue(encoder.encode(JSON.stringify(metadata) + "\n"));
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: "Error leyendo el stream" }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });
}

export async function createCompletion(
  params: CompletionParams,
): Promise<CompletionResult> {
  const response = await requestCompletion(params, false);

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  const choiceError = choice?.error as Record<string, unknown> | undefined;
  if (choiceError) {
    throw new Error(
      `Error del proveedor: ${(choiceError.message as string) ?? "error desconocido"}`,
    );
  }

  const content = choice?.message?.content;

  if (content == null) {
    const finishReason = choice?.finish_reason;
    const refusal = choice?.message?.refusal;

    console.error("OpenRouter null content response:", JSON.stringify(data, null, 2));

    if (refusal) {
      throw new Error(`El modelo rechazó responder: ${refusal}`);
    }

    const reasonMessages: Record<string, string> = {
      content_filter: "El contenido fue filtrado por las políticas de seguridad del modelo.",
      error: "El proveedor devolvió un error. Probá con otro modelo.",
      length: "El modelo excedió el límite de tokens sin completar la respuesta. Intentá de nuevo.",
    };

    throw new Error(
      reasonMessages[finishReason as string] ??
        "El modelo no generó una respuesta. Intentá de nuevo o cambiá de modelo.",
    );
  }

  return {
    content,
    tokensUsed: data.usage?.total_tokens ?? 0,
    model: data.model,
  };
}
