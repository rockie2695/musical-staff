'use client';

import { useState } from 'react';
import { NoteDuration } from '@/types';
import MusicStaff from '@/components/MusicStaff';
import PlaybackControls from '@/components/PlaybackControls';
import { useStaffNotes } from '@/hooks/useStaffNotes';

export default function Home() {
  const { notes, addNote, removeNoteAt, clearNotes } = useStaffNotes();
  const [noteDuration, setNoteDuration] = useState<NoteDuration>('q');
  const [isRestMode, setIsRestMode] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      <header className="px-6 py-4 border-b border-zinc-200 shrink-0">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">五線譜</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          點擊五線譜的線或空間來加入或移除音符
        </p>
      </header>

      <main className="flex-1 p-4 sm:p-6 pb-36 min-w-0">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3 sm:p-4">
          <MusicStaff
            notes={notes}
            noteDuration={noteDuration}
            isRestMode={isRestMode}
            onAddNote={addNote}
            onRemoveNoteAt={removeNoteAt}
          />
        </div>

        {notes.length > 0 && (
          <div className="mt-4 flex justify-center gap-4 items-center">
            <span className="text-sm text-zinc-400">
              {notes.length} 個記號
            </span>
            <span className="text-zinc-300">·</span>
            <button
              onClick={clearNotes}
              className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              清除全部
            </button>
          </div>
        )}
      </main>

      <PlaybackControls
        notes={notes}
        noteDuration={noteDuration}
        onDurationChange={setNoteDuration}
        isRestMode={isRestMode}
        onRestModeChange={setIsRestMode}
      />
    </div>
  );
}
