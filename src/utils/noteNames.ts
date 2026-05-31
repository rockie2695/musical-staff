export interface StaffPositionInfo {
  pitch: string;
  octave: number;
  displayName: string;
}

export const STAFF_LINE_POSITIONS: Record<number, StaffPositionInfo> = {
  /* 2 ledger lines above the staff */
  [-2]:   { pitch: 'c', octave: 6, displayName: 'C' },
  [-1.5]: { pitch: 'b', octave: 5, displayName: 'B' },
  [-1]:   { pitch: 'a', octave: 5, displayName: 'A' },
  [-0.5]: { pitch: 'g', octave: 5, displayName: 'G' },
  /* Staff (treble clef) */
  0:   { pitch: 'f', octave: 5, displayName: 'F' },
  0.5: { pitch: 'e', octave: 5, displayName: 'E' },
  1:   { pitch: 'd', octave: 5, displayName: 'D' },
  1.5: { pitch: 'c', octave: 5, displayName: 'C' },
  2:   { pitch: 'b', octave: 4, displayName: 'B' },
  2.5: { pitch: 'a', octave: 4, displayName: 'A' },
  3:   { pitch: 'g', octave: 4, displayName: 'G' },
  3.5: { pitch: 'f', octave: 4, displayName: 'F' },
  4:   { pitch: 'e', octave: 4, displayName: 'E' },
  /* 2 ledger lines below the staff */
  4.5: { pitch: 'd', octave: 4, displayName: 'D' },
  5:   { pitch: 'c', octave: 4, displayName: 'C' },
  5.5: { pitch: 'b', octave: 3, displayName: 'B' },
  6:   { pitch: 'a', octave: 3, displayName: 'A' },
};

export function getNoteKey(pitch: string, octave: number): string {
  return `${pitch}/${octave}`;
}

export function getFullName(displayName: string, octave: number): string {
  return `${displayName}${octave}`;
}
