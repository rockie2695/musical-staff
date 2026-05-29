'use client';

import { useCallback, useRef, useState } from 'react';
import * as Tone from 'tone';
import { StaffNote } from '@/types';
import { getDurationBeats } from '@/utils/staffGeometry';

const BPM = 120;
const BEAT_DURATION = 60 / BPM; // seconds per quarter note
const DEFAULT_VELOCITY = 0.55;
const ACCENT_VELOCITY = 0.9;

function beatToSec(beats: number): number {
  return beats * BEAT_DURATION;
}

export function usePlayback(notes: StaffNote[]) {
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const stopAll = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(async () => {
    if (notes.length === 0) return;

    await Tone.start();
    stopAll();

    if (!synthRef.current) {
      synthRef.current = new Tone.Synth().toDestination();
    }
    const synth = synthRef.current;
    const now = Tone.now();

    /* ---------- Precompute tuplet group metadata ---------- */
    const tupletGroupStart = new Map<string, number>();
    const tupletGroupSize = new Map<string, number>();
    for (const n of notes) {
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
    for (const n of notes) {
      if (n.slurId) {
        if (!slurGroups.has(n.slurId)) slurGroups.set(n.slurId, []);
        slurGroups.get(n.slurId)!.push(n);
      }
    }
    for (const [, group] of slurGroups) {
      group.sort((a, b) => a.measure - b.measure || a.beat - b.beat);
    }

    /* ---------- Build schedule ---------- */
    const sorted = [...notes]
      .filter((n) => !n.isRest)
      .sort((a, b) => a.measure - b.measure || a.beat - b.beat);

    interface Event {
      noteId: string;
      freq: string;
      startTime: number; // seconds from now
      duration: number; // seconds
      velocity: number;
    }

    const events: Event[] = [];
    const tupletIndex = new Map<string, number>();

    for (const note of sorted) {
      let startBeat = note.measure * 4 + note.beat;
      let durationBeats = getDurationBeats(note.duration);
      let velocity = note.accent ? ACCENT_VELOCITY : DEFAULT_VELOCITY;

      /* Tuplet timing compression */
      if (note.tupletId) {
        const idx = tupletIndex.get(note.tupletId) ?? 0;
        tupletIndex.set(note.tupletId, idx + 1);
        const groupStart = tupletGroupStart.get(note.tupletId)!;
        const numNotes = tupletGroupSize.get(note.tupletId)!;
        const notesOccupied = 2; // standard triplet: 3 notes in space of 2
        const compFactor = notesOccupied / numNotes; // e.g., 2/3
        const baseStep = getDurationBeats(note.duration);
        startBeat = groupStart + idx * baseStep * compFactor;
        durationBeats = baseStep * compFactor;
      }

      events.push({
        noteId: note.id,
        freq: note.fullName,
        startTime: now + beatToSec(startBeat),
        duration: beatToSec(durationBeats),
        velocity,
      });
    }

    /* ---------- Apply slur legato (extend durations to overlap with next in group) ---------- */
    for (const [, group] of slurGroups) {
      for (let i = 0; i < group.length; i++) {
        const curIdx = events.findIndex((e) => e.noteId === group[i].id);
        if (curIdx === -1) continue;

        if (i < group.length - 1) {
          const nextIdx = events.findIndex((e) => e.noteId === group[i + 1].id);
          if (nextIdx !== -1) {
            /* Extend current note's release to the next note's attack for legato */
            const overlap = events[curIdx].duration * 0.15; // small overlap buffer
            events[curIdx].duration =
              events[nextIdx].startTime - events[curIdx].startTime + overlap;
          }
        }
        /* Last note in slur group keeps its original duration */
      }
    }

    /* ---------- Schedule all events via Tone.js ---------- */
    for (const ev of events) {
      synth.triggerAttackRelease(ev.freq, ev.duration, ev.startTime, ev.velocity);
    }

    /* Auto-stop after all notes finish */
    const lastEvent = events[events.length - 1];
    if (lastEvent) {
      const totalMs = (lastEvent.startTime - now + lastEvent.duration) * 1000 + 300;
      timeoutRef.current = window.setTimeout(() => {
        setIsPlaying(false);
      }, totalMs);
    }

    setIsPlaying(true);
  }, [notes, stopAll]);

  const pause = useCallback(() => {
    Tone.getTransport().pause();
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  return { isPlaying, togglePlay, stop: stopAll };
}
