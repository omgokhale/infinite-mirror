# Context Prime — Agent Continuity Document

This document tracks development progress and key decisions for future agents picking up this project.

---

## Project Overview

**Infinite Mirror** is a web app that demonstrates iterative image drift. Users upload an image, and the app uses OpenAI's image model to "faithfully recreate" it multiple times in sequence. Each output becomes the input for the next iteration, showing how AI recreation introduces cumulative drift.

**Live Status:** MVP complete and tested with real OpenAI API.

---

## Session Log

### Session 1 — April 8-9, 2026

**Agent:** Claude Opus 4.5

**Work Completed:**

1. **Spec Review & Architecture Planning**
   - Reviewed original spec.md with user
   - Identified critical issue: OpenAI DALL-E 3 doesn't support image input
   - Researched OpenAI API — confirmed gpt-image-1 supports images.edit endpoint
   - Simplified architecture: no server storage, pure client-side with IndexedDB

2. **MVP Implementation**
   - Created Next.js 16 project with TypeScript and Tailwind
   - Built IndexedDB storage layer for client-side persistence
   - Created OpenAI API proxy route (`/api/generate`)
   - Built all UI components:
     - UploadForm with drag-and-drop
     - Filmstrip for iteration thumbnails
     - ComparisonSlider (draggable overlay)
     - SideBySide view
     - GridView
     - ProgressIndicator
     - GifExport
   - Created demo fixture with SVG placeholders
   - Implemented client-orchestrated generation loop

3. **User Testing & Enhancements**
   - Set up `.env.local` with user's OpenAI API key
   - Tested real generation (works, ~30-60 seconds per image)
   - **Added dynamic aspect ratio support:**
     - Detects input image dimensions
     - Uses `1536x1024` for landscape, `1024x1536` for portrait, `1024x1024` for square
   - **Added Fast Mode:**
     - Checkbox in upload form
     - Uses `gpt-image-1-mini` instead of `gpt-image-1`
     - Sets `quality: 'medium'` and `input_fidelity: 'low'`
     - ~2x faster, with more visible drift per iteration

**Git Commits:**
1. `Initial implementation of Infinite Mirror` - Full MVP
2. `Add dynamic aspect ratio matching for image generation`
3. (Pending) Fast Mode implementation

---

## Architecture

```
Browser (Client)                    Server (Next.js API)
     │                                      │
     │  1. User uploads image               │
     │  2. Detect dimensions → choose size  │
     │  3. Store in IndexedDB               │
     │                                      │
     │  4. POST /api/generate ─────────────►│
     │     { imageBase64, prompt,           │
     │       size, fastMode }               │
     │                                      │  5. Call OpenAI images.edit
     │  6. Receive result ◄────────────────│     (gpt-image-1 or mini)
     │  7. Store in IndexedDB               │
     │                                      │
     │  8. Repeat 4-7 for each iteration    │
     │                                      │
```

**Key Points:**
- No database, no server storage
- Images live in browser IndexedDB
- Client orchestrates the generation loop (one API call per iteration)
- Generation continues only while browser tab is active/visible

---

## File Structure (Actual)

```
/src
  /app
    page.tsx                    # Main page with all UI logic
    layout.tsx                  # Root layout
    /api/generate/route.ts      # OpenAI proxy endpoint
  /components
    ComparisonSlider.tsx        # Draggable image comparison
    Filmstrip.tsx               # Horizontal thumbnail strip
    GifExport.tsx               # Download as GIF button
    GridView.tsx                # All images in grid
    ImageViewer.tsx             # Main viewer with mode tabs
    ProgressIndicator.tsx       # Generation progress bar
    SideBySide.tsx              # Two images side by side
    UploadForm.tsx              # Upload + settings (iterations, fast mode)
  /hooks
    useRun.ts                   # All run state and generation logic
  /lib
    constants.ts                # Prompts, defaults, thresholds
    db.ts                       # IndexedDB operations + image utilities
    gif.ts                      # GIF generation using gif.js
    types.ts                    # TypeScript interfaces
  /types
    gif.js-upgrade.d.ts         # Type declarations for gif.js
/public
  /demo
    run.json                    # Demo manifest
    iteration-000.svg ... 010   # SVG placeholder images
  gif.worker.js                 # Web worker for GIF encoding
/scripts
  generate-demo-placeholders.js # Script to regenerate demo SVGs
```

