'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { getLocalDocuments, saveLocalDocument, deleteLocalDocument } from '@/lib/indexed-db-store';
import { auth } from '@/lib/firebase';
import { parsePDFClient, performLocalOCR } from '@/lib/local-parser';
import { chunkText } from '@/lib/chunker';

interface Document {
  documentId: string;
  filename: string;
  chunkCount: number;
  totalPages: number;
  uploadedAt: string;
  type?: 'pdf' | 'image';
}

interface DocumentPanelProps {
  onGenerateStudyKit: () => Promise<void>;
  isGeneratingStudyKit: boolean;
  hasStudyKit: boolean;
  refreshCounter: number;
  onRefresh: () => void;
  mode: 'cloud' | 'local';
  sessionId: string;
}

export default function DocumentPanel({
  onGenerateStudyKit,
  isGeneratingStudyKit,
  hasStudyKit,
  refreshCounter,
  onRefresh,
  mode,
  sessionId,
}: DocumentPanelProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    code?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  // Fetch documents on mount, when mode changes, or refreshCounter increments
  useEffect(() => {
    let active = true;
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        if (mode === 'local') {
          const docs = await getLocalDocuments();
          if (active) {
            setDocuments(docs || []);
          }
        } else {
          const idToken = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/documents', {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });
          const data = await res.json();
          if (active) {
            setDocuments(data.documents || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDocuments();
    return () => {
      active = false;
    };
  }, [refreshCounter, mode, sessionId]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadStatus(null);
    setUploadStage('Processing file...');

    const filenameLower = file.name.toLowerCase();
    const isPDF = file.type === 'application/pdf' || filenameLower.endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || 
                    /\.(png|jpe?g|webp)$/i.test(filenameLower);

    try {
      if (!isPDF && !isImage) {
        throw new Error('Only PDF and image files (PNG, JPEG, WEBP) are supported.');
      }

      if (mode === 'local') {
        let text = '';
        let pageTexts: string[] = [];
        let totalPages = 1;

        if (isPDF) {
          setUploadStage('Extracting PDF text locally...');
          const result = await parsePDFClient(file, (msg) => setUploadStage(msg));
          text = result.text;
          pageTexts = result.pageTexts;
          totalPages = result.totalPages;
        } else {
          setUploadStage('Running local OCR on note image...');
          text = await performLocalOCR(file, (msg) => setUploadStage(msg));
          pageTexts = [text];
          totalPages = 1;
        }

        if (!text.trim()) {
          throw new Error('No readable text was found in the document.');
        }

        setUploadStage('Chunking and storing locally...');
        const documentId = typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'local_' + Math.random().toString(36).substring(2, 11);

        const chunks = chunkText(text, documentId, file.name, pageTexts);

        const localDoc = {
          documentId,
          filename: file.name,
          chunkCount: chunks.length,
          totalPages,
          uploadedAt: new Date().toISOString(),
          type: (isPDF ? 'pdf' : 'image') as 'pdf' | 'image',
        };

        const localChunks = chunks.map((c, i) => ({
          id: `${documentId}_${i}`,
          documentId,
          filename: file.name,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          content: c.content,
        }));

        await saveLocalDocument(localDoc, localChunks);

        setUploadStatus({
          type: 'success',
          message: `"${file.name}" stored locally: ${chunks.length} chunks generated.`,
        });

        onRefresh();
      } else {
        setUploadStage(isPDF ? 'Uploading PDF...' : 'Uploading note image...');
        const formData = new FormData();
        formData.append('file', file);

        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw { message: data.error || 'Upload failed', code: data.code };
        }

        setUploadStatus({
          type: 'success',
          message: `"${data.filename}" processed: ${data.chunkCount} chunks generated.`,
        });

        onRefresh();
      }
    } catch (error) {
      const err = error as Error & { code?: string; message?: string };
      setUploadStatus({
        type: 'error',
        message: err.message || 'Processing failed.',
        code: err.code,
      });
    } finally {
      setUploading(false);
      setUploadStage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = ''; // Reset input
  };

  const handleDelete = async (documentId: string) => {
    try {
      if (mode === 'local') {
        await deleteLocalDocument(documentId);
        setDocuments((prev) => prev.filter((d) => d.documentId !== documentId));
        onRefresh();
      } else {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/documents', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ documentId }),
        });

        if (res.ok) {
          setDocuments((prev) => prev.filter((d) => d.documentId !== documentId));
          onRefresh();
        }
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full font-mono">
      
      {/* Sidebar Header */}
      <div className="flex flex-col border-b-2 border-white pb-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">
          [ SOURCE_MATERIALS ]
        </h3>
        <span className="text-[10px] text-white/60 mt-1">
          {documents.length} FILES LOADED
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed transition-all cursor-pointer ${
          dragOver
            ? 'border-white bg-white text-black'
            : uploading
            ? 'border-white/50 bg-black cursor-wait animate-pulse'
            : 'border-white/30 bg-black hover:border-white'
        }`}
      >
        <input
          type="file"
          accept=".pdf, image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-center py-2 text-white">
            <span className="text-[10px] font-bold uppercase animate-flash">[ UPLOADING ]</span>
            <span className="text-[9px] text-white/70 max-w-[150px] truncate">{uploadStage}</span>
          </div>
        ) : (
          <div className={`flex flex-col items-center gap-2 text-center py-2 ${dragOver ? 'text-black' : 'text-white'}`}>
            <Upload className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              DRAG OR SELECT
            </span>
            <span className="text-[8px] text-white/50 uppercase">
              PDF, PNG, JPG, WEBP
            </span>
          </div>
        )}
      </div>

      {/* Upload Status / Errors */}
      {uploadStatus && (
        <div className="border-2 border-white p-3 bg-black flex items-start gap-2.5 text-[10px] leading-normal text-white">
          {uploadStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            {uploadStatus.code === 'SCANNED_PDF_ERROR' ? (
              <div>
                <span className="font-bold block uppercase mb-1">[ SCANNED_PDF ]</span>
                This PDF has no selectable text. Please upload it as note images (PNG/JPG) to run OCR.
              </div>
            ) : (
              <div>
                <span className="font-bold block uppercase mb-1">
                  [{uploadStatus.type === 'success' ? 'SUCCESS' : 'CRITICAL_ERROR'}]
                </span>
                {uploadStatus.message}
              </div>
            )}
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-white hover:text-white/60 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scrollable Document List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-white/60 animate-flash">[ SCANNING... ]</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-white/20 bg-black">
            <FileText className="w-6 h-6 text-white/30 mx-auto mb-2" />
            <p className="text-[10px] text-white/50 uppercase leading-normal">
              No files active.
              <br />
              Upload files to index.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isPDF = doc.filename.toLowerCase().endsWith('.pdf');
            return (
              <div
                key={doc.documentId}
                className="flex items-center gap-3 p-3 border-2 border-white bg-black hover:bg-white hover:text-black group transition-colors"
              >
                <div className="p-1.5 border border-white flex-shrink-0">
                  {isPDF ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold truncate uppercase" title={doc.filename}>
                    {doc.filename}
                  </p>
                  <p className="text-[8px] opacity-70 font-semibold uppercase mt-0.5">
                    {isPDF ? `${doc.totalPages} PGS` : 'IMAGE'} · {doc.chunkCount} CHUNKS
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.documentId)}
                  className="p-1 border border-transparent hover:border-black text-white hover:bg-black hover:text-white group-hover:text-black group-hover:hover:text-white transition-all flex-shrink-0"
                  title="Delete document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Generate Study Kit CTA Button */}
      {documents.length > 0 && (
        <div className="border-t-2 border-white pt-4 bg-black mt-auto">
          <button
            onClick={onGenerateStudyKit}
            disabled={isGeneratingStudyKit || documents.length === 0}
            className="retro-button w-full py-3.5 flex items-center justify-center gap-2 group retro-shadow text-xs"
          >
            {isGeneratingStudyKit ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                [ COMPILING... ]
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {hasStudyKit ? '[ REBUILD STUDY KIT ]' : '[ COMPILE STUDY KIT ]'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
