# Context Prime — Agent Continuity Document

This document tracks development progress and key decisions for future agents picking up this project.

---

## Project Overview

**Infinite Mirror** is a web app that demonstrates iterative image drift. Users upload an image, and the app uses OpenAI's image model to "faithfully recreate" it multiple times in sequence. Each output becomes the input for the next iteration, showing how AI recreation introduces cumulative drift.

---

## Session Log

### Session 1 — April 8, 2026

**Agent:** Claude Opus 4.5

**Work Completed:**
1. Reviewed original spec.md with user
2. Identified critical issue: OpenAI DALL-E 3 doesn't support image input
3. Researched OpenAI API — confirmed gpt-image-1 supports images.edit endpoint
4. Discussed and resolved architecture decisions with user
5. Created Next.js 16 project with TypeScript and Tailwind
6. Wrote updated spec.md reflecting all decisions
7. Created this context-prime.md file

**Key Decisions Made:**
- **No server storage**: All images stored client-side in IndexedDB
- **No database**: No Supabase, no Postgres — pure client-side app
- **Client-orchestrated generation**: Each iteration is a separate API call from client
- **Demo fixture**: Pre-generated run checked into /public/demo/ for instant demo
- **Single API route**: Only /api/generate for proxying OpenAI calls
- **gpt-image-1**: Using images.edit endpoint for image-to-image generation
- **11 iterations default**: 1 original + 10 generated
- **1024×1024**: Fixed image size
- **4MB max upload**: Reasonable limit for public app
- **GIF export**: Included in MVP
- **Both comparison modes**: Draggable slider (priority) + side-by-side

**What's Next:**
- Set up project structure (lib/, components/, hooks/)
- Create TypeScript types
- Build IndexedDB storage layer
- Create demo fixture
- Build UI components starting with Filmstrip
- Add OpenAI API route
- Wire up generation loop

---

## Architecture Quick Reference

```
Browser (Client)                    Server (Next.js API)
     │                                      │
     │  1. User uploads image               │
     │  2. Store in IndexedDB               │
     │                                      │
     │  3. POST /api/generate ─────────────►│
     │     { imageBase64, prompt }          │
     │                                      │  4. Call OpenAI images.edit
     │  5. Receive result ◄────────────────│
     │  6. Store in IndexedDB               │
     │                                      │
     │  7. Repeat 3-6 for each iteration    │
     │                                      │
```

**No database. No server storage. Images live in browser IndexedDB.**

---

## File Structure (Target)

```
/src
  /app
    page.tsx                    # Main page
    layout.tsx                  # Root layout
    /api/generate/route.ts      # OpenAI proxy
  /components
    Filmstrip.tsx
    ComparisonSlider.tsx
    SideBySide.tsx
    GridView.tsx
    ImageViewer.tsx
    UploadForm.tsx
    DemoButton.tsx
    ProgressIndicator.tsx
  /lib
    db.ts                       # IndexedDB operations
    openai.ts                   # API helpers
    types.ts                    # TypeScript interfaces
    constants.ts                # Prompts, defaults
    gif.ts                      # GIF generation
  /hooks
    useRun.ts                   # Run state management
    useGeneration.ts            # Generation orchestration
/public
  /demo
    run.json
    iteration-000.png ... iteration-010.png
```

---

## Key Technical Notes

### OpenAI API Usage

```typescript
// Using images.edit endpoint with gpt-image-1
const response = await openai.images.edit({
  model: "gpt-image-1",
  image: [imageFile],  // File object or buffer
  prompt: "Recreate this image as faithfully and exactly as possible...",
  size: "1024x1024"
});
```

### IndexedDB Schema

Two object stores:
- `runs`: Run metadata (id, status, iterationCount, etc.)
- `iterations`: Image blobs with metadata (id, runId, index, imageBlob)

### Generation Prompt

```
Recreate this image as faithfully and exactly as possible. Preserve composition, framing, subject identity, colors, lighting, textures, and all visible details. Do not add, remove, stylize, reinterpret, or redesign anything.
```

---

## Environment Variables

```
OPENAI_API_KEY=sk-...   # Only required for generation, not for viewing demo
```

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:3000
npm run build        # Build for production
npm run lint         # Run ESLint
```

---

## User Decisions Reference

From conversation with user:
- Start with 11 iterations (can expand later)
- Public app (no auth needed yet)
- GIF download included
- Both slider and side-by-side comparison
- Run history from day one (via IndexedDB)
- One demo fixture checked into repo
- No rate limiting for now
- One run at a time (no concurrent runs)

---

## Current Status

**Phase:** Foundation setup complete, ready to build core features

**Next immediate tasks:**
1. Create /src/lib/types.ts with TypeScript interfaces
2. Create /src/lib/constants.ts with prompt and defaults
3. Create /src/lib/db.ts with IndexedDB operations
4. Build Filmstrip component with demo data
5. Build comparison views

---

## Notes for Future Agents

1. **Read spec.md first** — it's the source of truth for requirements
2. **No backend complexity** — resist adding databases or server storage
3. **Demo fixture is key** — enables testing without API key
4. **Client orchestration** — generation loop runs in browser, not server
5. **IndexedDB for persistence** — survives refresh, cleared on browser data clear
6. **gpt-image-1 images.edit** — this is the correct API endpoint
