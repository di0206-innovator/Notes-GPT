import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/rag-pipeline';
import { verifySession } from '@/lib/firebase-admin';

/**
 * POST /api/upload — Ingest a PDF (legacy endpoint).
 * The primary upload endpoint is /api/documents/upload.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify session token
    let sessionId: string;
    try {
      sessionId = await verifySession(request);
    } catch (authError) {
      const err = authError as Error;
      return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 2. Enforce 15MB file limit
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 15MB limit. Please upload a smaller document.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
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
