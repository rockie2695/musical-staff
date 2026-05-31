'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { InstrumentType, StaffNote } from '@/types';
import { getDurationBeats } from '@/utils/staffGeometry';

const DEFAULT_VELOCITY = 0.55;
const ACCENT_VELOCITY = 0.9;

/* Salamander Grand Piano sample map (every ~3 semitones across full range) */
const PIANO_SAMPLE_URLS: Record<string, string> = {
  'A0': 'A0.mp3', 'C1': 'C1.mp3', 'D#1': 'Ds1.mp3',
  'F#1': 'Fs1.mp3', 'A1': 'A1.mp3', 'C2': 'C2.mp3',
  'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', 'A2': 'A2.mp3',
  'C3': 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
  'A3': 'A3.mp3', 'C4': 'C4.mp3', 'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3', 'A4': 'A4.mp3', 'C5': 'C5.mp3',
  'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', 'A5': 'A5.mp3',
  'C6': 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
  'A6': 'A6.mp3', 'C7': 'C7.mp3', 'D#7': 'Ds7.mp3',
  'F#7': 'Fs7.mp3', 'A7': 'A7.mp3', 'C8': 'C8.mp3',
};

export function usePlayback(
  notes: StaffNote[],
  instrument: InstrumentType = 'synth',
  bpm: number = 120
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const synthRef = useRef<Tone.Synth | null>(null);
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startWallRef = useRef(0);
  const totalDurationRef = useRef(0);
  const isPlayingRef = useRef(false);

  /* Keep refs in sync so callbacks always read latest values */
  const instrumentRef = useRef(instrument);
  const bpmRef = useRef(bpm);
  const notesRef = useRef(notes);

  useEffect(() => { instrumentRef.current = instrument; }, [instrument]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  /* ---------- helpers ---------- */

  const beatToSec = useCallback((beats: number) => {
    return beats * (60 / bpmRef.current);
  }, []);

  const disposeInstruments = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    if (samplerRef.current) {
      samplerRef.current.dispose();
      samplerRef.current = null;
    }
  }, []);

  /** Ensure the correct instrument type exists, disposing the other if needed.
   *  Returns the instrument (may be async for Sampler loading). */
  const ensureInstrument = useCallback(async (): Promise<Tone.Synth | Tone.Sampler> => {
    const type = instrumentRef.current;

    if (type === 'synth') {
      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
      }
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth().toDestination();
        synthRef.current.volume.value = 9; // +9dB boost
      }
      return synthRef.current;
    }

    // type === 'piano'
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    if (!samplerRef.current) {
      return new Promise<Tone.Sampler>((resolve) => {
        const sampler = new Tone.Sampler({
          urls: PIANO_SAMPLE_URLS,
          baseUrl: 'https://tonejs.github.io/audio/salamander/',
          onload: () => {
            samplerRef.current = sampler;
            resolve(sampler);
          },
        }).toDestination();
        sampler.volume.value = 9; // +9dB boost
        samplerRef.current = sampler;
        // Safety fallback — resolve after timeout even if onload is flaky
        setTimeout(() => {
          if (samplerRef.current === sampler) {
            resolve(sampler);
          }
        }, 3000);
      });
    }
    return samplerRef.current;
  }, []);

  /* ---------- stop ---------- */

  const stopAll = useCallback(() => {
    /* Dispose cuts off all sound immediately */
    disposeInstruments();

    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
  }, [disposeInstruments]);

  /* ---------- playback ---------- */

  const play = useCallback(async () => {
    const currentNotes = notesRef.current;
    if (currentNotes.length === 0) return;

    await Tone.start();

    /* Fresh state */
    stopAll();
    setCurrentTime(0);
    setTotalTime(0);

    /* May be async when creating a Sampler for the first time */
    const instr = await ensureInstrument();

    /* ---------- Precompute tuplet group metadata ---------- */
    const tupletGroupStart = new Map<string, number>();
    const tupletGroupSize = new Map<string, number>();

    for (const n of currentNotes) {
      if (!n.tupletId) continue;
      tupletGroupSize.set(n.tupletId, (tupletGroupSize.get(n.tupletId) ?? 0) + 1);
      const absBeat = n.measure * 4 + n.beat;
      const current = tupletGroupStart.get(n.tupletId);
      if (current === undefined || absBeat < current) {
        tupletGroupStart.set(n.tupletId, absBeat);
      }
    }

    /* ---------- Precompute slur group structure ---------- */
    const slurGroups = new Map<string, StaffNote[]>();
    for (const n of currentNotes) {
      if (n.slurId) {
        if (!slurGroups.has(n.slurId)) slurGroups.set(n.slurId, []);
        slurGroups.get(n.slurId)!.push(n);
      }
    }
    for (const [, group] of slurGroups) {
      group.sort((a, b) => a.measure - b.measure || a.beat - b.beat);
    }

    /* ---------- Build schedule ---------- */
    const sorted = [...currentNotes]
      .filter((n) => !n.isRest)
      .sort((a, b) => a.measure - b.measure || a.beat - b.beat);

    interface Event {
      noteId: string;
      freq: string;
      startTime: number; // seconds from start (0-based)
      duration: number;
      velocity: number;
    }

    const events: Event[] = [];
    const tupletIndex = new Map<string, number>();

    for (const note of sorted) {
      let startBeat = note.measure * 4 + note.beat;
      let durationBeats = getDurationBeats(note.duration);
      const velocity = note.accent ? ACCENT_VELOCITY : DEFAULT_VELOCITY;

      /* Tuplet timing compression */
      if (note.tupletId) {
        const idx = tupletIndex.get(note.tupletId) ?? 0;
        tupletIndex.set(note.tupletId, idx + 1);
        const groupStart = tupletGroupStart.get(note.tupletId)!;
        const numNotes = tupletGroupSize.get(note.tupletId)!;
        const notesOccupied = 2;
        const compFactor = notesOccupied / numNotes;
        const baseStep = getDurationBeats(note.duration);
        startBeat = groupStart + idx * baseStep * compFactor;
        durationBeats = baseStep * compFactor;
      }

      events.push({
        noteId: note.id,
        freq: note.fullName,
        startTime: beatToSec(startBeat),
        duration: beatToSec(durationBeats),
        velocity,
      });
    }

    /* ---------- Apply slur legato (extend to next attack) ---------- */
    for (const [, group] of slurGroups) {
      for (let i = 0; i < group.length; i++) {
        const curIdx = events.findIndex((e) => e.noteId === group[i].id);
        if (curIdx === -1) continue;

        if (i < group.length - 1) {
          const nextIdx = events.findIndex((e) => e.noteId === group[i + 1].id);
          if (nextIdx !== -1) {
            const overlap = events[curIdx].duration * 0.15;
            events[curIdx].duration =
              events[nextIdx].startTime - events[curIdx].startTime + overlap;
          }
        }
      }
    }

    /* ---------- Schedule all events ---------- */
    const now = Tone.now();
    const lastEvent = events[events.length - 1];

    for (const ev of events) {
      instr.triggerAttackRelease(ev.freq, ev.duration, now + ev.startTime, ev.velocity);
    }

    /* ---------- Setup progress tracking & auto-stop ---------- */
    if (lastEvent) {
      const totalSec = lastEvent.startTime + lastEvent.duration;
      const totalMs = totalSec * 1000 + 300;
      totalDurationRef.current = totalSec;
      setTotalTime(totalSec);
      startWallRef.current = performance.now();

      timeoutRef.current = window.setTimeout(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setCurrentTime(totalSec);
      }, totalMs);

      isPlayingRef.current = true;
      setIsPlaying(true);
    }
  }, [stopAll, ensureInstrument, beatToSec]);

  /* ---------- Progress tracking via requestAnimationFrame ---------- */
  useEffect(() => {
    if (!isPlaying) return;

    const update = () => {
      if (!isPlayingRef.current) return;
      const elapsed = (performance.now() - startWallRef.current) / 1000;
      const clamped = Math.min(elapsed, totalDurationRef.current);
      setCurrentTime(clamped);
      if (clamped < totalDurationRef.current) {
        rafRef.current = requestAnimationFrame(update);
      }
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  /* ---------- pause / toggle ---------- */

  const pause = useCallback(() => {
    Tone.getTransport().pause();
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  return { isPlaying, togglePlay, stop: stopAll, currentTime, totalTime };
}
