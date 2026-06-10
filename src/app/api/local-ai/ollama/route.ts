import { NextResponse } from 'next/server';

/**
 * Next.js App Router POST Handler for Local Ollama AI proxying.
 * 
 * --- Developer Context ---
 * Browsers block direct AJAX requests from origins like 'http://localhost:3000' to
 * Ollama's local port 'http://localhost:11434' due to CORS (Cross-Origin Resource Sharing).
 * Rather than asking the developer/end-user to configure system environment variables
 * (e.g. OLLAMA_ORIGIN=*), this endpoint acts as a server-side node proxy. 
 * Node-to-Node fetches do not trigger browser CORS policies, allowing seamless out-of-the-box local connection.
 * 
 * Supported payloads in JSON body:
 * @param {string} action - 'check' to verify connection/model, or undefined/null for normal generation
 * @param {string} url - Target URL of the local Ollama instance (defaults to http://localhost:11434)
 * @param {string} model - Ollama model identifier (e.g. 'deepseek-r1:8b', 'gemma2:2b')
 * @param {string} systemPrompt - Strict grounding instruction guidelines for RAG
 * @param {string} userPrompt - User's query + retrieved database context segments
 * @param {number} temperature - Generation creativity variance (0.1 - 1.0)
 */
export async function POST(req: Request) {
  try {
    const { action, url, model, systemPrompt, userPrompt, temperature } = await req.json();
    
    if (url) {
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return NextResponse.json(
            { error: 'Invalid URL protocol. Only HTTP and HTTPS protocols are permitted.' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Malformed Ollama URL. Please provide a valid HTTP/HTTPS endpoint.' },
          { status: 400 }
        );
      }
    }

    const baseUrl = (url || 'http://localhost:11434').replace(/\/$/, '');

    // --- Action: Check Connection & Model Status ---
    if (action === 'check') {
      try {
        const response = await fetch(`${baseUrl}/api/tags`, {
          method: 'GET',
          // 3-second timeout to prevent the server from hanging indefinitely if Ollama is closed
          signal: AbortSignal.timeout(3000),
        });
        
        if (!response.ok) {
          return NextResponse.json({
            available: false,
            message: `Ollama server returned status ${response.status}.`,
          });
        }
        
        const data = await response.json();
        const modelsList = data.models || [];
        const modelNames = modelsList.map((m: { name: string }) => m.name);
        
        // Match exact name, latest tag, or prefix patterns
        const hasModel = modelNames.includes(model) || 
                         modelNames.includes(`${model}:latest`) ||
                         modelNames.some((m: string) => m.startsWith(model));

        if (modelsList.length === 0) {
          return NextResponse.json({
            available: true,
            hasModel: false,
            message: `Ollama is running, but no models are downloaded. Run 'ollama pull ${model || 'gemma2:2b'}' in your terminal.`,
          });
        }

        if (!hasModel) {
          return NextResponse.json({
            available: true,
            hasModel: false,
            message: `Ollama is running, but model '${model}' is not pulled. Run 'ollama pull ${model}' in your terminal.`,
          });
        }

        return NextResponse.json({
          available: true,
          hasModel: true,
          message: `Connected to Ollama! Using model: ${model}`,
        });
      } catch {
        return NextResponse.json({
          available: false,
          message: `Cannot connect to Ollama at ${baseUrl}. Ensure the Ollama app is running.`,
        });
      }
    }

    // --- Action: Standard Chat Inference ---
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'gemma2:2b',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: userPrompt },
          ],
          options: {
            temperature: temperature ?? 0.2,
          },
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return NextResponse.json(
          { error: `Ollama server error (HTTP ${response.status}): ${errText}` },
          { status: 500 }
        );
      }

      const data = await response.json();
      const text = data.message?.content || '';
      return NextResponse.json({ text });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `Failed to connect to Ollama: ${errMsg}. Make sure Ollama is running.` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
