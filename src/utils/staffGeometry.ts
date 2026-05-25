import { Stave } from 'vexflow';
import { NoteDuration } from '@/types';
import { STAFF_LINE_POSITIONS, StaffPositionInfo, getNoteKey, getFullName } from './noteNames';

export const MEASURE_WIDTH = 350;
export const BEATS_PER_MEASURE = 4;
export const STAFF_Y_OFFSET = 50;
export const ROW_HEIGHT = 110;

export const DURATION_CONFIG: Record<NoteDuration, {
  value: number;
  step: number;
  vexflow: string;
  label: string;
  beats: number;
}> = {
  h:  { value: 2, step: 2,     vexflow: 'h',  label: '二分', beats: 2 },
  q:  { value: 4, step: 1,     vexflow: 'q',  label: '四分', beats: 1 },
  '8': { value: 8, step: 0.5,  vexflow: '8',  label: '八分', beats: 0.5 },
  '16':{ value: 16, step: 0.25, vexflow: '16', label: '十六分', beats: 0.25 },
};

export const REST_DURATION: Record<NoteDuration, string> = {
  h: 'hr',
  q: 'qr',
  '8': '8r',
  '16': '16r',
};

export function snapBeat(raw: number, duration: NoteDuration): number {
  const step = DURATION_CONFIG[duration].step;
  return Math.round(raw / step) * step;
}

export function getDurationBeats(duration: NoteDuration): number {
  return DURATION_CONFIG[duration].beats;
}

export function getNearestStaffPosition(y: number, stave: Stave): { line: number; info: StaffPositionInfo } | null {
  const positions: { line: number; y: number }[] = [];

  for (let i = 0; i < 5; i++) {
    positions.push({ line: i, y: stave.getYForLine(i) });
  }
  for (let i = 0; i < 4; i++) {
    const midY = (stave.getYForLine(i) + stave.getYForLine(i + 1)) / 2;
    positions.push({ line: i + 0.5, y: midY });
  }

  let nearest = positions[0];
  let minDist = Math.abs(y - nearest.y);

  for (const pos of positions) {
    const dist = Math.abs(y - pos.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = pos;
    }
  }

  const info = STAFF_LINE_POSITIONS[nearest.line];
  if (!info) return null;

  return { line: nearest.line, info };
}

export function getMeasureAndBeat(
  clickX: number,
  existingMeasures: number
): { measure: number; beat: number } {
  const measure = Math.min(Math.floor(clickX / MEASURE_WIDTH), existingMeasures);
  const beatInMeasure = Math.min(
    Math.floor(((clickX - measure * MEASURE_WIDTH) / MEASURE_WIDTH) * BEATS_PER_MEASURE),
    BEATS_PER_MEASURE - 1
  );
  return { measure, beat: beatInMeasure };
}

export function generateNoteInfo(line: number) {
  const pos = STAFF_LINE_POSITIONS[line];
  if (!pos) return null;
  return {
    pitch: pos.pitch,
    octave: pos.octave,
    displayName: pos.displayName,
    key: getNoteKey(pos.pitch, pos.octave),
    fullName: getFullName(pos.displayName, pos.octave),
  };
}
