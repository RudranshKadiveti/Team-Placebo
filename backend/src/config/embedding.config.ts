/**
 * Centralized Embedding Pipeline Configuration
 * Defines model specifications, L2 normalization status, and chunking strategy versions.
 */
export const EMBEDDING_CONFIG = {
  MODEL_NAME: 'Xenova/all-MiniLM-L6-v2',
  MODEL_VERSION: '1.0.0',
  DIMENSION: 384,
  NORMALIZED: true,
  CHUNKING_VERSION: 'v1',
} as const;

export type EmbeddingConfig = typeof EMBEDDING_CONFIG;
