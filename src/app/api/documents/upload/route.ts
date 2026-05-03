import { NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/rag-pipeline';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

export const maxDuration = 60; // PDF processing + embeddings can take a while

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Send a PDF file in the "file" field.' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported.' },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save the PDF to disk for reference
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    writeFileSync(path.join(uploadsDir, safeName), buffer);

    // Run the ingestion pipeline
    const result = await ingestDocument(buffer, file.name);

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      filename: result.filename,
      chunkCount: result.chunkCount,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('[Upload Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document.' },
      { status: 500 }
    );
  }
}
