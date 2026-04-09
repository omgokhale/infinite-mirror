export type RunStatus = 'idle' | 'running' | 'completed' | 'failed';
export type IterationStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ViewMode = 'current' | 'vs-previous' | 'vs-original' | 'grid';

export interface Run {
  id: string;
  createdAt: string;
  status: RunStatus;
  iterationCount: number;
  currentStep: number;
  errorMessage?: string;
  isDemo: boolean;
}

export interface Iteration {
  id: string;
  runId: string;
  index: number;
  imageBlob: Blob;
  status: IterationStatus;
  createdAt: string;
}

export interface IterationWithUrl extends Omit<Iteration, 'imageBlob'> {
  imageUrl: string;
}

export interface RunWithIterations extends Run {
  iterations: IterationWithUrl[];
}

export interface GenerateRequest {
  imageBase64: string;
  prompt?: string;
}

export interface GenerateResponse {
  imageBase64?: string;
  error?: string;
}

export interface DemoRunManifest {
  id: string;
  createdAt: string;
  iterationCount: number;
  images: string[];
}
