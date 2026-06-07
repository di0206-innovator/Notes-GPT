import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/rag-pipeline';

/**
 * POST /api/upload — Ingest a PDF (legacy endpoint).
 * The primary upload endpoint is /api/documents/upload.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const sessionId = request.headers.get('x-session-id') || 'global-default';
    const result = await ingestDocument(buffer, file.name, sessionId);

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      filename: result.filename,
      chunkCount: result.chunkCount,
    });

  } catch (error) {
    const err = error as Error;
    console.error('Error in upload route:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
