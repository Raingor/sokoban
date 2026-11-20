import { levels } from './levels';
export const STORAGE_KEY = 'puzzle-sokoban-v1';
export interface Progress {
  version: 1;
  selected: number;
  best: Record<string, number>;
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface StorageResult { progress: Progress; available: boolean }
export const emptyProgress = (): Progress => ({ version: 1, selected: 1, best: {} });
const validId = (id: unknown): id is number => Number.isInteger(id) && levels.some(level => level.id === id);
export function validateProgress(value: unknown): Progress {
  const fallback = emptyProgress();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const input = value as Record<string, unknown>;
  if (input.version !== 1) return fallback;
  if (validId(input.selected)) fallback.selected = input.selected;
  if (input.best && typeof input.best === 'object' && !Array.isArray(input.best)) {
    for (const level of levels) {
      const best = (input.best as Record<string, unknown>)[String(level.id)];
      if (typeof best === 'number' && Number.isSafeInteger(best) && best > 0) fallback.best[String(level.id)] = best;
    }
  }
  return fallback;
}
export function loadProgress(storage: StorageLike | null): StorageResult {
  if (!storage) return { progress: emptyProgress(), available: false };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { progress: raw ? validateProgress(JSON.parse(raw)) : emptyProgress(), available: true };
  } catch { return { progress: emptyProgress(), available: false }; }
}
export function saveProgress(storage: StorageLike | null, progress: Progress): boolean {
  try { if (!storage) return false; storage.setItem(STORAGE_KEY, JSON.stringify(validateProgress(progress))); return true; }
  catch { return false; }
}
export function recordWin(progress: Progress, levelId: number, moves: number): Progress {
  if (!validId(levelId) || !Number.isSafeInteger(moves) || moves < 1) return progress;
  const previous = progress.best[String(levelId)];
  return { ...progress, best: { ...progress.best, [String(levelId)]: Math.min(previous ?? Infinity, moves) } };
}
