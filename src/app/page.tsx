'use client';

import { useState } from 'react';
import { NoteDuration, StaffNoteAccidental } from '@/types';
import MusicStaff from '@/components/MusicStaff';
import PlaybackControls from '@/components/PlaybackControls';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useStaffNotes } from '@/hooks/useStaffNotes';
import { I18nProvider, useLocale } from '@/i18n/I18nContext';

function HomeContent() {
  const { notes, addNote, removeNoteAt, clearNotes, addTupletNotes, markSlurNotes } =
    useStaffNotes();
  const [noteDuration, setNoteDuration] = useState<NoteDuration>('q');
  const [isRestMode, setIsRestMode] = useState(false);
  const [accidental, setAccidental] = useState<StaffNoteAccidental | null>(null);
  const [accent, setAccent] = useState(false);
  const [tupletActive, setTupletActive] = useState(false);
  const [slurActive, setSlurActive] = useState(false);
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      <header className="px-6 py-4 border-b border-zinc-200 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{t('app.subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 p-4 sm:p-6 pb-36 min-w-0">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3 sm:p-4">
          <MusicStaff
            notes={notes}
            noteDuration={noteDuration}
            isRestMode={isRestMode}
            accidental={accidental}
            accent={accent}
            tupletActive={tupletActive}
            slurActive={slurActive}
            onAddNote={addNote}
            onAddTuplet={addTupletNotes}
            onMarkSlurNotes={markSlurNotes}
            onRemoveNoteAt={removeNoteAt}
          />
        </div>

        {notes.length > 0 && (
          <div className="mt-4 flex justify-center gap-4 items-center">
            <span className="text-sm text-zinc-400">
              {t('staff.notesCount').replace('{count}', String(notes.length))}
            </span>
            <span className="text-zinc-300">·</span>
            <button
              onClick={clearNotes}
              className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              {t('staff.clearAll')}
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
        accidental={accidental}
        onAccidentalChange={setAccidental}
        accent={accent}
        onAccentChange={setAccent}
        tupletActive={tupletActive}
        onTupletActiveChange={setTupletActive}
        slurActive={slurActive}
        onSlurActiveChange={setSlurActive}
      />
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
