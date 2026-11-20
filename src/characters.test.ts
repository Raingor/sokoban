import { describe, expect, it } from 'vitest';
import { characters, CHARACTER_STORAGE_KEY, loadCharacter, portraitPath, resolveCharacter, saveCharacter, type CharacterStorage } from './characters';
const memory = (initial: string | null = null): CharacterStorage => {
  let raw = initial;
  return { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
};
describe('warehouse companion identities and separate local choice', () => {
  it('has exactly nineteen unique identities with names and safe local portrait paths', () => {
    expect(characters).toHaveLength(19); expect(new Set(characters.map(item => item.id)).size).toBe(19);
    for (const character of characters) {
      expect(character.name.length).toBeGreaterThan(0);
      expect(portraitPath(character.id)).toBe(`./characters-2d/${character.id}.webp`);
      expect(resolveCharacter(character.id)).toBe(character);
    }
    expect(CHARACTER_STORAGE_KEY).not.toBe('puzzle-sokoban-v1');
  });
  it('uses the default for missing and unavailable storage', () => {
    expect(loadCharacter(null).id).toBe('classic'); expect(loadCharacter(memory()).id).toBe('classic');
  });
  it('round trips every choice using a versioned independent key', () => {
    const store = memory();
    for (const character of characters) {
      expect(saveCharacter(store, character.id)).toBe(true);
      expect(loadCharacter(store)).toBe(character);
      expect(JSON.parse(store.getItem(CHARACTER_STORAGE_KEY)!)).toEqual({version: 1, id: character.id});
    }
  });
  it.each(['{broken', 'null', '[]', 'true', '42', '"chiikawa"', '{"version":2,"id":"chiikawa"}', '{"version":1,"id":"unknown"}', '{"version":1,"id":1}', '{"version":1}', '{"version":"1","id":"chiikawa"}'])('safely defaults for malformed value %s', raw => {
    expect(loadCharacter(memory(raw)).id).toBe('classic');
  });
  it('catches read and write exceptions without losing a usable default', () => {
    const blocked = { getItem() { throw new Error('security'); }, setItem() { throw new Error('quota'); } };
    expect(loadCharacter(blocked).id).toBe('classic'); expect(saveCharacter(blocked, 'usagi')).toBe(false);
    expect(saveCharacter(null, 'usagi')).toBe(false);
  });
  it('never interpolates an invalid id into a portrait path or stored choice', () => {
    for (const invalid of ['../bad', '<script>', null, 4, {}, '__proto__']) expect(resolveCharacter(invalid).id).toBe('classic');
    expect(portraitPath('../bad')).toBe('./characters-2d/classic.webp');
    const store = memory(); saveCharacter(store, 'invalid'); expect(loadCharacter(store).id).toBe('classic');
  });
});
