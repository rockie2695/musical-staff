'use client';

import { useState, useCallback } from 'react';
import { StaffNote, NoteDuration } from '@/types';
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
      };
      return [...prev, newNote].sort(
        (a, b) => a.measure - b.measure || a.beat - b.beat
      );
    });
  }, []);

  const removeNoteAt = useCallback((measure: number, beat: number) => {
    setNotes((prev) =>
      prev.filter((n) => !(n.measure === measure && n.beat === beat))
    );
  }, []);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, []);

  return { notes, addNote, removeNoteAt, clearNotes };
}
