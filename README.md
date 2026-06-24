# AI Chat Agent

Chat interface with multiple AI models via OpenRouter, built with Next.js 16, TypeScript, Tailwind CSS v4, and MongoDB.

## Features

- **Multi-model chat** — Select between free OpenRouter models (Gemma, Qwen, Nemotron, etc.)
- **Conversation management** — Create, rename, and delete conversations from the sidebar
- **Markdown rendering** — Assistant responses render bold, lists, code blocks with copy button, blockquotes, tables, links, and raw HTML (`<br>`, `<b>`, etc.)
- **Code blocks with copy** — Fenced code blocks show a "Copiar" button on hover
- **Tables with horizontal scroll** — Wide tables scroll instead of breaking layout
- **Streaming responses** — Real-time token-by-token output with smooth layout animations
- **Responsive design** — Mobile-first: hides less essential info on small screens, adjusts bubble sizes, keeps sidebar overlay
- **Context & rate limit tracking** — Bottom bar shows token usage, context %, verbosity level, and daily request budget
- **Verbosity control** — Choose Baja/Media/Alta to control response length and stretch the free tier
- **Custom system prompt** — Set a role/personality per conversation (like Gemini Gems)
- **Dark/Light theme** — Toggle between dark and light mode, persisted in localStorage
- **File attachments** — Upload images (vision models), PDF, Excel, TXT, CSV. Images go as multimodal content; documents are parsed and sent as text context
- **Rate limit error handling** — Friendly error messages with suggestions when a model is rate-limited
- **Persistent storage** — Conversations saved to MongoDB Atlas
- **Custom scrollbars** — Thin WebKit + Firefox scrollbars matching the theme
- **Animations** — Spring sidebar, staggered list, fade/slide messages, loading dots, pulsing gradient focus ring

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # POST — send message + files to OpenRouter
│   │   ├── conversations/
│   │   │   ├── route.ts            # GET (list), POST (create)
│   │   │   └── [id]/route.ts       # GET, PUT, DELETE conversation
│   │   ├── models/route.ts         # GET — available free models with capabilities
│   │   └── upload/route.ts         # POST — file upload + text extraction
│   ├── globals.css                 # Tailwind v4 @theme + scrollbars + keyframes
│   ├── layout.tsx
│   └── page.tsx                    # Main page, state management
├── components/
│   ├── ChatInput.tsx               # Message input + attach button + file preview
│   ├── CodeBlock.tsx               # Code block with copy-to-clipboard
│   ├── Header.tsx                  # Top bar with menu, title + model name
│   ├── LoadingBar.tsx              # Thin animated bar during loading
│   ├── LoadingDots.tsx             # Bouncing dots animation
│   ├── LoadingScreen.tsx           # Full-screen spinner
│   ├── MessageBubble.tsx           # Single message with Markdown + file renders
│   ├── MessageList.tsx             # Scrollable list with auto-scroll + welcome
│   ├── ModelInfoBar.tsx            # Bottom bar: model, context %, verbosity, budget
│   ├── ModelSelector.tsx           # Reusable model dropdown
│   ├── SettingsPanel.tsx           # System prompt editor + theme toggle
│   ├── Sidebar.tsx                 # Collapsible conversation list + settings gear
│   └── WelcomeMessage.tsx          # Dynamic greeting when conversation is empty
├── hooks/
│   ├── useDebounce.ts              # Debounce hook (default 500ms)
│   └── useTheme.ts                 # Dark/light theme management
└── lib/
    ├── db.ts                       # MongoDB connection singleton
    ├── models.ts                   # Mongoose schemas (conversation, messages, files)
    ├── openrouter.ts               # OpenRouter API client (streaming + multimodal)
    ├── types.ts                    # TypeScript types + toConversation helper
    └── validation.ts               # Zod schemas for API validation
```

## Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
```

3. Start the dev server:

```bash
npm run dev
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations` | GET | List all conversations |
| `/api/conversations` | POST | Create a new conversation |
| `/api/conversations/:id` | GET | Get a conversation with messages |
| `/api/conversations/:id` | PUT | Update title, model, system prompt, or max tokens |
| `/api/conversations/:id` | DELETE | Delete a conversation |
| `/api/chat` | POST | Send a message (+ optional files) and get AI response |
| `/api/models` | GET | List available free models with context length and vision support |
| `/api/upload` | POST | Upload a file (image, PDF, Excel, TXT, CSV) and extract text |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables for dark/light theming
- **Database**: MongoDB + Mongoose
- **AI Provider**: OpenRouter (free models + multimodal)
- **Markdown**: react-markdown + remark-gfm + rehype-raw + rehype-sanitize
- **Animation**: Motion (Framer Motion v12)
- **Validation**: Zod
- **File parsing**: pdf-parse, xlsx
