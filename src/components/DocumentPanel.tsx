'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface Document {
  documentId: string;
  filename: string;
  chunkCount: number;
  totalPages: number;
  uploadedAt: string;
}

export default function DocumentPanel() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadStatus({
        type: 'success',
        message: `"${data.filename}" uploaded — ${data.chunkCount} chunks from ${data.totalPages} pages`,
      });

      // Refresh document list
      await fetchDocuments();
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  }

  async function handleDelete(documentId: string) {
    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.documentId !== documentId));
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Documents
        </h3>
        <span className="text-xs text-slate-500">
          {documents.length} uploaded
        </span>
      </div>

      {/* Upload Button */}
      <label
        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          uploading
            ? 'border-blue-500/30 bg-blue-500/5 cursor-wait'
            : 'border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/10'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-xs text-blue-400">Processing PDF...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Upload PDF</span>
          </>
        )}
        <input
          type="file"
          accept=".pdf"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {/* Upload Status */}
      {uploadStatus && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{uploadStatus.message}</span>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-white/30 hover:text-white/60"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              No documents yet.
              <br />
              Upload a PDF to get started.
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.documentId}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {doc.filename}
                </p>
                <p className="text-[10px] text-slate-500">
                  {doc.totalPages} pages · {doc.chunkCount} chunks
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.documentId)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                title="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
