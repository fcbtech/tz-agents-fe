# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tz-agents-fe** is the frontend for an AI-powered Purchase Order creation assistant. It provides a chat interface where users converse with an AI agent to progressively build POs, with real-time streaming responses, @ mention autocomplete for TranZact master data, and a live PO preview panel.

- React 19 SPA
- TanStack Router (file-based routing)
- Vite 7 + TypeScript 5.7
- Tailwind CSS v4 + shadcn/ui
- Bun as package manager and runtime

## Commands

```bash
# Install dependencies
bun install

# Dev server (port 3000)
bun --bun run dev

# Production build
bun --bun run build

# Preview production build
bun --bun run preview

# Run all tests (Vitest)
bun --bun run test

# Run a single test file
bunx vitest run src/path/to/test.test.ts

# Lint
bun run lint

# Format check
bun run format

# Auto-fix lint + format
bun run check
```

## Directory Structure

```
tz-agents-fe/
├── src/
│   ├── main.tsx                         # Entry point — creates router, mounts to #app
│   ├── routeTree.gen.ts                 # AUTO-GENERATED — DO NOT EDIT
│   ├── index.css                        # Global styles, Tailwind theme (OKLCH CSS vars)
│   ├── routes/                          # TanStack Router file-based routes
│   │   ├── __root.tsx                   # Root layout (global styles, Outlet, devtools)
│   │   ├── index.tsx                    # Chat page "/" (auth-protected)
│   │   └── login.tsx                    # Login page
│   ├── components/
│   │   ├── ui/                          # shadcn/ui primitives (button, card, input, etc.)
│   │   ├── chat/                        # Chat interface components
│   │   │   ├── ChatContainer.tsx        # Main split-screen layout (chat + PO panel)
│   │   │   ├── MessageList.tsx          # Message display with streaming + auto-scroll
│   │   │   ├── MessageBubble.tsx        # Individual message (user/assistant)
│   │   │   ├── ClarificationCard.tsx    # Clarification prompt with option buttons
│   │   │   ├── SubmitResultCard.tsx     # PO submission success/failure display
│   │   │   ├── POPreviewPanel.tsx       # Right-side live PO draft preview
│   │   │   ├── MentionChip.tsx          # Colored badge for @mentions
│   │   │   └── TypingIndicator.tsx      # Animated typing dots
│   │   ├── input/                       # Chat input components
│   │   │   ├── ChatInput.tsx            # Tiptap editor with @mention support
│   │   │   ├── MentionExtension.ts      # Custom Tiptap mention extension config
│   │   │   └── MentionDropdown.tsx      # Two-phase @mention dropdown
│   │   └── Header.tsx                   # Top nav with sidebar toggle
│   └── lib/
│       ├── store/                       # Zustand state stores
│       │   ├── chat-store.ts            # Chat messages, streaming state, PO draft
│       │   └── auth-store.ts            # Auth tokens (persisted to localStorage)
│       ├── api/                         # API layer
│       │   ├── axios.ts                 # Axios instances with auth interceptors
│       │   ├── auth.ts                  # Login, token refresh, expiry checks
│       │   └── sse.ts                   # SSE streaming async generator
│       ├── hooks/                       # Custom React hooks
│       │   ├── useChat.ts              # Chat send, SSE event handling, actions
│       │   └── useMentionSearch.ts     # Debounced master data search (300ms)
│       ├── types/                       # TypeScript type definitions
│       │   ├── chat.ts                  # Mention, ClarificationPayload, ChatMessage
│       │   ├── auth.ts                  # AuthResponse, LoginPayload
│       │   ├── documents.ts             # PODraft and all nested PO field interfaces
│       │   └── master-data.ts           # MasterDataItem, MasterDataCategory
│       ├── constants/index.ts           # API_BASE_URL, ENTITY_TYPE_LABELS
│       └── utils/index.ts              # cn() — clsx + tailwind-merge
├── index.html                           # HTML entry, mounts to #app
├── vite.config.ts                       # Vite plugins (TanStack Router, Tailwind, etc.)
├── tsconfig.json                        # TypeScript config (strict, path aliases)
├── prettier.config.js                   # No semicolons, single quotes, trailing commas
├── eslint.config.js                     # Extends @tanstack/eslint-config
└── components.json                      # shadcn/ui config (new-york style, lucide icons)
```

## Architecture

### Routing

File-based routing via `@tanstack/router-plugin`. Routes live in `src/routes/` and map directly to URL paths:

- `src/routes/__root.tsx` — Root layout (imports global styles, renders `<Outlet />` + devtools)
- `src/routes/index.tsx` — Chat page `/` (protected — redirects to `/login` if not authenticated)
- `src/routes/login.tsx` — Login page
- New routes: add a `.tsx` file in `src/routes/` and the plugin auto-generates `src/routeTree.gen.ts`

**Do not manually edit `src/routeTree.gen.ts`** — it is auto-generated by the TanStack Router Vite plugin.

### State Management (Zustand)

Two stores, both in `src/lib/store/`:

**`chat-store.ts`** — Primary chat state:

