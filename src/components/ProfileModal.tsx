'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Copy, Check, ShieldCheck, Calendar, FileText, Database, LogOut, Trash2, Save, Loader2 } from 'lucide-react';
import { getLocalDocuments, getLocalChunks } from '@/lib/indexed-db-store';
import { auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  mode: 'cloud' | 'local';
  onLogout?: () => void;
}

export default function ProfileModal({ isOpen, onClose, userId, mode, onLogout }: ProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Profile configuration states
  const isLocalGuest = userId === 'local-guest-user';
  const email = auth.currentUser?.email || (isLocalGuest ? 'LOCAL_GUEST@OFFLINE.SYSTEM' : 'GUEST_USER@NOTES.INTERNAL');
  const creationTime = auth.currentUser?.metadata.creationTime || 'SYSTEM INITIALIZED';

  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  // Data wiping states
  const [wiping, setWiping] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [wipeSuccess, setWipeSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (isLocalGuest) {
      setDisplayName(localStorage.getItem('notes_gpt_guest_name') || 'Guest User');
    } else if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || '');
    }

    const loadStats = async () => {
      setLoadingStats(true);
      try {
        if (mode === 'local' || isLocalGuest) {
          const docs = await getLocalDocuments();
          const chunks = await getLocalChunks();
          setDocCount(docs.length);
          setChunkCount(chunks.length);
        } else {
          // Fetch from cloud documents API
          const idToken = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/documents', {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });
          const data = await res.json();
          const docs = data.documents || [];
          setDocCount(docs.length);
          const totalChunks = docs.reduce((acc: number, d: { chunkCount: number }) => acc + (d.chunkCount || 0), 0);
          setChunkCount(totalChunks);
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [isOpen, userId, mode, isLocalGuest]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async () => {
    setNameError(null);
    setNameSuccess(null);
    setSavingName(true);
    try {
      if (isLocalGuest) {
        localStorage.setItem('notes_gpt_guest_name', displayName);
        setNameSuccess('Guest name updated locally.');
      } else if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: displayName });
        setNameSuccess('Profile name updated successfully.');
      }
    } catch (err) {
      setNameError('Failed to update name.');
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  const handleWipeData = async () => {
    const confirmed = confirm(
      "CRITICAL WARNING:\nAre you sure you want to permanently delete all your documents, vector chunks, and study kits?\nThis action CANNOT be undone."
    );
    if (!confirmed) return;

    setWiping(true);
    setWipeError(null);
    setWipeSuccess(null);
    try {
      // 1. Wipe local IndexedDB
      const { clearLocalStore } = await import('@/lib/indexed-db-store');
      await clearLocalStore();

      // 2. Wipe Cloud Firestore if in cloud mode
      if (!isLocalGuest) {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/documents', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ documentId: 'all' }),
        });

        if (!res.ok) {
          throw new Error('Failed to purge cloud documents.');
        }
      }

      setWipeSuccess('All user data purged successfully.');
      setTimeout(() => {
        if (onLogout) {
          onLogout();
        } else {
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      setWipeError('Failed to purge system data.');
      console.error(err);
    } finally {
      setWiping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="w-full max-w-md border-2 border-white bg-black p-6 retro-shadow text-white relative font-mono max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-5">
          <div className="flex items-center gap-2">
            <User className="w-4.5 h-4.5" />
            <span className="font-bold text-xs uppercase tracking-wider">[ USER_PROFILE_SHELL ]</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-transparent hover:border-white text-white transition-all"
            title="Close Profile"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* User Card */}
        <div className="space-y-5">
          
          {/* Identity details */}
          <div className="flex flex-col gap-3.5 border-2 border-white p-4 bg-white/5 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-white flex items-center justify-center bg-black">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase text-white/50 tracking-wider">ACTIVE_IDENTITY</p>
                <p className="text-xs font-bold truncate text-white uppercase">{email}</p>
              </div>
            </div>

            <div className="border-t border-dashed border-white/20 pt-3 flex flex-col gap-2">
              <div>
                <span className="text-[9px] uppercase text-white/50 block">SESSION_UID:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[9px] bg-black border border-white/30 px-2 py-1 flex-1 truncate font-mono text-white">
                    {userId}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="retro-button p-1 text-[9px] flex items-center justify-center flex-shrink-0"
                    title="Copy User ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Configuration */}
          <div className="border border-white/30 p-4 bg-black space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white block">
              [ PROFILE_SETTINGS ]
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] text-white/60 uppercase">Display Name</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="retro-input flex-1 text-xs font-mono py-1.5"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="retro-button px-3 py-1 flex items-center gap-1.5 text-xs font-bold"
                  title="Save Name"
                >
                  {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>SAVE</span>
                </button>
              </div>
            </div>
            {nameError && <p className="text-[10px] text-red-500 font-bold uppercase">ERROR: {nameError}</p>}
            {nameSuccess && <p className="text-[10px] text-green-400 font-bold uppercase">SUCCESS: {nameSuccess}</p>}
          </div>

          {/* Session Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-white/25 p-3 bg-white/5 text-xs flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-white/50 text-[9px] uppercase mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SHELL TYPE</span>
              </div>
              <span className="font-bold text-[10px] text-white uppercase">
                {isLocalGuest ? 'LOCAL BYPASS' : auth.currentUser?.isAnonymous ? 'CLOUD GUEST' : 'REGISTERED'}
              </span>
            </div>
            <div className="border border-white/25 p-3 bg-white/5 text-xs flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-white/50 text-[9px] uppercase mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>ACTIVE_SINCE</span>
              </div>
              <span className="font-bold text-[10px] text-white uppercase truncate">
                {creationTime}
              </span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white">
              [ STATS_MONITOR ]
            </label>
            <div className="border-2 border-white divide-y-2 divide-white">
              <div className="flex items-center justify-between p-3 bg-black">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  <span className="text-[9px] uppercase font-bold text-white/80">INDEXED DOCUMENTS</span>
                </div>
                {loadingStats ? (
                  <span className="text-[10px] animate-pulse">...</span>
                ) : (
                  <span className="text-xs font-bold border border-white px-2.5 py-0.5 bg-white text-black font-mono">
                    {docCount}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-black">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-white" />
                  <span className="text-[9px] uppercase font-bold text-white/80">COMPILED VECTOR CHUNKS</span>
                </div>
                {loadingStats ? (
                  <span className="text-[10px] animate-pulse">...</span>
                ) : (
                  <span className="text-xs font-bold border border-white px-2.5 py-0.5 bg-white text-black font-mono">
                    {chunkCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* System Operations Section */}
          <div className="space-y-2.5 pt-2 border-t border-dashed border-white/20">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white block">
              [ SYSTEM_OPERATIONS ]
            </label>
            <div className="flex flex-col gap-3">
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="retro-button border-white text-white hover:bg-white hover:text-black w-full py-2 flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LOGOUT SESSION</span>
                </button>
              )}

              <button
                onClick={handleWipeData}
                disabled={wiping}
                className="retro-button border-red-600 text-red-500 hover:bg-red-600 hover:text-white w-full py-2 flex items-center justify-center gap-2 text-xs font-bold bg-red-950/20"
              >
                {wiping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>WIPE ALL SYSTEM DATA</span>
              </button>
            </div>
            {wipeError && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">ERROR: {wipeError}</p>}
            {wipeSuccess && <p className="text-[10px] text-green-400 font-bold uppercase mt-1">SUCCESS: {wipeSuccess}</p>}
          </div>

        </div>

        {/* Footer tip */}
        <div className="mt-6 text-center border-t border-dashed border-white/20 pt-4 text-[9px] text-white/50 uppercase">
          NotesGPT Secure Local Workstation Shell
        </div>
      </motion.div>
    </div>
  );
}
