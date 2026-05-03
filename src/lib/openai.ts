import OpenAI from 'openai';

// Ensure this is not used in Edge Runtime if using file system features, 
// but for standard OpenAI API calls, it's fine.
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is missing from environment variables.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  });
  
  return response.data[0].embedding;
}

export async function generateChatResponse(messages: any[]): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.2,
  });
  
  return response.choices[0].message.content || '';
}
