import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  isCollaboratingAtom,
  roomIdAtom,
  activeModalAtom,
  remoteUsersAtom,
  diagramAtom,
} from '../store/atoms';
import { Share2, Lock, Users, Copy, Check, X, ShieldCheck } from 'lucide-react';

export function CollaborateModal() {
  const [isCollaborating, setIsCollaborating] = useAtom(isCollaboratingAtom);
  const [roomId, setRoomId] = useAtom(roomIdAtom);
  const [, setActiveModal] = useAtom(activeModalAtom);
  const [remoteUsers] = useAtom(remoteUsersAtom);
  const [copied, setCopied] = useState(false);

  const startSession = () => {
    const newRoomId = `room-${Math.random().toString(36).substr(2, 9)}`;
    setRoomId(newRoomId);
    setIsCollaborating(true);
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-500/10">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
            <Share2 className="w-5 h-5" />
            <h3 className="font-semibold text-base">E2EE Live Collaboration</h3>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm">
          {!isCollaborating ? (
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                  Start End-to-End Encrypted Session
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Transmitted canvas edits and cursor updates are encrypted directly in your browser using the Web Crypto API (AES-GCM). The server never sees raw diagram data.
                </p>
              </div>

              <button
                onClick={startSession}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create Live Session Link</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-semibold text-xs text-emerald-800 dark:text-emerald-300 block">
                    Session Active & Encrypted
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-mono">
                    Room ID: {roomId}
                  </span>
                </div>
              </div>

              {/* Shareable Link Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Shareable Room Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}?room=${roomId}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={copyRoomLink}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Connected Users List */}
              <div>
                <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider block mb-2">
                  Active Users ({remoteUsers.length + 1})
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">You (Host)</span>
                    <span className="text-emerald-600 font-bold">Online</span>
                  </div>
                  {remoteUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                      <span className="text-emerald-600 font-bold">Connected</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
