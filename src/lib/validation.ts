import { z } from "zod";

const fileSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
  extractedText: z.string().optional(),
});

export const chatBodySchema = z.object({
  conversationId: z.string().min(1, "conversationId es requerido").nullable().optional(),
  message: z.string().min(1, "El mensaje no puede estar vacío").max(10000, "Mensaje demasiado largo"),
  files: z.array(fileSchema).optional(),
  supportsVision: z.boolean().optional(),
});

export const createConversationSchema = z.object({}).optional();

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.string().min(1).max(200).optional(),
  maxCompletionTokens: z.number().int().min(1).max(131072).optional(),
  systemPrompt: z.string().max(10000).optional(),
});

export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
