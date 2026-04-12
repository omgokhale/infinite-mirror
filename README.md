README written by Claude; my apologies for the LLM-speak. — Om.

# Infinite Mirror

Watch AI drift as it tries to faithfully recreate an image, over and over.

## What is this?

Infinite Mirror demonstrates **iterative image drift**. You upload an image, and the app uses OpenAI's image model to "faithfully recreate" it. The output becomes the input for the next iteration. Even though the model tries to recreate exactly, tiny deviations accumulate into visible drift over multiple iterations.

## Features

- Upload any image (PNG, JPEG, WebP, up to 4MB)
- Generate a sequence of AI recreations (default: 11 images)
- **Draggable comparison slider** to see differences between iterations
- **Side-by-side view** comparing any iteration to the original
- **Grid view** showing all iterations at once
- **GIF export** to share the progression
- **Demo mode** to see it in action without an API key
- All images stored locally in your browser (IndexedDB)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### View the Demo (no API key needed)

Just click "View Demo" on the home page to see a pre-generated progression.

### Generate Your Own (requires OpenAI API key)

1. Copy `.env.example` to `.env.local`
2. Add your OpenAI API key
3. Upload an image and click "Generate Sequence"

```bash
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
```

## How It Works

1. You upload an image
2. The app sends it to OpenAI's `gpt-image-1` model with a "recreate faithfully" prompt
3. The generated image becomes the input for the next iteration
4. Repeat until the sequence is complete
5. All images are stored in your browser's IndexedDB

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **IndexedDB** (via idb) for client-side storage
- **OpenAI gpt-image-1** for image generation
- **gif.js** for GIF export

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main page
│   └── api/generate/      # OpenAI proxy endpoint
├── components/
│   ├── UploadForm.tsx     # Image upload + settings
│   ├── Filmstrip.tsx      # Iteration thumbnails
│   ├── ImageViewer.tsx    # Main comparison viewer
│   ├── ComparisonSlider.tsx
│   ├── SideBySide.tsx
│   ├── GridView.tsx
│   └── GifExport.tsx
├── hooks/
│   └── useRun.ts          # Run state management
└── lib/
    ├── db.ts              # IndexedDB operations
    ├── types.ts           # TypeScript interfaces
    ├── constants.ts       # Prompts, defaults
    └── gif.ts             # GIF generation
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | For generation | Your OpenAI API key |

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/infinite-mirror)

Add your `OPENAI_API_KEY` in Vercel's environment variables.

## License

MIT
