'use client';

import { usePlayback } from '@/hooks/usePlayback';
import { StaffNote, NoteDuration, StaffNoteAccidental } from '@/types';
import { DURATION_CONFIG } from '@/utils/staffGeometry';

interface PlaybackControlsProps {
  notes: StaffNote[];
  noteDuration: NoteDuration;
  onDurationChange: (d: NoteDuration) => void;
  isRestMode: boolean;
  onRestModeChange: (r: boolean) => void;
  accidental?: StaffNoteAccidental | null;
  onAccidentalChange?: (a: StaffNoteAccidental | null) => void;
}

const DURATIONS: NoteDuration[] = ['h', 'q', '8', '16'];

export default function PlaybackControls({ notes, noteDuration, onDurationChange, isRestMode, onRestModeChange, accidental, onAccidentalChange }: PlaybackControlsProps) {
  const { isPlaying, togglePlay, stop } = usePlayback(notes);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-white/90 text-zinc-900 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm border border-zinc-200">

        {/* Note/Rest mode toggle */}
        <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
          <button
            onClick={() => onRestModeChange(false)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
              ${!isRestMode
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            title="音符模式"
          >
            音符
          </button>
          <button
            onClick={() => onRestModeChange(true)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isRestMode
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            title="休止符模式"
          >
            休止符
          </button>
        </div>

        {/* Duration selector */}
        <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                ${noteDuration === d
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              title={`${DURATION_CONFIG[d].label}`}
            >
              {DURATION_CONFIG[d].label}
            </button>
          ))}
        </div>

        {/* Accidental toggle (sharp / natural / flat) */}
        {onAccidentalChange && (
          <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
            <button
              onClick={() => onAccidentalChange('b')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                ${accidental === 'b'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              title="降記號 (flat)"
            >
              ♭
            </button>
            <button
              onClick={() => onAccidentalChange(null)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                ${!accidental
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              title="還原記號 (natural)"
            >
              ♮
            </button>
            <button
              onClick={() => onAccidentalChange('#')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                ${accidental === '#'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              title="升記號 (sharp)"
            >
              #
            </button>
          </div>
        )}

        <span className="text-sm text-zinc-400">
          {notes.length}
        </span>

        <button
          onClick={togglePlay}
          disabled={notes.length === 0}
          className={`flex items-center justify-center w-11 h-11 rounded-full text-base transition-all
            ${notes.length === 0
              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
              : isPlaying
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-emerald-500 text-white hover:bg-emerald-400'
            }`}
          title={isPlaying ? '暫停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={stop}
          disabled={!isPlaying}
          className={`flex items-center justify-center w-10 h-10 rounded-full text-sm transition-all
            ${!isPlaying
              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-400'
            }`}
          title="停止"
        >
          ⏹
        </button>
      </div>
    </div>
  );
}
