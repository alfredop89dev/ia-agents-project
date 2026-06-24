import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Conversation } from "@/lib/models";
import { createConversationSchema } from "@/lib/validation";

export async function GET() {
  try {
    await connectDB();
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .select("title messages model tokensUsed maxTokens createdAt updatedAt")
      .lean();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }

    const conversation = await Conversation.create({
      title: body.title ?? "Chat nuevo",
      model: body.model ?? "nvidia/nemotron-3-nano-30b-a3b:free",
      messages: body.messages ?? [],
    });
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json(
      { error: "Error al crear conversación" },
      { status: 500 },
    );
  }
}
