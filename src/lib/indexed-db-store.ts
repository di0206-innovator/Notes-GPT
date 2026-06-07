/**
 * IndexedDB Store for Local Device Mode.
 * Runs entirely on the client-side browser.
 * Guarded against SSR build-time execution.
 */

const DB_NAME = 'CampusStudyDB';
const DB_VERSION = 1;

export interface LocalDocument {
  documentId: string;
  filename: string;
  chunkCount: number;
  totalPages: number;
  uploadedAt: string;
  type: 'pdf' | 'image';
}

export interface LocalChunk {
  id: string;
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
}

// Check if IndexedDB is available
const isBrowser = typeof window !== 'undefined';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'documentId' });
      }
      if (!db.objectStoreNames.contains('chunks')) {
        db.createObjectStore('chunks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('studyKits')) {
        db.createObjectStore('studyKits', { keyPath: 'kitId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a document and its chunks locally.
 */
export async function saveLocalDocument(
  doc: LocalDocument,
  chunks: LocalChunk[]
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents', 'chunks'], 'readwrite');
    const docStore = transaction.objectStore('documents');
    const chunkStore = transaction.objectStore('chunks');

    docStore.put(doc);
    chunks.forEach((chunk) => {
      chunkStore.put(chunk);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * List all locally ingested documents.
 */
export async function getLocalDocuments(): Promise<LocalDocument[]> {
  if (!isBrowser) return [];
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('documents', 'readonly');
    const store = transaction.objectStore('documents');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all local chunks stored in IndexedDB.
 */
export async function getLocalChunks(): Promise<LocalChunk[]> {
  if (!isBrowser) return [];
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chunks', 'readonly');
    const store = transaction.objectStore('chunks');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a local document and its chunks.
 */
export async function deleteLocalDocument(documentId: string): Promise<void> {
  const db = await getDB();
  
  // 1. Get all chunks first to find keys
  const allChunks = await new Promise<LocalChunk[]>((resolve, reject) => {
    const tx = db.transaction('chunks', 'readonly');
    const store = tx.objectStore('chunks');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  const keysToDelete = allChunks
    .filter((c) => c.documentId === documentId)
    .map((c) => c.id);

  // 2. Perform deletions in transaction
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents', 'chunks'], 'readwrite');
    const docStore = transaction.objectStore('documents');
    const chunkStore = transaction.objectStore('chunks');

    docStore.delete(documentId);
    keysToDelete.forEach((key) => {
      chunkStore.delete(key);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Save generated local study kit.
 */
export async function saveLocalStudyKit(studyKit: Record<string, unknown>): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('studyKits', 'readwrite');
    const store = transaction.objectStore('studyKits');
    store.put({ kitId: 'current', ...studyKit });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Retrieve current local study kit.
 */
export async function getLocalStudyKit(): Promise<Record<string, unknown> | null> {
  if (!isBrowser) return null;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('studyKits', 'readonly');
      const store = transaction.objectStore('studyKits');
      const request = store.get('current');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Clear all local databases.
 */
export async function clearLocalStore(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents', 'chunks', 'studyKits'], 'readwrite');
    transaction.objectStore('documents').clear();
    transaction.objectStore('chunks').clear();
    transaction.objectStore('studyKits').clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * High-efficiency Client-Side TF-IDF Retrieval.
 * Searches IndexedDB chunks, tokenizes text, computes weights, and returns top-K.
 * Zero-battery usage, offline, and private.
 */
export async function searchLocalChunks(
  query: string,
  topK = 5
): Promise<{ content: string; filename: string; pageNumber: number; score: number }[]> {
  if (!isBrowser) return [];
  
  const db = await getDB();
  const chunks: LocalChunk[] = await new Promise((resolve, reject) => {
    const transaction = db.transaction('chunks', 'readonly');
    const store = transaction.objectStore('chunks');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  if (chunks.length === 0) return [];

  // Helper: tokenize and lowercase words
  const tokenize = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2); // skip short filler words
  };

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) {
    // Return first few chunks if search terms are empty
    return chunks.slice(0, topK).map((c) => ({
      content: c.content,
      filename: c.filename,
      pageNumber: c.pageNumber,
      score: 1.0,
    }));
  }

  // 1. Calculate Document Frequency (DF) for each query term
  const df: Record<string, number> = {};
  queryTerms.forEach((term) => {
    let count = 0;
    chunks.forEach((chunk) => {
      if (chunk.content.toLowerCase().includes(term)) {
        count++;
      }
    });
    df[term] = count;
  });

  // Total number of chunks
  const N = chunks.length;

  // 2. Score each chunk using TF-IDF
  const scoredChunks = chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    queryTerms.forEach((term) => {
      // Term Frequency (TF) in current chunk
      const termCount = contentLower.split(term).length - 1;
      if (termCount > 0) {
        const tf = 1 + Math.log10(termCount); // Logarithmic TF scaling
        
        // Inverse Document Frequency (IDF)
        const docFreq = df[term] || 0;
        const idf = Math.log10((N + 1) / (docFreq + 0.5)); // Smooth IDF
        
        score += tf * idf;
      }
    });

    return {
      content: chunk.content,
      filename: chunk.filename,
      pageNumber: chunk.pageNumber,
      score,
    };
  });

  // 3. Sort by TF-IDF score descending and return top-K
  return scoredChunks
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
