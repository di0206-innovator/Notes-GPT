import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext, formatContextForLLM } from '@/lib/rag-pipeline';
import { generateChatResponse } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 });
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role !== 'user') {
      return NextResponse.json({ error: 'Latest message must be from user' }, { status: 400 });
    }

    const query = latestMessage.content;
    
    // 1. Retrieve relevant context via the RAG pipeline
    const relevantChunks = await retrieveContext(query, 5);
    
    // 2. Format context for the LLM
    const contextText = formatContextForLLM(relevantChunks);
      
    // 3. Construct the system prompt
    const systemPrompt = `You are a helpful AI assistant for CampusGPT. 
You answer questions based on the provided document extracts. 
If the answer is not contained within the context, you should say "I don't have enough information from the uploaded documents to answer that.", but you can try to provide a general helpful answer if appropriate, while clarifying that it's not from the documents.
Always cite your sources by mentioning the filename and page number if you use information from the context.

${contextText}
`;

    // Prepare messages for OpenAI
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 4. Generate Response
    const responseText = await generateChatResponse(apiMessages);

    return NextResponse.json({
      role: 'assistant',
      content: responseText
    });

  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
