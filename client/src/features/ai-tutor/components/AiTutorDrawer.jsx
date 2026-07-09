import React from 'react';

export default function AiTutorDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 text-white z-50 p-4 shadow-2xl flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
        <h2 className="font-bold">AI Assistant</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto text-sm text-slate-300">
        Ask me anything about your current lesson.
      </div>
    </div>
  );
}
