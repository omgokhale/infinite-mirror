export const GENERATION_PROMPT = `Recreate this image as faithfully and exactly as possible. Preserve composition, framing, subject identity, colors, lighting, textures, and all visible details. Do not add, remove, stylize, reinterpret, or redesign anything.`;

export const DEFAULT_ITERATION_COUNT = 11;
export const MIN_ITERATION_COUNT = 2;
export const MAX_ITERATION_COUNT = 20;

export const MAX_FILE_SIZE_MB = 4;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const IMAGE_SIZE = '1024x1024';
export const IMAGE_MODEL = 'gpt-image-1';

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const DB_NAME = 'infinite-mirror-db';
export const DB_VERSION = 1;
export const RUNS_STORE = 'runs';
export const ITERATIONS_STORE = 'iterations';

export const DEMO_RUN_ID = 'demo-run';
