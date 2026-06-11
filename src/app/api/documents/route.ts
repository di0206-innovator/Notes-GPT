import '@/lib/dns-patch';
import { NextResponse } from 'next/server';
import { listDocuments, deleteDocument } from '@/lib/vector-store';
import { verifySession } from '@/lib/firebase-admin';

/**
 * GET /api/documents — list all ingested documents
 */
export async function GET(req: Request) {
  try {
    let sessionId: string;
    try {
      sessionId = await verifySession(req);
    } catch (authError) {
      const err = authError as Error;
      return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
    }

    const documents = await listDocuments(sessionId);
    return NextResponse.json({ documents });
  } catch (error) {
    const err = error as Error;
    console.error('[Documents List Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list documents.' },
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
    let sessionId: string;
    try {
      sessionId = await verifySession(req);
    } catch (authError) {
      const err = authError as Error;
      return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required.' },
        { status: 400 }
      );
    }

    const deleted = await deleteDocument(documentId, sessionId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Document not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, documentId });
  } catch (error) {
    const err = error as Error;
    console.error('[Documents Delete Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete document.' },
      { status: 500 }
    );
  }
}

