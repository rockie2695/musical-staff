export type NoteDuration = 'h' | 'q' | '8' | '16';
export type StaffNoteAccidental = '#' | 'b';

export interface StaffNote {
  id: string;
  pitch: string;
  octave: number;
  key: string;
  displayName: string;
  fullName: string;
  measure: number;
  beat: number;
  duration: NoteDuration;
  durationBeats: number;
  isRest?: boolean;
  accidental?: StaffNoteAccidental;
  accent?: boolean;
  tupletId?: string;
  slurId?: string;
}
