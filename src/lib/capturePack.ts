import capturePackData from '../data/capture-pack.json';
import { VELOXA_CHANNEL_ID, type MockNotification } from './notify';

/**
 * Real notifications captured on-device (CLAUDE.md §2), replayed verbatim —
 * no templating, no field substitution. `capture-pack.json` ships empty
 * until the field-capture task (handoff §10.2) produces real data; imported
 * captures persist in localStorage so the pack can grow without a rebuild.
 */
export interface CaptureEntry {
  id: string;
  capturedAt: string;
  /** The real platform this was captured from, e.g. "Rapido" — for report/provenance only. */
  platform: string;
  title: string;
  body: string;
  bigText?: string;
  notes?: string;
}

const IMPORTED_KEY = 'veloxa.importedCaptures';
const BUNDLED = capturePackData as CaptureEntry[];

function loadImported(): CaptureEntry[] {
  try {
    const raw = localStorage.getItem(IMPORTED_KEY);
    return raw ? (JSON.parse(raw) as CaptureEntry[]) : [];
  } catch {
    return [];
  }
}

function saveImported(entries: CaptureEntry[]): void {
  try {
    localStorage.setItem(IMPORTED_KEY, JSON.stringify(entries));
  } catch {
    // Best-effort persistence only.
  }
}

/** Bundled captures plus anything imported at runtime. Imported entries win on id collision. */
export function loadCapturePack(): CaptureEntry[] {
  const imported = loadImported();
  const importedIds = new Set(imported.map((e) => e.id));
  return [...BUNDLED.filter((e) => !importedIds.has(e.id)), ...imported];
}

function isCaptureEntry(value: unknown): value is CaptureEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.capturedAt === 'string' &&
    typeof v.platform === 'string' &&
    typeof v.title === 'string' &&
    typeof v.body === 'string' &&
    (v.bigText === undefined || typeof v.bigText === 'string') &&
    (v.notes === undefined || typeof v.notes === 'string')
  );
}

export interface ImportResult {
  added: number;
  replaced: number;
  errors: string[];
}

/** Parses a capture-pack JSON export (single entry or array) and merges it into localStorage. */
export function importCaptures(jsonText: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return { added: 0, replaced: 0, errors: [`Invalid JSON: ${String(err)}`] };
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const errors: string[] = [];
  const valid: CaptureEntry[] = [];
  list.forEach((entry, i) => {
    if (isCaptureEntry(entry)) {
      valid.push(entry);
    } else {
      errors.push(`Entry ${i} is missing required fields (id, capturedAt, platform, title, body).`);
    }
  });

  const existing = loadImported();
  const indexById = new Map(existing.map((e, i) => [e.id, i]));
  let added = 0;
  let replaced = 0;
  for (const entry of valid) {
    const existingIndex = indexById.get(entry.id);
    if (existingIndex !== undefined) {
      existing[existingIndex] = entry;
      replaced++;
    } else {
      existing.push(entry);
      indexById.set(entry.id, existing.length - 1);
      added++;
    }
  }
  saveImported(existing);

  return { added, replaced, errors };
}

/** Verbatim replay — the captured text goes out exactly as recorded, with no templating. */
export function buildReplayNotification(entry: CaptureEntry, id: number): MockNotification {
  return {
    id,
    channelId: VELOXA_CHANNEL_ID,
    title: entry.title,
    body: entry.body,
    largeBody: entry.bigText,
  };
}
