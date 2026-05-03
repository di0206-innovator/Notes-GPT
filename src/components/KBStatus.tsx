"use client";

import React, { useState, useEffect } from "react";
import { Book, CheckCircle, Database, Info, Loader2 } from "lucide-react";

interface Document {
  id: string;
  metadata: {
    name: string;
    [key: string]: any;
  };
}

export const KBStatus = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch KB status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm cursor-help hover:bg-white/10 transition-all duration-300">
        <div className="relative">
          <Database className="w-4 h-4 text-primary" />
          {documents.length > 0 && !isLoading && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground/90">
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              `${documents.length} Docs`
            )}
          </span>
        </div>
      </div>

      {/* Tooltip/Popover */}
      {isHovered && !isLoading && (
        <div className="absolute top-full right-0 mt-3 w-64 p-4 rounded-2xl bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl z-[60] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50 flex items-center gap-2">
              <Book className="w-3 h-3" />
              Knowledge Base
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold border border-green-500/20">
              Live
            </span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {documents.length === 0 ? (
              <div className="py-4 text-center">
                <Info className="w-5 h-5 text-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-foreground/40 italic">No documents uploaded yet</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 group/item">
                  <CheckCircle className="w-3 h-3 text-primary/60 group-hover/item:text-primary transition-colors" />
                  <span className="text-xs text-foreground/70 truncate group-hover/item:text-foreground transition-colors">
                    {doc.metadata.name}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-foreground/30 flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
            Auto-syncing with vector store
          </div>
        </div>
      )}
    </div>
  );
};
