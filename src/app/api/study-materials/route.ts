import { NextRequest, NextResponse } from 'next/server';
import { generateStudyKit } from '@/lib/study-generator';
import { listDocuments, getCloudStudyKit, saveCloudStudyKit } from '@/lib/vector-store';

export const maxDuration = 60; // Generating summaries, flashcards, MCQs and exams takes a while

/**
 * GET /api/study-materials
 * Returns the currently generated study kit from Firestore, or null.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id') || 'global-default';
    const documents = await listDocuments(sessionId);
    
    if (documents.length === 0) {
      return NextResponse.json({ studyKit: null, documentCount: 0 });
    }

    const studyKit = await getCloudStudyKit(sessionId);
    return NextResponse.json({ studyKit, documentCount: documents.length });
  } catch (error) {
    const err = error as Error;
    console.error('[StudyMaterials GET Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve study materials.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-materials
 * Triggers study kit generation/regeneration and saves it to Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id') || 'global-default';
    const documents = await listDocuments(sessionId);
    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'Please upload at least one document before generating study materials.' },
        { status: 400 }
      );
    }

    console.log('[StudyMaterials API] Generating study materials for', documents.length, 'documents in session:', sessionId);
    const studyKit = await generateStudyKit(sessionId);

    // Save to Firestore
    await saveCloudStudyKit(studyKit as unknown as Record<string, unknown>, sessionId);

    return NextResponse.json({ success: true, studyKit });
  } catch (error) {
    const err = error as Error;
    console.error('[StudyMaterials POST Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate study materials.' },
      { status: 500 }
    );
  }
}

