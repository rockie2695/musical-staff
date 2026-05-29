'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Annotation, Accidental, Articulation, Tuplet, Curve, Beam } from 'vexflow';
import { StaffNote, NoteDuration, StaffNoteAccidental } from '@/types';
import { useLocale } from '@/i18n/I18nContext';
import {
  MEASURE_WIDTH,
  STAFF_Y_OFFSET,
  ROW_HEIGHT,
  BEATS_PER_MEASURE,
  snapBeat,
  getDurationBeats,
  getNearestStaffPosition,
  generateNoteInfo,
  generateAccidentalNoteInfo,
  DURATION_CONFIG,
  REST_DURATION,
} from '@/utils/staffGeometry';

interface TupletNoteInfo {
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
}

interface MusicStaffProps {
  notes: StaffNote[];
  noteDuration: NoteDuration;
  isRestMode: boolean;
  accidental?: StaffNoteAccidental | null;
  accent?: boolean;
  tupletActive?: boolean;
  slurActive?: boolean;
  onAddNote: (info: TupletNoteInfo & { isRest?: boolean }) => void;
  onAddTuplet?: (info: {
    notes: TupletNoteInfo[];
    tupletId?: string;
  }) => void;
  onMarkSlurNotes?: (id1: string, id2: string, slurId: string) => void;
  onRemoveNoteAt: (measure: number, beat: number) => void;
}

interface HoverPos {
  m: number;
  b: number;
  line: number;
  key: string;
  displayName: string;
}

const GHOST_FILL = 'rgba(148, 163, 184, 0.25)';
const GHOST_STROKE = 'rgba(100, 116, 139, 0.3)';
const HOVERED_FILL = '#94a3b8';
const HOVERED_STROKE = '#64748b';