---

## API Route Parameters

**POST `/api/generate`**

```typescript
{
  imageBase64: string;      // Base64-encoded input image
  prompt?: string;          // Override default prompt (optional)
  size?: '1024x1024' | '1536x1024' | '1024x1536';  // Aspect ratio
  fastMode?: boolean;       // Use gpt-image-1-mini with lower quality
}
```

**Response:**
```typescript
{
  imageBase64?: string;     // Base64-encoded output image
  error?: string;           // Error message if failed
}
```

---

## Key Features

| Feature | Status | Notes |
|---------|--------|-------|
| Image upload | ✅ | Drag-drop, max 4MB, PNG/JPEG/WebP |
| Iteration count | ✅ | Slider, 2-20, default 11 |
| Dynamic aspect ratio | ✅ | Auto-detects and uses best match |
| Fast Mode | ✅ | ~2x faster, uses mini model |
| Generation progress | ✅ | Shows "Generating X of Y" |
| Filmstrip | ✅ | Clickable thumbnails |
| Comparison slider | ✅ | Draggable overlay vs previous |
| Side-by-side | ✅ | Current vs original |
| Grid view | ✅ | All iterations at once |
| GIF export | ✅ | Download animated GIF |
| Demo mode | ✅ | View without API key |
| Persistence | ✅ | Survives page refresh (IndexedDB) |

---

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=sk-...   # Required for generation
```

### Constants (`/src/lib/constants.ts`)

```typescript
GENERATION_PROMPT = "Recreate this image as faithfully..."
DEFAULT_ITERATION_COUNT = 11
MAX_FILE_SIZE_MB = 4
IMAGE_MODEL = 'gpt-image-1'
LANDSCAPE_THRESHOLD = 1.2   // ratio > 1.2 → landscape
PORTRAIT_THRESHOLD = 0.83   // ratio < 0.83 → portrait
```

---

## Performance Notes

- **Standard mode:** ~30-60 seconds per image (gpt-image-1, high quality)
- **Fast mode:** ~15-30 seconds per image (gpt-image-1-mini, medium quality)
- **Total time:** For 10 iterations, expect 5-10 minutes standard, 2.5-5 minutes fast
- **Browser throttling:** Generation slows/pauses when tab is backgrounded

---

## Known Limitations

1. **Browser tab must stay active** — client-orchestrated loop pauses when backgrounded
2. **No resume** — if you close the tab mid-generation, you lose progress
3. **Demo uses SVG placeholders** — should be replaced with real generated images
4. **No auth/rate limiting** — public app, anyone can generate

---

## Next Steps / Future Enhancements

**Immediate:**
- [ ] Replace demo SVGs with real generated images
- [ ] Deploy to Vercel
- [ ] Commit Fast Mode feature

**Future:**
- [ ] Server-side orchestration (Trigger.dev) for background generation
- [ ] Multiple provider support (alternate OpenAI/Stability AI)
- [ ] Animated playback of sequence
- [ ] Download as ZIP
- [ ] Public sharing links
- [ ] Run history browser

---

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (default port 3000)
npm run dev -- -p 3001   # Start on different port
npm run build            # Build for production
npm run lint             # Run ESLint
```

---

## Notes for Future Agents

1. **Read spec.md** for full requirements context
2. **Don't add server storage** — the simplicity is intentional
3. **Test with Fast Mode first** — much quicker iteration cycles
4. **The AI SDK recommendations don't apply** — we use OpenAI's `images.edit` endpoint, not text generation
5. **Demo fixture** — run `node scripts/generate-demo-placeholders.js` to regenerate
6. **IndexedDB** — data persists until browser data is cleared or user clicks "Start Over"
7. **Aspect ratio** — automatically detected on upload, stored in hook state
8. **Generation timing** — each image takes 15-60 seconds, be patient during testing
