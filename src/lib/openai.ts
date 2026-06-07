import OpenAI from 'openai';

// Ensure this is not used in Edge Runtime if using file system features, 
// but for standard OpenAI API calls, it's fine.
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is missing from environment variables.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-build',
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  });
  
  return response.data[0].embedding;
}

export async function generateChatResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages as OpenAI.ChatCompletionMessageParam[],
    temperature: 0.2,
  });
  
  return response.choices[0].message.content || '';
}
