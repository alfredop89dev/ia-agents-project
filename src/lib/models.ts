import mongoose, { Schema } from "mongoose";

export interface IConversationData {
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  model: string;
  tokensUsed: number;
  maxTokens: number;
}

const FileSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  extractedText: { type: String, default: "" },
});

const MessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    files: [FileSchema],
  },
);

const ConversationSchema = new Schema(
  {
    title: { type: String, required: true, default: "Chat nuevo" },
    messages: [MessageSchema],
    model: { type: String, default: "nvidia/nemotron-3-nano-30b-a3b:free" },
    tokensUsed: { type: Number, default: 0 },
    maxTokens: { type: Number, default: 8192 },
    maxCompletionTokens: { type: Number, default: 2048 },
    systemPrompt: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Conversation =
  mongoose.models.Conversation ??
  mongoose.model("Conversation", ConversationSchema);
