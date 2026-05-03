import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPDF } from './pdf-extractor';
import { chunkText, TextChunk } from './chunker';
import { generateEmbeddings, generateQueryEmbedding } from './embeddings';
import { addDocumentChunks, search, DocumentMeta, StoredChunk } from './vector-store';

export interface IngestResult {
  documentId: string;
  filename: string;
  chunkCount: number;
  totalPages: number;
}

export interface RetrievedChunk {
  content: string;
  filename: string;
  pageNumber: number;
  score: number;
}

/**
 * Full ingestion pipeline: PDF buffer → extract → chunk → embed → store.
 */
export async function ingestDocument(
  buffer: Buffer,
  filename: string
): Promise<IngestResult> {
  const documentId = uuidv4();

  // 1. Extract text from PDF
  console.log(`[RAG] Extracting text from "${filename}"...`);
  const extracted = await extractTextFromPDF(buffer, filename);

  // 2. Chunk the text
  console.log(`[RAG] Chunking text (${extracted.totalPages} pages)...`);
  const chunks = chunkText(
    extracted.text,
    documentId,
    filename,
    extracted.pageTexts
  );
  console.log(`[RAG] Created ${chunks.length} chunks`);

  if (chunks.length === 0) {
    throw new Error('No text content could be extracted from this PDF.');
  }

  // 3. Generate embeddings for all chunks
  console.log(`[RAG] Generating embeddings for ${chunks.length} chunks...`);
  const chunkTexts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(chunkTexts);

  // 4. Store in vector store
  console.log(`[RAG] Storing chunks in vector store...`);
  const storedChunks = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  const meta: DocumentMeta = {
    documentId,
    filename,
    chunkCount: chunks.length,
    totalPages: extracted.totalPages,
    uploadedAt: new Date().toISOString(),
  };

  await addDocumentChunks(meta, storedChunks);
  console.log(`[RAG] Document "${filename}" ingested successfully (${chunks.length} chunks)`);

  return {
    documentId,
    filename,
    chunkCount: chunks.length,
    totalPages: extracted.totalPages,
  };
}

/**
 * Retrieve relevant context for a user query.
 * Returns the top-K most relevant chunks from all ingested documents.
 */
export async function retrieveContext(
  query: string,
  topK: number = 5
): Promise<RetrievedChunk[]> {
  // Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query);

  // Search the vector store
  const results = await search(queryEmbedding, topK);

  return results.map((r) => ({
    content: r.content,
    filename: r.filename,
    pageNumber: r.pageNumber,
    score: r.score,
  }));
}

/**
 * Format retrieved chunks into a context string for the LLM system prompt.
 */
export function formatContextForLLM(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant documents found. Answer based on your general knowledge and let the user know you don\'t have specific document context.';
  }

  let context = '## Retrieved Context from Uploaded Documents\n\n';
  context += 'Use the following excerpts to answer the user\'s question. Cite your sources using [Source: filename, p.X] format.\n\n';

  chunks.forEach((chunk, i) => {
    context += `### Excerpt ${i + 1} [Source: ${chunk.filename}, p.${chunk.pageNumber}]\n`;
    context += `${chunk.content}\n\n`;
  });

  context += '---\n';
  context += 'IMPORTANT: Base your answer on the retrieved excerpts above. If the answer is not in the excerpts, say so clearly. Always cite which document and page your information comes from.\n';

  return context;
}
