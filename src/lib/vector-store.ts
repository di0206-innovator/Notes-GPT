import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface StoredChunk {
  content: string;
  embedding: number[];
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  filename: string;
}

export interface DocumentMeta {
  documentId: string;
  filename: string;
  chunkCount: number;
  totalPages: number;
  uploadedAt: string;
}

interface VectorStoreData {
  documents: DocumentMeta[];
  chunks: StoredChunk[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'vectors.json');

/**
 * Load the vector store from disk, or return empty store.
 */
async function loadStore(): Promise<VectorStoreData> {
  if (!existsSync(STORE_PATH)) {
    return { documents: [], chunks: [] };
  }
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    if (!raw || !raw.trim() || raw.trim() === 'undefined') {
      return { documents: [], chunks: [] };
    }
    return JSON.parse(raw) as VectorStoreData;
  } catch (error) {
    console.error("Error loading vector store:", error);
    return { documents: [], chunks: [] };
  }
}

/**
 * Save the vector store to disk.
 */
async function saveStore(store: VectorStoreData): Promise<void> {
  if (!store) return;
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2) || '{}', 'utf-8');
  } catch (error) {
    console.error("Error saving vector store:", error);
    throw new Error("Failed to save data to vector store.");
  }
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Add document chunks with embeddings to the store.
 */
export async function addDocumentChunks(
  documentMeta: DocumentMeta,
  chunks: StoredChunk[]
): Promise<void> {
  const store = await loadStore();

  // Remove existing document if re-uploading
  store.documents = store.documents.filter((d) => d.documentId !== documentMeta.documentId);
  store.chunks = store.chunks.filter((c) => c.documentId !== documentMeta.documentId);

  store.documents.push(documentMeta);
  store.chunks.push(...chunks);
  await saveStore(store);
}

/**
 * Search the vector store for the top-K most similar chunks to the query embedding.
 */
export async function search(
  queryEmbedding: number[],
  topK: number = 5
): Promise<(StoredChunk & { score: number })[]> {
  const store = await loadStore();

  if (store.chunks.length === 0) {
    return [];
  }

  const scored = store.chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * List all ingested documents.
 */
export async function listDocuments(): Promise<DocumentMeta[]> {
  const store = await loadStore();
  return store.documents;
}

/**
 * Delete a document and all its chunks.
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const store = await loadStore();
  const before = store.documents.length;
  store.documents = store.documents.filter((d) => d.documentId !== documentId);
  store.chunks = store.chunks.filter((c) => c.documentId !== documentId);
  await saveStore(store);
  return store.documents.length < before;
}
