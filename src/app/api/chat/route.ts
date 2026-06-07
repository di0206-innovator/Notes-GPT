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
    const sessionId = request.headers.get('x-session-id') || 'global-default';
    
    // 1. Retrieve relevant context via the RAG pipeline
    const relevantChunks = await retrieveContext(query, sessionId, 5);
    
    // 2. Format context for the LLM
    const contextText = formatContextForLLM(relevantChunks);
      
    // 3. Construct the system prompt
    const systemPrompt = `You are a highly precise and strict AI study assistant for CampusStudyGPT.
Your primary task is to answer user questions based ONLY on the provided context excerpts from the uploaded study materials.

Follow these rules strictly:
1. Grounding: Keep your answers strictly based on the retrieved excerpts. Do not invent facts, introduce outside information, or hallucinate.
2. If the answer is not contained in the provided excerpts, state clearly: "I don't have enough information from the uploaded documents to answer that."
3. Citations: You must always cite your sources when presenting information from the context. Use the format [Source: filename, p.X] inline where the fact is mentioned.
4. Formats: Format your output in clean Markdown. For mathematical equations, use LaTeX notation enclosed in double dollar signs (e.g. $$E = mc^2$$).
5. Unclear OCR: If the user refers to parts of documents that contain "[OCR_UNCERTAIN: ...]", remind them that those sections were flagged as unreadable in their original notes.

Here is the retrieved context:
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

  } catch (error) {
    const err = error as Error;
    console.error('Error in chat route:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
