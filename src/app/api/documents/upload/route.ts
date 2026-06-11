import '@/lib/dns-patch';
import { NextResponse } from 'next/server';
import { ingestDocument, ingestImageDocument } from '@/lib/rag-pipeline';
import { verifySession } from '@/lib/firebase-admin';

export const maxDuration = 60; // PDF processing + embeddings can take a while

export async function POST(req: Request) {
  try {
    // 1. Verify session token
    let sessionId: string;
    try {
      sessionId = await verifySession(req);
    } catch (authError) {
      const err = authError as Error;
      return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Send a PDF or image file (PNG, JPG, WEBP) in the "file" field.' },
        { status: 400 }
      );
    }

    // 2. Enforce 15MB file size limit
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 15MB limit. Please upload a smaller document.' },
        { status: 400 }
      );
    }

    const filenameLower = file.name.toLowerCase();
    const isPDF = file.type === 'application/pdf' || filenameLower.endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || 
                    /\.(png|jpe?g|webp)$/i.test(filenameLower);

    if (!isPDF && !isImage) {
      return NextResponse.json(
        { error: 'Only PDF and image files (PNG, JPEG, WEBP) are supported.' },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);


    // Run the ingestion pipeline
    let result;
    if (isPDF) {
      result = await ingestDocument(buffer, file.name, sessionId);
    } else {
      let mimeType = file.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        if (filenameLower.endsWith('.png')) mimeType = 'image/png';
        else if (filenameLower.endsWith('.webp')) mimeType = 'image/webp';
        else mimeType = 'image/jpeg'; // fallback
      }
      result = await ingestImageDocument(buffer, mimeType, file.name, sessionId);
    }

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      filename: result.filename,
      chunkCount: result.chunkCount,
      totalPages: result.totalPages,
      type: isPDF ? 'pdf' : 'image',
    });
  } catch (error) {
    const err = error as Error;
    console.error('[Upload Error]', err);
    const isScannedError = err.message && err.message.includes('SCANNED_PDF_ERROR');
    
    return NextResponse.json(
      { 
        error: err.message || 'Failed to process document.',
        code: isScannedError ? 'SCANNED_PDF_ERROR' : 'UNKNOWN'
      },
      { status: isScannedError ? 422 : 500 }
    );
  }
}

