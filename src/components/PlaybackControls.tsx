"use client";

import { useCallback, useState } from "react";
import { usePlayback } from "@/hooks/usePlayback";
import { InstrumentType, StaffNote, NoteDuration, StaffNoteAccidental } from "@/types";
import { DURATION_CONFIG } from "@/utils/staffGeometry";
import { useLocale } from "@/i18n/I18nContext";

interface PlaybackControlsProps {
  notes: StaffNote[];
  noteDuration: NoteDuration;
  onDurationChange: (d: NoteDuration) => void;
  isRestMode: boolean;
  onRestModeChange: (r: boolean) => void;
  accidental?: StaffNoteAccidental | null;
  onAccidentalChange?: (a: StaffNoteAccidental | null) => void;
  accent?: boolean;
  onAccentChange?: (a: boolean) => void;
  tupletActive?: boolean;
  onTupletActiveChange?: (t: boolean) => void;
  slurActive?: boolean;
  onSlurActiveChange?: (t: boolean) => void;
}

const DURATIONS: NoteDuration[] = ["h", "q", "8", "16"];

const INSTRUMENTS: { value: InstrumentType; label: string }[] = [
  { value: "synth", label: "Synth" },
  { value: "piano", label: "Piano" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaybackControls({
  notes,
  noteDuration,
  onDurationChange,
  isRestMode,
  onRestModeChange,
  accidental,
  onAccidentalChange,
  accent,
  onAccentChange,
  tupletActive,
  onTupletActiveChange,
  slurActive,
  onSlurActiveChange,
}: PlaybackControlsProps) {
  const [instrument, setInstrument] = useState<InstrumentType>("synth");
  const [bpm, setBpm] = useState(120);

  const { isPlaying, togglePlay, stop, currentTime, totalTime } = usePlayback(
    notes,
    instrument,
    bpm
  );
  const { t } = useLocale();

  const handleInstrumentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (isPlaying) stop();
      setInstrument(e.target.value as InstrumentType);
    },
    [isPlaying, stop]
  );

  const handleBpmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBpm(Number(e.target.value));
    },
    []
  );

  const progress = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* Progress bar + time (visible during playback) */}
      {isPlaying && totalTime > 0 && (
        <div className="flex items-center gap-3 w-full max-w-[min(400px,80vw)]">
          <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-[width] duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 font-mono tabular-nums whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(totalTime)}
          </span>
        </div>
      )}

      {/* Main controls bar */}
      <div className="flex items-center gap-3 bg-white/90 text-zinc-900 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm border border-zinc-200">
        {/* Note/Rest mode toggle */}
        <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
          <button
            onClick={() => onRestModeChange(false)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
              ${
                !isRestMode
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            title={t("controls.note")}
          >
            {t("controls.note")}
          </button>
          <button
            onClick={() => onRestModeChange(true)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
              ${
                isRestMode
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            title={t("controls.rest")}
          >
            {t("controls.rest")}
          </button>
        </div>

        {/* Duration selector */}
        <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  noteDuration === d
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              title={t(DURATION_CONFIG[d].i18nKey)}
            >
              {t(DURATION_CONFIG[d].i18nKey)}
            </button>
          ))}
        </div>

        {/* Accidental toggle */}
        {onAccidentalChange && (
          <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
            <button
              onClick={() => onAccidentalChange("b")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  accidental === "b"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              title={t("controls.flat")}
            >
              ♭
            </button>
            <button
              onClick={() => onAccidentalChange(null)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  !accidental
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              title={t("controls.natural")}
            >
              ♮
            </button>
            <button
              onClick={() => onAccidentalChange("#")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  accidental === "#"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              title={t("controls.sharp")}
            >
              #
            </button>
          </div>
        )}

        {/* Accent toggle */}
        {onAccentChange && (
          <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
            <button
              onClick={() => onAccentChange(!accent)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  accent
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              title={t("controls.accent")}
            >
              {">"}
            </button>
          </div>
        )}

        {/* Tuplet toggle */}
        {onTupletActiveChange && (
          <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
            <button
              onClick={() => onTupletActiveChange(!tupletActive)}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  tupletActive
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              title={t("controls.tuplet")}
            >
              {t("controls.tuplet")}
            </button>
          </div>
        )}

        {/* Slur toggle */}
        {onSlurActiveChange && (
          <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
            <button
              onClick={() => onSlurActiveChange(!slurActive)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  slurActive
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              title={t("controls.slur")}
            >
              ⌢
            </button>
          </div>
        )}

        {/* Instrument selector */}
        <div className="flex items-center gap-1 pr-3 border-r border-zinc-200">
          <select
            value={instrument}
            onChange={handleInstrumentChange}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 border-none outline-none cursor-pointer appearance-none hover:bg-zinc-200 transition-colors"
          >
            {INSTRUMENTS.map((inst) => (
              <option key={inst.value} value={inst.value}>
                {inst.label}
              </option>
            ))}
          </select>
        </div>

        {/* BPM slider */}
        <div className="flex items-center gap-2 pr-3 border-r border-zinc-200">
          <span className="text-xs font-medium text-zinc-500">BPM</span>
          <input
            type="range"
            min={40}
            max={200}
            step={1}
            value={bpm}
            onChange={handleBpmChange}
            disabled={isPlaying}
            className="w-20 h-1.5 rounded-full appearance-none cursor-pointer
              bg-zinc-200 accent-zinc-900
              disabled:opacity-40 disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-zinc-900
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-sm
              disabled:[&::-webkit-slider-thumb]:bg-zinc-400"
          />
          <span className="text-xs font-mono tabular-nums w-8 text-right text-zinc-700">
            {bpm}
          </span>
        </div>

        <span className="text-sm text-zinc-400">{notes.length}</span>

        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          disabled={notes.length === 0}
          className={`flex items-center justify-center w-11 h-11 rounded-full text-base transition-all cursor-pointer
            ${
              notes.length === 0
                ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                : isPlaying
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-emerald-500 text-white hover:bg-emerald-400"
            }`}
          title={isPlaying ? t("controls.pause") : t("controls.play")}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Stop button */}
        <button
          onClick={stop}
          disabled={!isPlaying}
          className={`flex items-center justify-center w-10 h-10 rounded-full text-sm transition-all cursor-pointer
            ${
              !isPlaying
                ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-400"
            }`}
          title={t("controls.stop")}
        >
          ⏹
        </button>
      </div>
    </div>
  );
}
