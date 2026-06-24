import { NextResponse } from "next/server";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function GET() {
  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`OpenRouter error ${res.status}`);
    }

    const data = await res.json();

    const freeModels: { id: string; name: string; contextLength: number; supportsVision: boolean }[] = (
      data.data ?? []
    )
      .filter((m: { id: string }) => m.id.endsWith(":free"))
      .map((m: { id: string; name: string; context_length: number; capabilities?: { vision?: boolean } }) => ({
        id: m.id,
        name: m.name,
        contextLength: m.context_length ?? 8192,
        supportsVision: m.capabilities?.vision ?? false,
      }))
      .sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name),
      );

    return NextResponse.json(freeModels);
  } catch (error) {
    console.error("GET /api/models error:", error);
    return NextResponse.json(
      { error: "Error al obtener modelos" },
      { status: 500 },
    );
  }
}
