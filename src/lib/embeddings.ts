import './dns-patch';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';

// Ensure the Google Generative AI SDK picks up the correct environment variable
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

const EMBEDDING_MODEL = 'gemini-embedding-2';
const MAX_BATCH_SIZE = 100;

/**
 * Generate embeddings for an array of text strings using Gemini.
 * Returns an array of number[] vectors in the same order.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);

    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel(EMBEDDING_MODEL),
      values: batch,
    });

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * Generate a single embedding for a query string.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([query]);
  return embedding;
}

