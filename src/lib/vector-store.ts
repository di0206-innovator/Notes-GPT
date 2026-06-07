import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

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
  type?: 'pdf' | 'image';
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
 * Add document chunks with embeddings to Firestore.
 * Scoped by sessionId for multi-tenancy.
 */
export async function addDocumentChunks(
  documentMeta: DocumentMeta,
  chunks: StoredChunk[],
  sessionId: string
): Promise<void> {
  // 1. Save document metadata
  const docRef = doc(db, 'documents', `${sessionId}_${documentMeta.documentId}`);
  await setDoc(docRef, {
    ...documentMeta,
    sessionId,
    type: documentMeta.type || 'pdf',
  });

  // 2. Save chunks in batches (Firestore supports batches up to 500 documents)
  const batch = writeBatch(db);
  chunks.forEach((chunk, i) => {
    const chunkId = `${sessionId}_${documentMeta.documentId}_${i}`;
    const chunkRef = doc(db, 'chunks', chunkId);
    batch.set(chunkRef, {
      ...chunk,
      sessionId,
    });
  });

  await batch.commit();
}

/**
 * Search Firestore for chunks matching query embedding.
 * Scoped by sessionId.
 */
export async function search(
  queryEmbedding: number[],
  sessionId: string,
  topK: number = 5
): Promise<(StoredChunk & { score: number })[]> {
  // Query all chunks for this session
  const chunksRef = collection(db, 'chunks');
  const q = query(chunksRef, where('sessionId', '==', sessionId));
  const querySnapshot = await getDocs(q);

  const chunks: StoredChunk[] = [];
  querySnapshot.forEach((docSnap) => {
    chunks.push(docSnap.data() as StoredChunk);
  });

  if (chunks.length === 0) {
    return [];
  }

  // Compute cosine similarity in memory
  const scored = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * List all documents for this session from Firestore.
 */
export async function listDocuments(sessionId: string): Promise<DocumentMeta[]> {
  const docsRef = collection(db, 'documents');
  const q = query(docsRef, where('sessionId', '==', sessionId));
  const querySnapshot = await getDocs(q);

  const documents: DocumentMeta[] = [];
  querySnapshot.forEach((docSnap) => {
    documents.push(docSnap.data() as DocumentMeta);
  });

  return documents;
}

/**
 * Get all text chunks for this session from Firestore (for study kit generation).
 */
export async function getDocumentChunks(
  sessionId: string,
  documentId?: string
): Promise<StoredChunk[]> {
  const chunksRef = collection(db, 'chunks');
  let q = query(chunksRef, where('sessionId', '==', sessionId));
  if (documentId) {
    q = query(chunksRef, where('sessionId', '==', sessionId), where('documentId', '==', documentId));
  }
  const querySnapshot = await getDocs(q);

  const chunks: StoredChunk[] = [];
  querySnapshot.forEach((docSnap) => {
    chunks.push(docSnap.data() as StoredChunk);
  });

  return chunks;
}

/**
 * Delete a document and all its chunks from Firestore.
 * Scoped by sessionId.
 */
export async function deleteDocument(documentId: string, sessionId: string): Promise<boolean> {
  // 1. Delete document meta doc
  const docRef = doc(db, 'documents', `${sessionId}_${documentId}`);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return false;
  }
  await deleteDoc(docRef);

  // 2. Query and delete chunks in batches
  const chunksRef = collection(db, 'chunks');
  const q = query(
    chunksRef,
    where('sessionId', '==', sessionId),
    where('documentId', '==', documentId)
  );
  const querySnapshot = await getDocs(q);

  const batch = writeBatch(db);
  querySnapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
  return true;
}

/**
 * Save generated study kit in Firestore.
 */
export async function saveCloudStudyKit(studyKit: Record<string, unknown>, sessionId: string): Promise<void> {
  const kitRef = doc(db, 'studyKits', sessionId);
  await setDoc(kitRef, {
    ...studyKit,
    sessionId,
  });
}

/**
 * Retrieve study kit for session from Firestore.
 */
export async function getCloudStudyKit(sessionId: string): Promise<Record<string, unknown> | null> {
  const kitRef = doc(db, 'studyKits', sessionId);
  const kitSnap = await getDoc(kitRef);
  if (!kitSnap.exists()) {
    return null;
  }
  return kitSnap.data() as Record<string, unknown>;
}
