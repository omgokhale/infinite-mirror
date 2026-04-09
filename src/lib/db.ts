import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import {
  DB_NAME,
  DB_VERSION,
  RUNS_STORE,
  ITERATIONS_STORE,
} from './constants';
import type { Run, Iteration, IterationWithUrl, RunWithIterations } from './types';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(RUNS_STORE)) {
          const runsStore = db.createObjectStore(RUNS_STORE, { keyPath: 'id' });
          runsStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(ITERATIONS_STORE)) {
          const iterationsStore = db.createObjectStore(ITERATIONS_STORE, { keyPath: 'id' });
          iterationsStore.createIndex('runId', 'runId');
          iterationsStore.createIndex('runId_index', ['runId', 'index']);
        }
      },
    });
  }
  return dbPromise;
}

export async function createRun(iterationCount: number, isDemo = false): Promise<Run> {
  const db = await getDb();
  const run: Run = {
    id: isDemo ? 'demo-run' : uuidv4(),
    createdAt: new Date().toISOString(),
    status: 'idle',
    iterationCount,
    currentStep: 0,
    isDemo,
  };
  await db.put(RUNS_STORE, run);
  return run;
}

export async function getRun(id: string): Promise<Run | undefined> {
  const db = await getDb();
  return db.get(RUNS_STORE, id);
}

export async function updateRun(run: Partial<Run> & { id: string }): Promise<void> {
  const db = await getDb();
  const existing = await db.get(RUNS_STORE, run.id);
  if (existing) {
    await db.put(RUNS_STORE, { ...existing, ...run });
  }
}

export async function deleteRun(id: string): Promise<void> {
  const db = await getDb();

  const tx = db.transaction([RUNS_STORE, ITERATIONS_STORE], 'readwrite');
  const iterationsStore = tx.objectStore(ITERATIONS_STORE);
  const runsStore = tx.objectStore(RUNS_STORE);

  const index = iterationsStore.index('runId');
  let cursor = await index.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await runsStore.delete(id);
  await tx.done;
}

export async function getAllRuns(): Promise<Run[]> {
  const db = await getDb();
  const runs = await db.getAll(RUNS_STORE);
  return runs.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCurrentRun(): Promise<Run | undefined> {
  const runs = await getAllRuns();
  return runs.find(r => !r.isDemo);
}

export async function createIteration(
  runId: string,
  index: number,
  imageBlob: Blob
): Promise<Iteration> {
  const db = await getDb();
  const iteration: Iteration = {
    id: uuidv4(),
    runId,
    index,
    imageBlob,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  await db.put(ITERATIONS_STORE, iteration);
  return iteration;
}

export async function getIterationsForRun(runId: string): Promise<Iteration[]> {
  const db = await getDb();
  const index = db.transaction(ITERATIONS_STORE).store.index('runId');
  const iterations = await index.getAll(runId);
  return iterations.sort((a, b) => a.index - b.index);
}

export async function getIteration(runId: string, index: number): Promise<Iteration | undefined> {
  const db = await getDb();
  const idx = db.transaction(ITERATIONS_STORE).store.index('runId_index');
  return idx.get([runId, index]);
}

export async function getRunWithIterations(runId: string): Promise<RunWithIterations | undefined> {
  const run = await getRun(runId);
  if (!run) return undefined;

  const iterations = await getIterationsForRun(runId);
  const iterationsWithUrls: IterationWithUrl[] = iterations.map(iter => ({
    id: iter.id,
    runId: iter.runId,
    index: iter.index,
    status: iter.status,
    createdAt: iter.createdAt,
    imageUrl: URL.createObjectURL(iter.imageBlob),
  }));

  return {
    ...run,
    iterations: iterationsWithUrls,
  };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([RUNS_STORE, ITERATIONS_STORE], 'readwrite');
  await tx.objectStore(RUNS_STORE).clear();
  await tx.objectStore(ITERATIONS_STORE).clear();
  await tx.done;
}

export function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function getBestImageSize(width: number, height: number): '1024x1024' | '1536x1024' | '1024x1536' {
  const ratio = width / height;

  // Landscape: ratio > 1.2 (wider than 6:5)
  if (ratio > 1.2) {
    return '1536x1024';
  }
  // Portrait: ratio < 0.83 (taller than 5:6)
  if (ratio < 0.83) {
    return '1024x1536';
  }
  // Square-ish
  return '1024x1024';
}
