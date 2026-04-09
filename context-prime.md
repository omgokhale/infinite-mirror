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
3. `Add webcam capture, auto-advance, and fade transitions`

---

### Session 2 — April 9, 2026

**Agent:** Claude Opus 4.5

**Work Completed:**

1. **Pre-Redesign Features**
   - Added webcam capture option (getUserMedia, video preview, capture to file)
   - Added auto-advance to newly generated image
   - Added fade-in transition between images (later removed to prevent black flash)

2. **Major UI Redesign** (based on user mockups Reference.png, Reference2.png)
   - **Dark theme:** Pitch black background (#000), white text
   - **Upload screen:** Two large circular buttons (+ for file, camera for webcam), bottom controls (Fast mode toggle, Iterations text input)
   - **Header component:** View mode icons (left), SVG logo (center), X close + download dropdown (right)
   - **Filmstrip redesign:** Selected = circle with morph animation, comparison = rectangle with dot, pending = dark rectangles, centered horizontally, pinned to bottom with 32px margin
   - **ImageViewer redesign:** Centered image, left/right arrow navigation, "00/10" counter format
   - **Removed:** Grid view, demo mode button, progress indicator bar

3. **New Features**
   - **Keyboard navigation:** Arrow keys (left/right), 0-9 to jump to specific iteration
   - **Auto-start generation:** Begins automatically after image upload
   - **Export dropdown:** Download GIF or download all images individually
   - **Shift+click comparison:** In comparison modes, shift+click to select any two images to compare
   - **Webcam 4:3 crop:** Webcam captures auto-crop to 4:3 aspect ratio

4. **Visual Polish**
   - SVG logo (`/public/logo.svg`) replaces text title
   - View mode icons: active = white, inactive = 35% opacity
   - Filmstrip morph animation between circle/square using border-radius transition
   - Comparison indicator dot shows for effective comparison (user-selected or default)
   - Webcam buttons: Camera icon (white bg, black icon), X icon (10% white bg, white icon)
   - Sharp corners on webcam preview and filmstrip rectangles

**Git Commits:**
4. (Pending) Full UI redesign

---

### Session 3 — April 9, 2026

**Agent:** Claude Opus 4.5

**Work Completed:**

1. **Bug Fixes**
   - Fixed auto-advance race condition: added `preloadImage()` to wait for browser to decode image before advancing
   - Fixed state sync issue: ImageViewer now falls back to last available iteration if selected index doesn't exist yet
   - Fixed upload screen flicker: hide upload form during loading transition
   - Added `autoAdvanceEnabled` flag to hook to prevent advancing during initial reveal animation

2. **UI Polish & Refinements**
   - **Download icon:** Changed to down arrow with stem
   - **Removed image counters:** From main view, comparison slider, and side-by-side
   - **Header/Filmstrip alignment:** Upload screen header now matches main view (h-14 centered = 22px from top)
   - **Filmstrip margin:** Changed from 32px to 16px from bottom
   - **Arrow buttons:** Now fade to 20% opacity when inactive instead of disappearing
   - **Empty filmstrip tiles:** 6% white with backdrop blur
   - **Fast mode dot:** Inactive state changed to 40% white
   - **Selection indicator dots:** Fixed width to match tile (w-20) for proper centering

3. **New Features**
   - **Video background:** Added `/public/background.webm` (1.4MB) and `/public/background.mp4` (3.6MB) - optimized from 51MB source with blur-sm effect
   - **Hedvig Letters Sans font:** Replaced Geist with Google Font via next/font
   - **Dissolve-in animation:** Header and filmstrip blur+fade in over 0.8s when entering main view
   - **Demo button:** Stack icon in top-right of upload screen (35% opacity)
   - **Logo click:** Returns to upload screen
   - **Default iterations:** Changed from 11 to 8
   - **Responsive filmstrip:** Left-aligns with 16px margin when viewport is narrow, centers when wide

4. **Loading Tile Animation**
   - Created `LoadingTile` component for generating tiles in filmstrip
   - Uses previous iteration's image, sampled to 1px blocks
   - Pixels slowly drift/slide to random positions (ambient effect)
   - Creates abstract color field preview of upcoming image

5. **Pixel Reveal Animation** (disabled for now)
   - Created `PixelReveal` component for initial image load
   - Randomly reveals pixels over configurable duration
   - Can be re-enabled by setting `setShowInitialReveal(true)` in page.tsx

**Known Issues:**
- Selection indicator dots may still have alignment issues in comparison modes (needs verification)
- Demo images are SVG placeholders - need real generated images

**Git Commits:**
5. (Pending) Session 3 changes

---

### Session 4 — April 9, 2026

**Agent:** Claude Opus 4.5

**Work Completed:**

1. **Bug Fixes**
   - **Filmstrip indicator alignment:** Fixed selection indicator dots being offset in comparison modes — now only renders the active dot (selected OR comparison, never both invisible placeholders)
   - **Download dropdown not clickable:** Added `z-[60]` to dropdown and `relative z-50` to Header wrapper to fix stacking context issues caused by `filter` in dissolve animation

2. **UI Polish**
   - **Download dropdown redesign:**
     - Wider (`w-48`) so "Download all images" fits on one line
     - Background changed to 6% white with backdrop blur
     - Removed border outline and horizontal divider
     - Increased border radius (`rounded-xl`)
   - **Fast Mode dot:** Inactive state changed from 40% to 30% white opacity
   - **Navigation arrows removed:** Replaced with invisible click zones
     - Left half of screen → previous image
     - Right half of screen → next image
     - Cursor changes to resize arrows (←/→) as visual hint
     - ComparisonSlider wrapped with `pointer-events-auto z-20` to preserve drag functionality

3. **Custom Cursor**
   - Created `CustomCursor` component in layout
   - Small white dot (8px) follows mouse
   - Scales to 2x (16px) when hovering over clickable elements
   - Smooth 150ms transition
   - Default system cursor hidden globally via CSS

4. **Demo Images**
   - Updated `run.json` to use real generated images (`0.png` through `9.png`)
   - Changed from 11 SVG placeholders to 10 real PNG images

**Git Commits:**
6. (Pending) Session 4 changes

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
    page.tsx                    # Main page with all UI logic, keyboard nav, export
    layout.tsx                  # Root layout
    globals.css                 # Dark theme, fade animation
    /api/generate/route.ts      # OpenAI proxy endpoint
  /components
    ComparisonSlider.tsx        # Draggable image comparison (slider view)
    CustomCursor.tsx            # Custom white dot cursor with hover scaling
    Filmstrip.tsx               # Bottom thumbnail carousel with morph animation
    GifExport.tsx               # GIF export utility (used by page.tsx)
    GridView.tsx                # (Unused in new design)
    Header.tsx                  # Top bar with view icons, logo, close, download
    ImageViewer.tsx             # Centered image with click-zone navigation
    LoadingTile.tsx             # Ambient pixel animation for generating tiles
    PixelReveal.tsx             # Pixel-by-pixel image reveal (disabled)
    ProgressIndicator.tsx       # (Unused in new design)
    SideBySide.tsx              # Two images side by side view
    UploadForm.tsx              # Upload screen with circle buttons, webcam, demo button
  /hooks
    useRun.ts                   # Run state, generation logic, comparisonIndex
  /lib
    constants.ts                # Prompts, defaults, thresholds
    db.ts                       # IndexedDB operations + image utilities
    gif.ts                      # GIF generation using gif.js
    types.ts                    # TypeScript interfaces (ViewMode, etc.)
  /types
    gif.js-upgrade.d.ts         # Type declarations for gif.js
/public
  logo.svg                      # SVG wordmark logo
  background.webm               # NEW: Upload screen video background (1.4MB, VP9)
  background.mp4                # NEW: Upload screen video fallback (3.6MB, H.264)
  /demo
    run.json                    # Demo manifest
    0.png ... 9.png             # Real generated demo images
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
| Image upload | ✅ | Click + icon, max 4MB, PNG/JPEG/WebP |
| Webcam capture | ✅ | Camera icon, auto-crops to 4:3 |
| Iteration count | ✅ | Text input, 1-20 |
| Dynamic aspect ratio | ✅ | Auto-detects and uses best match |
| Fast Mode | ✅ | Toggle, ~2x faster, uses mini model |
| Auto-start | ✅ | Generation begins on upload |
| Filmstrip | ✅ | Circle=selected, rectangle=others, morph animation |
| Comparison slider | ✅ | Draggable overlay (vs-previous mode) |
| Side-by-side | ✅ | Two images (vs-original mode) |
| Shift+click compare | ✅ | Select any two images in comparison modes |
| Click navigation | ✅ | Click left/right half of screen to navigate |
| Keyboard shortcuts | ✅ | Arrow keys, 0-9 jump to iteration |
| Custom cursor | ✅ | White dot, scales on hover |
| GIF export | ✅ | Download dropdown option |
| All images export | ✅ | Download dropdown option |
| Dark theme | ✅ | Pitch black (#000) background |
| SVG logo | ✅ | Replaces text title |
| Persistence | ✅ | Survives page refresh (IndexedDB) |
| Demo mode | ✅ | Stack icon in top-right of upload screen |
| Grid view | ❌ | Removed in redesign |

---

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=sk-...   # Required for generation
```

### Constants (`/src/lib/constants.ts`)

```typescript
GENERATION_PROMPT = "Recreate this image as faithfully..."
DEFAULT_ITERATION_COUNT = 8   // Changed from 11 in Session 3
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
3. **No auth/rate limiting** — public app, anyone can generate

---

## Next Steps / Future Enhancements

**Immediate:**
- [x] Replace demo SVGs with real generated images
- [ ] Deploy to Vercel
- [ ] Commit all pending changes

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
6. **IndexedDB** — data persists until browser data is cleared or user clicks X (close)
7. **Aspect ratio** — automatically detected on upload, stored in hook state
8. **Generation timing** — each image takes 15-60 seconds, be patient during testing
9. **Dark theme only** — no light mode toggle, pitch black (#000) background
10. **Reference mockups** — Reference.png (viewer) and Reference2.png (upload) in project root
11. **View modes** — Single, Comparison Slider (vs-previous), Side-by-side (vs-original). No grid.
12. **Shift+click** — In comparison modes, shift+click filmstrip to select second image
13. **Webcam** — Captures at 4:3, sharp corners on preview
14. **Logo** — SVG wordmark at `/public/logo.svg`, height h-3 (12px), clickable to return to upload
15. **Pixel reveal** — Disabled; re-enable by setting `setShowInitialReveal(true)` in page.tsx onUpload handler
16. **Loading tiles** — Use `LoadingTile` component with 1px ambient drifting pixels from previous image
17. **Video background** — `/public/background.webm` with blur-sm, converted from 51MB source
18. **Font** — Hedvig Letters Sans via next/font/google
19. **Dissolve animation** — Header and filmstrip use `animate-dissolve-in` class (blur + fade, 0.8s)
20. **Auto-advance control** — Hook exposes `setAutoAdvance(bool)` to pause/resume during animations
21. **Demo** — Button in top-right of upload screen; uses real images `0.png` through `9.png`
22. **Custom cursor** — `CustomCursor` component in layout; hides system cursor via CSS
23. **Click navigation** — No visible arrows; click left/right half of screen to navigate
24. **Stacking contexts** — Header wrapper needs `relative z-50` due to `filter` in dissolve animation
