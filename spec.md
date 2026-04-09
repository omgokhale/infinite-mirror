# Infinite Mirror — Product Spec

## 1. Product Summary

A minimal web app that demonstrates **iterative image drift**.

A user uploads one image. The system uses OpenAI's gpt-image-1 model to recreate that image as faithfully as possible. The output of each generation becomes the input for the next generation. This repeats for a configurable number of steps (default: 11 total images = 1 original + 10 generated).

The app showcases how even "faithful recreation" by AI models introduces subtle drift that accumulates visibly over iterations.

---

## 2. Core Concept

This app demonstrates that model-based "recreation" is actually re-synthesis. Even when a model tries to recreate an image exactly, tiny deviations appear. When repeated in a loop, those deviations accumulate into visible drift.

The central experience is a clean visual progression from the original image through later iterations.

---

## 3. Revised Architecture Decisions

| Aspect | Decision |
|--------|----------|
| **Storage** | Client-side only (IndexedDB) — no server database |
| **Image persistence** | Browser IndexedDB; lost when user clears data |
| **Demo run** | Pre-generated fixture checked into repo, always available |
| **Auth** | None |
| **Rate limiting** | None for MVP |
| **Concurrent runs** | One at a time |
| **Iteration count** | 11 total (1 original + 10 generated), configurable |
| **Image size** | 1024×1024 |
| **Max upload** | 4MB |
| **Image model** | OpenAI gpt-image-1 via images.edit endpoint |
| **Orchestration** | Client-orchestrated loop (one API call per iteration) |

---

## 4. Goals

### Primary goals

* Let a user upload an image and generate a chained sequence of recreations
* Show the progression clearly and beautifully
* Make it fast to inspect how the image changes step to step
* Provide a pre-loaded demo run for instant demonstration
* Make the app easy to run locally and deploy
* Keep it simple — no backend storage, no auth, no complexity

### Non-goals for MVP

* Server-side storage/persistence
* User accounts or auth
* Multi-user features
* Multiple concurrent runs
* Advanced analytics

---

## 5. MVP Scope

### User flow

1. User opens the app
2. User can immediately view the **demo run** to see an example progression
3. User uploads their own image (max 4MB)
4. User optionally adjusts iteration count (default 11)
5. User clicks **Generate Sequence**
6. The UI shows progress as each image is generated (one at a time)
7. User can view the filmstrip of all iterations
8. User clicks any iteration to inspect in detail
9. User can compare:
   * Selected iteration vs previous (draggable slider)
   * Selected iteration vs original (side-by-side)
   * All images in a grid
10. User can download the sequence as a GIF
11. Refreshing the page preserves the current run (via IndexedDB)
12. Clearing browser data or starting a new run clears the old one

### MVP features

* Single image upload (max 4MB, 1024×1024)
* Configurable iteration count (default 11)
* Fixed faithful-recreation prompt
* Client-orchestrated sequential generation
* IndexedDB persistence for current run
* Pre-loaded demo run fixture
* Timeline/filmstrip of all iterations
* Draggable comparison slider
* Side-by-side comparison view
* Grid view of all iterations
* GIF export
* Basic error handling with retry

---

## 6. Technical Stack

### Frontend + Backend

* **Next.js 16** (App Router)
* **TypeScript**
* **React 19**
* **Tailwind CSS**

### Client-side Storage

* **IndexedDB** via idb library for image blob storage
* React state + localStorage for run metadata

### Image Generation

* **OpenAI gpt-image-1** via `images.edit` endpoint

### Deployment

* **Vercel** for hosting
* No database required

---

## 7. Data Model

### Run (stored in IndexedDB)

```typescript
interface Run {
  id: string;                    // UUID
  createdAt: string;             // ISO timestamp
  status: 'idle' | 'running' | 'completed' | 'failed';
  iterationCount: number;        // Total images including original
  currentStep: number;           // Current progress (0 = original uploaded)
  errorMessage?: string;
  isDemo: boolean;               // True for the pre-loaded demo
}
```

### Iteration (stored in IndexedDB)

```typescript
interface Iteration {
  id: string;                    // UUID
  runId: string;                 // Foreign key
  index: number;                 // 0 = original, 1..N = generated
  imageBlob: Blob;               // The actual image data
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
}
```

---

## 8. API Design

Single API route for proxying OpenAI calls:

### POST `/api/generate`

Generates the next iteration image.

**Request:**
```typescript
{
  imageBase64: string;           // Base64-encoded input image
  prompt: string;                // Recreation prompt
}
```

**Response:**
```typescript
{
  imageBase64: string;           // Base64-encoded output image
  error?: string;
}
```

This is the only server-side code needed. All orchestration happens client-side.

---

## 9. Generation Pipeline

### Prompt

Fixed prompt for all iterations:

> "Recreate this image as faithfully and exactly as possible. Preserve composition, framing, subject identity, colors, lighting, textures, and all visible details. Do not add, remove, stylize, reinterpret, or redesign anything."

