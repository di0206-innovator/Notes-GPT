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
          const res = await fetch('/api/documents', {
            headers: {
              'x-session-id': sessionId,
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

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
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

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: {
            'x-session-id': sessionId,
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
        const res = await fetch('/api/documents', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
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

  // Drag and drop handlers
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
    <div className="flex flex-col gap-5 h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Source Materials
          </h3>
          <span className="text-[10px] text-slate-500">
            {documents.length} files loaded
          </span>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          dragOver
            ? 'border-purple-500 bg-purple-500/10 scale-[0.98]'
            : uploading
            ? 'border-purple-500/30 bg-purple-500/5 cursor-wait'
            : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10'
        }`}
      >
        <input
          type="file"
          accept=".pdf, image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-center py-2">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            <span className="text-[11px] text-purple-300 font-medium">{uploadStage}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center py-2 pointer-events-none">
            <Upload className="w-5 h-5 text-slate-400" />
            <span className="text-xs text-slate-300 font-semibold">
              Drop files here or click
            </span>
            <span className="text-[9px] text-slate-500">
              Supports PDF, PNG, JPG, WEBP
            </span>
          </div>
        )}
      </div>

      {/* Upload Status / Errors */}
      {uploadStatus && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl text-[11px] leading-normal ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
          )}
          <div className="flex-1">
            {uploadStatus.code === 'SCANNED_PDF_ERROR' ? (
              <p className="font-semibold text-red-300">
                Scanned PDF Detected:
                <span className="font-normal block mt-1 text-slate-300">
                  This document has no selectable text. Please upload it as note images (PNG/JPG) to run handwritten OCR.
                </span>
              </p>
            ) : (
              <span className="font-medium">{uploadStatus.message}</span>
            )}
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-white/30 hover:text-white/60 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scrollable Document List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 border border-white/5 bg-slate-900/10 rounded-2xl">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-[11px] text-slate-500 leading-normal">
              No files uploaded yet.
              <br />
              Add notes to get started.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isPDF = doc.filename.toLowerCase().endsWith('.pdf');
            return (
              <div
                key={doc.documentId}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] hover:border-white/10 transition-all"
              >
                <div className={`p-2 rounded-lg ${isPDF ? 'bg-purple-500/10 text-purple-400' : 'bg-pink-500/10 text-pink-400'}`}>
                  {isPDF ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-200 truncate" title={doc.filename}>
                    {doc.filename}
                  </p>
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                    {isPDF ? `${doc.totalPages} pages` : 'Image Note'} · {doc.chunkCount} chunks
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.documentId)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
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
        <div className="border-t border-white/5 pt-4 bg-[#0F0F12]/80 mt-auto">
          <button
            onClick={onGenerateStudyKit}
            disabled={isGeneratingStudyKit || documents.length === 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
          >
            {isGeneratingStudyKit ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating Kit...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-300 group-hover:animate-pulse" />
                {hasStudyKit ? 'Update Study Kit' : 'Generate Study Kit'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