export default function MusicStaff({ notes, noteDuration, isRestMode, accidental, accent, tupletActive, slurActive, onAddNote, onAddTuplet, onMarkSlurNotes, onRemoveNoteAt }: MusicStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const notesRef = useRef(notes);
  const [containerWidth, setContainerWidth] = useState(800);

  const hoveredPosRef = useRef<HoverPos | null>(null);
  const [hoverTick, setHoverTick] = useState(0);
  const editingNoteRef = useRef<{ measure: number; beat: number } | null>(null);
  const noteDurationRef = useRef(noteDuration);
  const isRestModeRef = useRef(isRestMode);
  const accidentalRef = useRef(accidental);
  const accentRef = useRef(accent);
  const tupletActiveRef = useRef(tupletActive);
  const slurActiveRef = useRef(slurActive);
  const [slurTick, setSlurTick] = useState(0);
  const slurFirstNoteIdRef = useRef<string | null>(null);
  const tupletIdCounterRef = useRef(0);
  const { t } = useLocale();

  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { noteDurationRef.current = noteDuration; }, [noteDuration]);
  useEffect(() => { isRestModeRef.current = isRestMode; }, [isRestMode]);
  useEffect(() => { accidentalRef.current = accidental; }, [accidental]);
  useEffect(() => { accentRef.current = accent; }, [accent]);
  useEffect(() => { tupletActiveRef.current = tupletActive; }, [tupletActive]);
  useEffect(() => { slurActiveRef.current = slurActive; }, [slurActive]);

  /* Resize observer */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setContainerWidth(container.clientWidth || 800);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setContainerWidth(w);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  /* ======== Rendering ======== */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* Always create renderer — even empty state needs SVG for hover/click coordinates */
    if (!rendererRef.current) {
      rendererRef.current = new Renderer(container, Renderer.Backends.SVG);
    }

    const renderer = rendererRef.current;

    /* At least 1 measure for the staff grid */
    const measuresCount = notes.length > 0
      ? Math.max(...notes.map((n) => n.measure)) + 1
      : 1;

    const cw = containerWidth;
    const measuresPerRow = Math.max(1, Math.floor(cw / MEASURE_WIDTH));
    const totalRows = Math.max(1, Math.ceil(measuresCount / measuresPerRow));
    const totalHeight = STAFF_Y_OFFSET + totalRows * ROW_HEIGHT + 20;

    renderer.resize(cw, totalHeight);
    const ctx = renderer.getContext();
    ctx.clear();

    const hovered = hoveredPosRef.current;

    /* ---------- Helpers for ghost/render ---------- */
    function fillGapWithRests(start: number, end: number, tickables: StaveNote[], measureIdx: number, hov: HoverPos | null, invisible = false) {
      const dur = noteDurationRef.current;
      const ghostBeats = DURATION_CONFIG[dur].beats;
      /* During re-pitch mode, skip ghost in gaps — ghost appears at editing note's position instead */
      const skipGhost = editingNoteRef.current !== null;
      let p = start;
      while (p + 0.005 < end) {
        const gap = end - p;

        /* only insert ghost if it fits within the gap (skipped during re-pitch) */
        if (!skipGhost && hov && hov.m === measureIdx && hov.b >= p - 0.001 && hov.b < p + gap - 0.001 && hov.b + ghostBeats <= end + 0.001) {
          fillSimpleGap(p, hov.b, tickables, invisible);
          addGhost(tickables, hov, dur);
          p = hov.b + ghostBeats;
          continue;
        }

        fillSimpleGap(p, end, tickables, invisible);
        p = end;
      }
    }

    function fillSimpleGap(start: number, end: number, tickables: StaveNote[], invisible = false) {
      let p = start;
      while (p + 0.005 < end) {
        const gap = end - p;
        let rest: StaveNote;
        if (gap >= 2 - 0.001) {
          rest = new StaveNote({ keys: ['b/4'], duration: 'hr' });
          p += 2;
        } else if (gap >= 1 - 0.001) {
          rest = new StaveNote({ keys: ['b/4'], duration: 'qr' });
          p += 1;
        } else if (gap >= 0.5 - 0.001) {
          rest = new StaveNote({ keys: ['b/4'], duration: '8r' });
          p += 0.5;
        } else {
          rest = new StaveNote({ keys: ['b/4'], duration: '16r' });
          p += 0.25;
        }
        if (invisible) {
          rest.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
        }
        tickables.push(rest);
      }
    }

    function addGhost(tickables: StaveNote[], hov: HoverPos, dur: NoteDuration) {
      const isRestGhost = isRestModeRef.current;
      if (!isRestGhost) {
        const ghost = new StaveNote({ keys: [hov.key], duration: dur });
        ghost.setStyle({ fillStyle: GHOST_FILL, strokeStyle: GHOST_STROKE });
        const ann = new Annotation(hov.displayName);
        ann.setFont('Arial', 11);
        ann.setVerticalJustification('top');
        ann.setStyle({ fillStyle: GHOST_FILL });
        ghost.addModifier(ann);
        tickables.push(ghost);
      } else {
        const ghost = new StaveNote({ keys: ['b/4'], duration: REST_DURATION[dur] });
        ghost.setStyle({ fillStyle: GHOST_FILL, strokeStyle: GHOST_STROKE });
        tickables.push(ghost);
      }
    }

    for (let m = 0; m < measuresCount; m++) {
      const row = Math.floor(m / measuresPerRow);
      const col = m % measuresPerRow;
      const x = col * MEASURE_WIDTH;
      const y = STAFF_Y_OFFSET + row * ROW_HEIGHT;

      const stave = new Stave(x, y, MEASURE_WIDTH);
      if (m === 0) {
        stave.addClef('treble');
        stave.addTimeSignature('4/4');
      }
      stave.setContext(ctx).draw();

      const tickables: StaveNote[] = [];

      const tupletGroups = new Map<string, StaveNote[]>();
      const slurGroups = new Map<string, StaveNote[]>();

      if (notes.length > 0) {
        /* ---- normal rendering with notes + gap fills + ghost ---- */
        const measureNotes = notes
          .filter((n) => n.measure === m)
          .sort((a, b) => a.beat - b.beat);

        let pos = 0;

        for (const note of measureNotes) {
          fillGapWithRests(pos, note.beat, tickables, m, hovered);

          const isEditingNote = editingNoteRef.current !== null &&
            editingNoteRef.current.measure === note.measure &&
            editingNoteRef.current.beat === note.beat;

          let staveNote: StaveNote;
          if (isEditingNote && !note.isRest) {
            /* Re-pitch mode: show original note + translucent ghost as a chord */
            const keys = [note.key];
            if (hovered && hovered.key !== note.key) {
              keys.push(hovered.key);
            }
            staveNote = new StaveNote({ keys, duration: note.duration });
            if (keys.length > 1) {
              staveNote.setKeyStyle(1, { fillStyle: GHOST_FILL, strokeStyle: GHOST_STROKE });
            }
            if (note.accidental) {
              staveNote.addModifier(new Accidental(note.accidental), 0);
            }
            if (note.accent) {
              staveNote.addModifier(new Articulation('a>'), 0);
            }
            const annotation = new Annotation(note.displayName);
            annotation.setFont('Arial', 11);
            annotation.setVerticalJustification('top');
            staveNote.addModifier(annotation);
          } else if (note.isRest) {
            staveNote = new StaveNote({ keys: ['b/4'], duration: REST_DURATION[note.duration] });
          } else {
            staveNote = new StaveNote({ keys: [note.key], duration: note.duration });
            if (note.accidental) {
              staveNote.addModifier(new Accidental(note.accidental), 0);
            }
            if (note.accent) {
              staveNote.addModifier(new Articulation('a>'), 0);
            }
            const annotation = new Annotation(note.displayName);
            annotation.setFont('Arial', 11);
            annotation.setVerticalJustification('top');
            staveNote.addModifier(annotation);
          }

          /* Highlight first slur-selected note in blue */
          if (slurFirstNoteIdRef.current === note.id) {
            staveNote.setStyle({ fillStyle: '#3b82f6', strokeStyle: '#1d4ed8' });
          }

          if (hovered && !isEditingNote && hovered.m === note.measure && hovered.b === note.beat) {
            staveNote.setStyle({ fillStyle: HOVERED_FILL, strokeStyle: HOVERED_STROKE });
          }

          if (note.tupletId) {
            if (!tupletGroups.has(note.tupletId)) {
              tupletGroups.set(note.tupletId, []);
            }
            tupletGroups.get(note.tupletId)!.push(staveNote);
          }
          if (note.slurId) {
            if (!slurGroups.has(note.slurId)) {
              slurGroups.set(note.slurId, []);
            }
            slurGroups.get(note.slurId)!.push(staveNote);
          }

          tickables.push(staveNote);
          pos = note.beat + note.durationBeats;
        }

        fillGapWithRests(pos, BEATS_PER_MEASURE, tickables, m, hovered);
      } else if (hovered && hovered.m === m) {
        /* ---- empty staff — invisible rests + visible ghost ---- */
        fillGapWithRests(0, BEATS_PER_MEASURE, tickables, m, hovered, true);
      }

      if (tickables.length > 0) {
        const voice = new Voice({ numBeats: BEATS_PER_MEASURE, beatValue: 4 });
        voice.addTickables(tickables);
        new Formatter().joinVoices([voice]).format([voice], MEASURE_WIDTH - 30);
        voice.draw(ctx, stave);
      }

      /* Draw tuplet brackets */
      for (const [, group] of tupletGroups) {
        if (group.length >= 2) {
          const tuplet = new Tuplet(group, { numNotes: group.length, notesOccupied: 2, ratioed: false });
          tuplet.setContext(ctx);
          tuplet.draw();
        }
      }

      /* Draw slur curves */
      for (const [, group] of slurGroups) {
        if (group.length >= 2) {
          const curve = new Curve(group[0], group[group.length - 1], { position: Curve.Position.NEAR_HEAD });
          curve.setContext(ctx);
          curve.draw();
        }
      }

      /* Auto-beam consecutive short notes (eighth & sixteenth) */
      const beamGroups: StaveNote[][] = [];
      let currentBeamGroup: StaveNote[] = [];
      for (const t of tickables) {
        const isShort = !t.isRest() && (t.getDuration() === '8' || t.getDuration() === '16');
        if (isShort) {
          currentBeamGroup.push(t);
        } else {
          if (currentBeamGroup.length >= 2) beamGroups.push(currentBeamGroup);
          currentBeamGroup = [];
        }
      }
      if (currentBeamGroup.length >= 2) beamGroups.push(currentBeamGroup);
      for (const group of beamGroups) {
        const beam = new Beam(group, true);
        beam.setContext(ctx);
        beam.draw();
      }
    }
  }, [notes, containerWidth, hoverTick, slurTick]);

  /* -------- mouse-move (hover) -------- */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const svg = containerRef.current?.querySelector('svg');
    const container = containerRef.current;
    if (!svg || !container) return;

    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cw = container.clientWidth || 800;
    const measuresPerRow = Math.max(1, Math.floor(cw / MEASURE_WIDTH));
    const row = Math.floor((my - STAFF_Y_OFFSET) / ROW_HEIGHT);
    if (row < 0) {
      if (hoveredPosRef.current) { hoveredPosRef.current = null; setHoverTick((t) => t + 1); }
      return;
    }
    const col = Math.floor(mx / MEASURE_WIDTH);
    const measure = row * measuresPerRow + col;

    const rawBeat = ((mx - col * MEASURE_WIDTH) / MEASURE_WIDTH) * BEATS_PER_MEASURE;
    const beat = snapBeat(rawBeat, noteDurationRef.current);

    /* compute pitch from Y (with optional accidental) */
    const rowY = STAFF_Y_OFFSET + row * ROW_HEIGHT;
    const tempStave = new Stave(0, rowY, MEASURE_WIDTH);
    tempStave.addClef('treble');
    const pos = getNearestStaffPosition(my, tempStave);
    if (!pos) return;
    const acc = accidentalRef.current;
    const noteInfo = acc ? generateAccidentalNoteInfo(pos.line, acc) : generateNoteInfo(pos.line);
    if (!noteInfo) return;

    const curr = hoveredPosRef.current;
    if (!curr || curr.m !== measure || curr.b !== beat || curr.line !== pos.line) {
      hoveredPosRef.current = { m: measure, b: beat, line: pos.line, key: noteInfo.key, displayName: noteInfo.displayName };
      setHoverTick((t) => t + 1);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoveredPosRef.current) {
      hoveredPosRef.current = null;
      setHoverTick((t) => t + 1);
    }
  }, []);

  /* -------- click -------- */
  const handleClick = useCallback((e: React.MouseEvent) => {
    /* Clear stale hover state immediately — prevents ghost from leaking into next render */
    hoveredPosRef.current = null;

    const container = containerRef.current;
    if (!container) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    const currentNotes = notesRef.current;
    const dur = noteDurationRef.current;
    const isRest = isRestModeRef.current;

    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cw = container.clientWidth || 800;
    const measuresPerRow = Math.max(1, Math.floor(cw / MEASURE_WIDTH));

    const row = Math.floor((clickY - STAFF_Y_OFFSET) / ROW_HEIGHT);
    if (row < 0) return;

    const col = Math.floor(clickX / MEASURE_WIDTH);
    const measureIndex = row * measuresPerRow + col;

    const rawBeat = ((clickX - col * MEASURE_WIDTH) / MEASURE_WIDTH) * BEATS_PER_MEASURE;
    const snappedBeat = snapBeat(rawBeat, dur);
    /* Clamp so the note fits within the measure (e.g. half-note at beat 4 → beat 2) */
    const beat = Math.min(snappedBeat, BEATS_PER_MEASURE - DURATION_CONFIG[dur].beats);

    /* Compute pitch from click Y (shared by re-pitch confirm and add, with optional accidental) */
    const rowY = STAFF_Y_OFFSET + row * ROW_HEIGHT;
    const tempStave = new Stave(0, rowY, MEASURE_WIDTH);
    tempStave.addClef('treble');
    const clickPos = getNearestStaffPosition(clickY, tempStave);
    const clickAcc = accidentalRef.current;
    const noteInfo = clickPos
      ? (clickAcc ? generateAccidentalNoteInfo(clickPos.line, clickAcc) : generateNoteInfo(clickPos.line))
      : null;

    /* Slur mode: pick two existing notes to connect */
    if (slurActiveRef.current) {
      const clickedNote = currentNotes.find(
        (n) => n.measure === measureIndex && n.beat === beat
      );
      if (!clickedNote) {
        /* Clicked empty space → cancel selection if any */
        if (slurFirstNoteIdRef.current) {
          slurFirstNoteIdRef.current = null;
          setSlurTick((t) => t + 1);
        }
        return; /* Block note addition in slur mode */
      }
      /* Clicked an existing note */
      if (!slurFirstNoteIdRef.current) {
        /* First selection — highlight it */
        slurFirstNoteIdRef.current = clickedNote.id;
        setSlurTick((t) => t + 1);
        return;
      }
      if (slurFirstNoteIdRef.current === clickedNote.id) {
        /* Same note again → cancel selection */
        slurFirstNoteIdRef.current = null;
        setSlurTick((t) => t + 1);
        return;
      }
      /* Different note → create slur */
      const slurId = `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      onMarkSlurNotes?.(slurFirstNoteIdRef.current, clickedNote.id, slurId);
      slurFirstNoteIdRef.current = null;
      setSlurTick((t) => t + 1);
      return;
    }

    /* Check if clicking on an existing note (re-pitch mode) */
    const clickedNote = currentNotes.find(
      (n) => n.measure === measureIndex && n.beat === beat
    );
    if (clickedNote) {
      if (editingNoteRef.current &&
          editingNoteRef.current.measure === clickedNote.measure &&
          editingNoteRef.current.beat === clickedNote.beat) {
        /* Clicking the SAME note again → confirm re-pitch (new pitch from click Y) */
        editingNoteRef.current = null;
        if (noteInfo) {
          onRemoveNoteAt(clickedNote.measure, clickedNote.beat);
          onAddNote({
            ...noteInfo,
            measure: clickedNote.measure,
            beat: clickedNote.beat,
            duration: dur,
            isRest: isRest || undefined,
            accent: accentRef.current || undefined,
          });
        }
        return;
      }
      /* Clicking a different note → switch re-pitch target */
      editingNoteRef.current = { measure: clickedNote.measure, beat: clickedNote.beat };
      setHoverTick((t) => t + 1);
      return;
    }

    /* Clicking empty space while editing → cancel */
    if (editingNoteRef.current) {
      editingNoteRef.current = null;
      setHoverTick((t) => t + 1);
      return;
    }

    /* Batch mode (tuplet only): add 3 back-to-back eighth notes grouped as needed */
    const isBatch = tupletActiveRef.current && !isRest && noteInfo;
    if (isBatch && onAddTuplet) {
      const tupletId = `t-${Date.now()}-${tupletIdCounterRef.current++}`;
      const step = getDurationBeats('8'); // 0.5
      const notes: TupletNoteInfo[] = [];
      for (let i = 0; i < 3; i++) {
        const b = beat + i * step;
        if (b >= BEATS_PER_MEASURE) break;
        notes.push({
          ...noteInfo,
          measure: measureIndex,
          beat: b,
          duration: '8' as NoteDuration,
          accent: accentRef.current || undefined,
        });
      }
      if (notes.length >= 2) {
        onAddTuplet({ notes, tupletId });
      }
      return;
    }

    /* Normal add */
    if (!noteInfo) return;
    onAddNote({
      ...noteInfo,
      measure: measureIndex,
      beat,
      duration: dur,
      isRest: isRest || undefined,
      accent: accentRef.current || undefined,
    });
  }, [onAddNote, onRemoveNoteAt, onAddTuplet, onMarkSlurNotes]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer min-h-[200px] select-none relative"
    >
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm pointer-events-none">
          {t('staff.emptyHint')}
        </div>
      )}
    </div>
  );
}