### Sequential Loop (Client-Orchestrated)

```
1. User uploads image → stored as iteration 0
2. Client sends iteration 0 to /api/generate
3. Server calls OpenAI images.edit, returns result
4. Client stores result as iteration 1
5. Client sends iteration 1 to /api/generate
6. ... repeat until iterationCount reached
```

### Retry Behavior

* 1 automatic retry per failed generation
* If retry fails, mark run as failed, preserve all successful iterations

---

## 10. UI Spec

### Design Principles

* Minimal, clean, quiet
* Visual-first — the progression is the product
* No unnecessary controls

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Demo] [Upload Image] [Iterations: 11 ▼] [Generate]    │  ← Top bar
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │              Main Comparison View               │   │  ← Detail viewer
│  │         (Slider / Side-by-side / Grid)          │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Current] [Vs Previous] [Vs Original] [Grid] [GIF ↓]   │  ← View mode tabs
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]          │  ← Filmstrip
└─────────────────────────────────────────────────────────┘
```

### Comparison Modes

1. **Current**: Single large image
2. **Vs Previous**: Draggable slider overlay
3. **Vs Original**: Side-by-side comparison
4. **Grid**: All images in a matrix

### Progress State

During generation:
* Show "Generating image 3 of 10..."
* Filmstrip shows completed thumbnails + skeleton for pending
* Current generating image pulses/animates

### Demo Run

* Button in top bar: "View Demo"
* Loads pre-generated fixture instantly
* Same UI as user-generated runs
* Clearly labeled as demo

---

## 11. Project Structure

```
/src
  /app
    page.tsx                    # Main page
    layout.tsx                  # Root layout
    /api
      /generate
        route.ts                # OpenAI proxy endpoint
  /components
    Filmstrip.tsx               # Iteration thumbnails
    ComparisonSlider.tsx        # Draggable overlay comparison
    SideBySide.tsx              # Side-by-side comparison
    GridView.tsx                # All images grid
    ImageViewer.tsx             # Main viewer container
    UploadForm.tsx              # Upload + settings
    DemoButton.tsx              # Load demo trigger
    ProgressIndicator.tsx       # Generation progress
  /lib
    db.ts                       # IndexedDB operations
    openai.ts                   # API call helpers
    types.ts                    # TypeScript interfaces
    constants.ts                # Prompts, defaults
    gif.ts                      # GIF generation
  /hooks
    useRun.ts                   # Run state management
    useGeneration.ts            # Generation orchestration
/public
  /demo
    run.json                    # Demo run metadata
    iteration-000.png           # Demo images
    iteration-001.png
    ...
```

---

## 12. Demo Fixture

The `/public/demo/` folder contains:

* `run.json` — metadata for the demo run
* `iteration-000.png` through `iteration-010.png` — the images

This allows anyone to see the full experience without needing an OpenAI API key.

---

## 13. Environment Variables

```
OPENAI_API_KEY=sk-...          # Required for generation
```

That's it. No database URLs, no storage keys.

---

## 14. Development Workflow

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# View demo (no API key needed)
# Just click "View Demo" in the UI

# Generate your own (requires API key)
# Add OPENAI_API_KEY to .env.local
```

---

## 15. Acceptance Criteria

The MVP is complete when:

1. ✅ Demo run is viewable instantly without API key
2. ✅ User can upload an image and generate an 11-image sequence
3. ✅ Progress is shown during generation
4. ✅ Filmstrip shows all iterations with clear labels
5. ✅ Clicking an iteration shows it large
6. ✅ Draggable slider comparison works (vs previous)
7. ✅ Side-by-side comparison works (vs original)
8. ✅ Grid view shows all images
9. ✅ GIF download works
10. ✅ Refreshing preserves current run
11. ✅ Failed steps show error, preserve prior successes
12. ✅ App deploys to Vercel with just OPENAI_API_KEY

---

## 16. Build Order

### Phase 1 — Foundation
- [x] Next.js + TypeScript + Tailwind setup
- [ ] IndexedDB storage layer
- [ ] Type definitions
- [ ] Constants (prompt, defaults)

### Phase 2 — Demo First
- [ ] Demo fixture in /public/demo
- [ ] Load demo into UI
- [ ] Filmstrip component
- [ ] Basic viewer

### Phase 3 — Comparison Views
- [ ] Draggable comparison slider
- [ ] Side-by-side view
- [ ] Grid view
- [ ] View mode switching

### Phase 4 — Live Generation
- [ ] OpenAI API route
- [ ] Upload form
- [ ] Client orchestration loop
- [ ] Progress indicator
- [ ] Error handling + retry

### Phase 5 — Polish
- [ ] GIF export
- [ ] Loading states
- [ ] Error states
- [ ] Mobile responsiveness
- [ ] Final testing

---

## 17. Future Enhancements (Post-MVP)

* Multiple provider support (alternate OpenAI/Stability)
* Animated playback
* Download as ZIP
* Similarity metrics
* Run history browser
* Branching from mid-sequence
* Public sharing links
