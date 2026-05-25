'use client';

import { useCallback, useRef, useState } from 'react';
import * as Tone from 'tone';
import { StaffNote } from '@/types';

export function usePlayback(notes: StaffNote[]) {
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);
  const scheduledIds = useRef<number[]>([]);

  const stopAll = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    setIsPlaying(false);
  }, []);

  const play = useCallback(async () => {
    if (notes.length === 0) return;

    await Tone.start();
    stopAll();

    if (!synthRef.current) {
      synthRef.current = new Tone.Synth().toDestination();
    }

    const noteDuration = Tone.Time('4n').toSeconds();
    const synth = synthRef.current;
    const now = Tone.now();

    const playableNotes = notes.filter((n) => !n.isRest);
    playableNotes.forEach((note, i) => {
      synth.triggerAttackRelease(note.fullName, '4n', now + i * noteDuration);
    });

    const totalDuration = playableNotes.length * noteDuration;
    const id = window.setTimeout(() => {
      setIsPlaying(false);
    }, totalDuration * 1000);

    scheduledIds.current.push(id);
    setIsPlaying(true);
  }, [notes, stopAll]);

  const pause = useCallback(() => {
    Tone.getTransport().pause();
    scheduledIds.current.forEach((id) => clearTimeout(id));
    scheduledIds.current = [];
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
