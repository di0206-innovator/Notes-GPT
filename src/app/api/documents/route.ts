import { NextResponse } from 'next/server';
import { listDocuments, deleteDocument } from '@/lib/vector-store';

/**
 * GET /api/documents — list all ingested documents
 */
export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('[Documents List Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list documents.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents — delete a document by ID
 * Expects JSON body: { documentId: string }
 */
export async function DELETE(req: Request) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required.' },
        { status: 400 }
      );
    }

    const deleted = await deleteDocument(documentId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Document not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, documentId });
  } catch (error: any) {
    console.error('[Documents Delete Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document.' },
      { status: 500 }
    );
  }
}
