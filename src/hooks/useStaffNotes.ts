'use client';

import { useState, useCallback } from 'react';
import { StaffNote, NoteDuration, StaffNoteAccidental } from '@/types';
import { getDurationBeats } from '@/utils/staffGeometry';

export function useStaffNotes() {
  const [notes, setNotes] = useState<StaffNote[]>([]);

  const addNote = useCallback((info: {
    pitch: string;
    octave: number;
    displayName: string;
    key: string;
    fullName: string;
    measure: number;
    beat: number;
    duration: NoteDuration;
    isRest?: boolean;
    accidental?: StaffNoteAccidental;
    accent?: boolean;
    tupletId?: string;
  }) => {
    setNotes((prev) => {
      const beats = getDurationBeats(info.duration);
      const overlap = prev.some((n) =>
        n.measure === info.measure &&
        n.beat < info.beat + beats &&
        n.beat + n.durationBeats > info.beat
      );
      if (overlap) return prev;
      const newNote: StaffNote = {
        id: `${info.measure}-${info.beat}-${Date.now()}`,
        ...info,
        isRest: info.isRest ?? false,
        durationBeats: beats,
        accidental: info.accidental,
        accent: info.accent,
        tupletId: info.tupletId,
      };
      return [...prev, newNote].sort(
        (a, b) => a.measure - b.measure || a.beat - b.beat
      );
    });
  }, []);

  /** Batch-add group notes atomically (bypass overlaps within the group).
   *  Supports tuplet and/or slur grouping via optional IDs. */
  const addTupletNotes = useCallback((info: {
    notes: Array<{
      pitch: string;
      octave: number;
      displayName: string;
      key: string;
      fullName: string;
      measure: number;
      beat: number;
      duration: NoteDuration;
      accidental?: StaffNoteAccidental;
      accent?: boolean;
    }>;
    tupletId?: string;
    slurId?: string;
  }) => {
    setNotes((prev) => {
      const newNotes: StaffNote[] = [];
      for (const n of info.notes) {
        const beats = getDurationBeats(n.duration);
        const overlap = prev.some((existing) =>
          existing.measure === n.measure &&
          existing.beat < n.beat + beats &&
          existing.beat + existing.durationBeats > n.beat
        );
        if (overlap) continue; // skip overlapping notes
        newNotes.push({
          id: `${n.measure}-${n.beat}-${Date.now()}-${Math.random()}`,
          ...n,
          isRest: false,
          durationBeats: beats,
          tupletId: info.tupletId,
          slurId: info.slurId,
        });
      }
      if (newNotes.length === 0) return prev;
      return [...prev, ...newNotes].sort(
        (a, b) => a.measure - b.measure || a.beat - b.beat
      );
    });
  }, []);

  const removeNoteAt = useCallback((measure: number, beat: number) => {
    setNotes((prev) =>
      prev.filter((n) => !(n.measure === measure && n.beat === beat))
    );
  }, []);

  /** Assign a slurId to two existing notes (two-click slur) */
  const markSlurNotes = useCallback((id1: string, id2: string, slurId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id1 || n.id === id2) {
          return { ...n, slurId };
        }
        return n;
      })
    );
  }, []);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, []);

  return { notes, addNote, removeNoteAt, clearNotes, addTupletNotes, markSlurNotes };
}
