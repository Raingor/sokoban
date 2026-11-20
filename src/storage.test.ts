import { describe, expect, it } from 'vitest';
import { emptyProgress, loadProgress, recordWin, saveProgress, STORAGE_KEY, validateProgress, type StorageLike } from './storage';
const memory = (raw: string | null = null): StorageLike => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } });

describe('versioned local progress', () => {
  it('uses an independent key and has a clean default', () => {
    expect(STORAGE_KEY).toBe('puzzle-sokoban-v1');
    expect(loadProgress(memory()).progress).toEqual({ version: 1, selected: 1, best: {} });
  });
  it('loads selected level and best moves', () => {
    const progress = { version: 1 as const, selected: 7, best: { '1': 1, '7': 30 } };
    const store = memory(); expect(saveProgress(store, progress)).toBe(true);
    expect(loadProgress(store)).toEqual({ progress, available: true });
  });
  it('degrades when storage access is unavailable', () => {
    expect(loadProgress(null).available).toBe(false); expect(saveProgress(null, emptyProgress())).toBe(false);
    const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
    expect(loadProgress(blocked).progress).toEqual(emptyProgress()); expect(saveProgress(blocked, emptyProgress())).toBe(false);
  });
  it('degrades on invalid JSON', () => { expect(loadProgress(memory('{bad')).progress).toEqual(emptyProgress()); });
  it.each([null, [], 8, 'save', {version: 2}, {version: '1'}, {version: 0}])('rejects invalid root or version %j', value => {
    expect(validateProgress(value)).toEqual(emptyProgress());
  });
  it.each([-1, 0, 13, 1.5, '2', null, Infinity])('rejects invalid selected id %j', selected => {
    expect(validateProgress({version: 1, selected}).selected).toBe(1);
  });
  it.each([-1, 0, 1.5, '1', null, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])('ignores invalid best move count %j', best => {
    expect(validateProgress({ version: 1, best: { '1': best } }).best).toEqual({});
  });
  it('ignores foreign keys and keeps only valid fields', () => {
    expect(validateProgress({version: 1, selected: 2, best: {'1': 3, '2': -1, '13': 10, '__proto__': 8}, current: 'bad'}))
      .toEqual({version: 1, selected: 2, best: {'1': 3}});
  });
  it('ignores malformed best containers', () => {
    for (const best of [[], 'bad', 3, false, null]) expect(validateProgress({version: 1, best}).best).toEqual({});
  });
  it('keeps independent per-level minimums and does not mutate previous progress', () => {
    const initial = emptyProgress(); let progress = recordWin(initial, 1, 10);
    progress = recordWin(progress, 1, 12); expect(progress.best['1']).toBe(10);
    progress = recordWin(progress, 1, 8); progress = recordWin(progress, 2, 20);
    expect(progress.best).toEqual({'1': 8, '2': 20}); expect(initial.best).toEqual({});
  });
  it('does not record invalid wins', () => {
    const progress = emptyProgress();
    for (const [id, count] of [[0,2],[13,2],[1,0],[1,-1],[1,1.5],[1,Infinity]]) expect(recordWin(progress,id,count)).toBe(progress);
  });
});