- `sessionId`, `messages[]`, `isStreaming`, `streamingContent`, `error`
- PO state: `poDraft`, `poReady`, `poSubmitted`
- Actions: `addUserMessage()`, `appendStreamingContent()`, `finalizeStreaming()`, `updatePODraft()`, `reset()`, etc.
- Enabled with Zustand devtools middleware

**`auth-store.ts`** — Auth state (persisted to localStorage with key `tz-auth`):

- `accessToken`, `refreshToken`, `isAuthenticated`
- Actions: `setTokens()`, `logout()`

### Chat UI Flow

```
User types message + @mentions in ChatInput (Tiptap editor)
  → useChat.sendMessage() extracts text & mentions from Tiptap JSON
  → streamSSE('/api/chat', { session_id, message, mentions })
  → SSE events update Zustand store in real-time:
      token       → appendStreamingContent() → MessageList shows streaming text
      clarification → ClarificationCard renders with option buttons
      draft_update → updatePODraft() → POPreviewPanel updates progressively
      preview     → setPOReady(true) → confirm button appears
      submit_result → SubmitResultCard shows success/failure
      done        → finalizeStreaming() → move streaming text to messages array
```

### Component Layout

```
ChatContainer (split-screen)
├── Left side (chat)
│   ├── MessageList
│   │   ├── MessageBubble (user messages with MentionChips)
│   │   ├── MessageBubble (assistant messages, rendered as Markdown)
│   │   ├── ClarificationCard (when agent asks for clarification)
│   │   ├── SubmitResultCard (after PO submission)
│   │   └── TypingIndicator (during streaming)
│   └── ChatInput (Tiptap editor)
│       ├── MentionExtension (@ trigger, tippy popup)
│       └── MentionDropdown (category list → search results)
└── Right side (conditional, shown when poDraft !== null)
    └── POPreviewPanel (live PO draft with line items table)
```

### @ Mention System

Two-phase dropdown implemented in `MentionDropdown.tsx`:

1. **Phase 1 — Category selection**: User types `@` → dropdown shows 12 categories (Counterparties, Items, Tax, etc.) with a filter input. All keyboard input is intercepted via Tiptap's imperative `onKeyDown` handler to prevent characters from going to the editor.
2. **Phase 2 — Search within category**: User selects a category → `useMentionSearch` hook fires debounced API calls to `GET /api/master/{entityType}?q={query}`. Results shown in a scrollable list.

The `MentionExtension.ts` configures the Tiptap mention extension with custom attributes (`category`, `metadata`) and renders the dropdown via `ReactRenderer` + tippy.js.

`ChatInput.tsx` extracts mentions from the Tiptap JSON AST via `extractMentions()` and sends them as structured `Mention[]` alongside the message text.

### API Layer

**Axios** (`lib/api/axios.ts`):

- `apiClient` — Main API instance pointing to backend (default `localhost:8000`)
- `authClient` — Separate instance for auth endpoints
- Request interceptor: Injects `Authorization: Bearer {token}` header
- Response interceptor: Auto-refreshes token on 401, retries request once, logs out on failure

**SSE Streaming** (`lib/api/sse.ts`):

- `streamSSE()` — Async generator using `fetch()` with streaming response body
- Parses SSE format (`event:` + `data:` lines), yields `{ event, data }` objects
- Handles 401 auto-refresh + retry

**Token Management** (`lib/api/auth.ts`):

- `getValidToken()` — Returns valid token, proactively refreshes if expiring within 60s
- `refreshAccessToken()` — Deduplicates concurrent refresh calls via shared promise
- JWT expiry decoded from token payload

### Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **shadcn/ui** components (new-york style) in `src/components/ui/`
- **Theme**: CSS custom properties using OKLCH color space with light + dark mode support
- **Icons**: `lucide-react`
- **Global styles**: `src/index.css` (Tailwind imports, theme vars, Tiptap mention chip styles)

## Code Style

- **No semicolons**, single quotes, trailing commas everywhere (Prettier config)
- ESLint extends `@tanstack/eslint-config`
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Path alias: `@/*` maps to `./src/*`

## Key Configuration

- **Router preloading**: `defaultPreload: 'intent'` (preloads routes on hover)
- **Auto code-splitting**: enabled via `autoCodeSplitting: true` in the router plugin
- **VSCode**: `routeTree.gen.ts` is excluded from search/watch and marked read-only

## Key Patterns to Follow

- **Streaming state**: `streamingContent` is held separately in the store, only moved to `messages[]` on the `done` event via `finalizeStreaming()`
- **PO draft updates**: Backend sends partial drafts via `draft_update` events; frontend merges them with spread (`{ ...existing, ...new }`)
- **Keyboard capture in MentionDropdown**: All keystrokes are intercepted via the imperative `onKeyDown` handler (returns `true` to block Tiptap). The search/filter inputs are `readOnly` — state is managed programmatically.
- **ScrollArea max-height**: Apply `max-h` to the Viewport, not the Root — use `[&_[data-slot=scroll-area-viewport]]:max-h-*` class on the `<ScrollArea>` component.
