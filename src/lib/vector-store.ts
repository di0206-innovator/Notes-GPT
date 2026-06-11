import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'studio-9817976701-89717',
  });
}

const db = admin.firestore();

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
  type?: 'pdf' | 'image' | 'office';
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
  const docRef = db.collection('documents').doc(`${sessionId}_${documentMeta.documentId}`);
  await docRef.set({
    ...documentMeta,
    sessionId,
    type: documentMeta.type || 'pdf',
  });

  // 2. Save chunks in batches of 500 (Firestore supports batches up to 500 documents)
  const BATCH_LIMIT = 500;
  for (let i = 0; i < chunks.length; i += BATCH_LIMIT) {
    const chunkBatch = chunks.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    chunkBatch.forEach((chunk, index) => {
      const globalIndex = i + index;
      const chunkId = `${sessionId}_${documentMeta.documentId}_${globalIndex}`;
      const chunkRef = db.collection('chunks').doc(chunkId);
      batch.set(chunkRef, {
        ...chunk,
        sessionId,
      });
    });
    await batch.commit();
  }
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
  // Query metadata and embedding only, excluding the heavy content text field
  const chunksSnapshot = await db.collection('chunks')
    .where('sessionId', '==', sessionId)
    .select('documentId', 'chunkIndex', 'pageNumber', 'filename', 'embedding')
    .get();

  const chunks: (Omit<StoredChunk, 'content'> & { id: string })[] = [];
  chunksSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    chunks.push({
      id: docSnap.id,
      documentId: data.documentId || '',
      chunkIndex: data.chunkIndex ?? 0,
      pageNumber: data.pageNumber ?? 1,
      filename: data.filename || '',
      embedding: data.embedding || [],
    });
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
  const topChunks = scored.slice(0, topK);

  // Retrieve the full text content only for the top K selected chunks
  const results = await Promise.all(
    topChunks.map(async (chunk) => {
      const docRef = db.collection('chunks').doc(chunk.id);
      const docSnap = await docRef.get();
      const fullData = docSnap.data() as StoredChunk;
      return {
        ...fullData,
        score: chunk.score,
      };
    })
  );

  return results;
}

/**
 * List all documents for this session from Firestore.
 */
export async function listDocuments(sessionId: string): Promise<DocumentMeta[]> {
  const docsSnapshot = await db.collection('documents')
    .where('sessionId', '==', sessionId)
    .get();

  const documents: DocumentMeta[] = [];
  docsSnapshot.forEach((docSnap) => {
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
  let querySnapshot;
  if (documentId) {
    querySnapshot = await db.collection('chunks')
      .where('sessionId', '==', sessionId)
      .where('documentId', '==', documentId)
      .get();
  } else {
    querySnapshot = await db.collection('chunks')
      .where('sessionId', '==', sessionId)
      .get();
  }

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
  const docRef = db.collection('documents').doc(`${sessionId}_${documentId}`);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return false;
  }
  await docRef.delete();

  // 2. Query and delete chunks in batches of 500 (Firestore limit)
  const chunksSnapshot = await db.collection('chunks')
    .where('sessionId', '==', sessionId)
    .where('documentId', '==', documentId)
    .get();

  const BATCH_LIMIT = 500;
  const docs = chunksSnapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const docBatch = docs.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    docBatch.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
  return true;
}

/**
 * Save generated study kit in Firestore.
 */
export async function saveCloudStudyKit(studyKit: Record<string, unknown>, sessionId: string): Promise<void> {
  const kitRef = db.collection('studyKits').doc(sessionId);
  await kitRef.set({
    ...studyKit,
    sessionId,
  });
}

/**
 * Retrieve study kit for session from Firestore.
 */
export async function getCloudStudyKit(sessionId: string): Promise<Record<string, unknown> | null> {
  const kitRef = db.collection('studyKits').doc(sessionId);
  const kitSnap = await kitRef.get();
  if (!kitSnap.exists) {
    return null;
  }
  return kitSnap.data() as Record<string, unknown>;
}

/**
 * Clear all documents, chunks, and study kits for a given sessionId from Firestore.
 */
export async function clearCloudStore(sessionId: string): Promise<void> {
  // 1. Delete study kit
  const kitRef = db.collection('studyKits').doc(sessionId);
  await kitRef.delete().catch(() => {});

  // 2. Delete all documents for this session
  const docsSnapshot = await db.collection('documents')
    .where('sessionId', '==', sessionId)
    .get();
  
  if (!docsSnapshot.empty) {
    const docBatch = db.batch();
    docsSnapshot.forEach((docSnap) => {
      docBatch.delete(docSnap.ref);
    });
    await docBatch.commit();
  }

  // 3. Delete all chunks for this session (batched by 500)
  const chunksSnapshot = await db.collection('chunks')
    .where('sessionId', '==', sessionId)
    .get();

  if (!chunksSnapshot.empty) {
    const BATCH_LIMIT = 500;
    const docs = chunksSnapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const docBatch = docs.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();
      docBatch.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
  }
}

