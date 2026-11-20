import { describe, expect, it } from 'vitest';
import { createGame, isWon, move, neighbor, parseLevel, undo, type Direction } from './engine';
import { levels } from './levels';
import solutions from './solutions.json';
const letters: Record<string, Direction> = { U: 'up', D: 'down', L: 'left', R: 'right' };
const boardOf = (...map: string[]) => parseLevel({ map });

describe('movement and box rules', () => {
  it('walks one cell and counts a move, not a push', () => {
    const board = parseLevel(levels[0]); const start = createGame(board);
    const result = move(board, start, 'up');
    expect(result.player).toBe(start.player - board.width);
    expect(result.moves).toBe(1); expect(result.pushes).toBe(0); expect(result.boxes).toEqual(start.boxes);
    expect(start.moves).toBe(0); expect(start.history).toEqual([]);
  });
  it('does not walk through walls or record invalid input', () => {
    const board = boardOf('######', '#@ $.#', '######'); const start = createGame(board);
    expect(move(board, start, 'up')).toBe(start); expect(move(board, start, 'left')).toBe(start);
  });
  it('pushes one box and only wins with every box placed', () => {
    const board = parseLevel(levels[3]); let state = createGame(board);
    for (const letter of 'LUU') state = move(board, state, letters[letter]);
    expect(state.pushes).toBe(1); expect(isWon(board, state)).toBe(false);
  });
  it('cannot push a box into a wall', () => {
    const board = boardOf('######', '#@$#.#', '#    #', '######'); const start = createGame(board);
    expect(move(board, start, 'right')).toBe(start);
  });
  it('cannot push a chain of boxes', () => {
    const board = boardOf('########', '#@$$ ..#', '#      #', '########'); const start = createGame(board);
    expect(move(board, start, 'right')).toBe(start);
  });
  it('cannot pull a box while walking away', () => {
    const board = parseLevel(levels[0]); const start = createGame(board);
    const result = move(board, start, 'left'); expect(result.boxes).toEqual(start.boxes);
  });
  it('preserves underlying goal when the player leaves it', () => {
    const board = boardOf('#######', '# +$  #', '#     #', '#######'); const initial = createGame(board);
    const moved = move(board, initial, 'down');
    expect(board.terrain[initial.player]).toBe('goal'); expect(board.goals).toContain(initial.player);
    expect(moved.player).not.toBe(initial.player);
  });
  it('preserves underlying goal when a box moves away', () => {
    const board = boardOf('########', '# @* . #', '# $    #', '#      #', '########'); const initial = createGame(board);
    const state = move(board, initial, 'right');
    expect(board.terrain[initial.boxes[0]]).toBe('goal'); expect(state.boxes).not.toContain(initial.boxes[0]);
    expect(state.pushes).toBe(1);
  });
  it('stops movement after victory, but allows undo', () => {
    const board = parseLevel(levels[0]); const start = createGame(board); const won = move(board, start, 'right');
    expect(isWon(board, won)).toBe(true); expect(move(board, won, 'down')).toBe(won);
    expect(undo(won)).toEqual(start);
  });
  it('undoes every legal step including moves and pushes', () => {
    const board = parseLevel(levels[6]); let state = createGame(board); const history = [state];
    for (const letter of solutions[6]) { state = move(board, state, letters[letter]); history.push(state); }
    for (let i = history.length - 2; i >= 0; i--) { state = undo(state); expect(state).toEqual(history[i]); }
    expect(undo(state)).toBe(state);
  });
  it('reset creates an exact fresh state and does not mutate old state', () => {
    const board = parseLevel(levels[1]); const start = createGame(board); const moved = move(board, start, 'up');
    expect(createGame(board)).toEqual(start); expect(moved.history.length).toBe(1);
    expect(board.startBoxes).toEqual(start.boxes);
  });
  it('neighbors cannot wrap rows or leave the board', () => {
    const board = parseLevel(levels[0]);
    expect(neighbor(board, 0, 'left')).toBe(null); expect(neighbor(board, 0, 'up')).toBe(null);
    expect(neighbor(board, board.width - 1, 'right')).toBe(null);
    expect(neighbor(board, board.terrain.length - 1, 'down')).toBe(null);
  });
});

describe('original level collection', () => {
  it('contains twelve unique original levels in a one-to-three-box progression', () => {
    expect(levels.length).toBe(12); expect(new Set(levels.map(l => l.map.join('\n'))).size).toBe(12);
    expect(levels.map(l => parseLevel(l).startBoxes.length)).toEqual([1,1,1,2,2,2,2,2,3,3,3,3]);
    expect(solutions.slice(4).filter(s => s.length >= 19).length).toBeGreaterThanOrEqual(5);
  });
  for (const [index, level] of levels.entries()) {
    it(`level ${level.id}: balanced boxes/goals, closed boundary and connected floor`, () => {
      const board = parseLevel(level);
      expect(board.startBoxes.length).toBe(board.goals.length); expect(isWon(board, createGame(board))).toBe(false);
      expect(level.map[0]).toMatch(/^#+$/); expect(level.map.at(-1)).toMatch(/^#+$/);
    });
    it(`level ${level.id}: every solution step is legal and ends in victory`, () => {
      const board = parseLevel(level); let state = createGame(board);
      for (const letter of solutions[index]) {
        const next = move(board, state, letters[letter]); expect(next, `illegal ${letter} at ${state.moves}`).not.toBe(state);
        expect(next.moves).toBe(state.moves + 1); state = next;
      }
      expect(isWon(board, state)).toBe(true); expect(state.moves).toBe(solutions[index].length);
      expect(new Set(state.boxes).size).toBe(board.goals.length);
    });
  }
  it.each([
    ['###', '#@#', '##'],
    ['#####', '#@$..', '#####'],
    ['#####', '#@?.#', '# $ #', '#####'],
    ['######', '#@$ .#', '######', '#    #', '######'],
    ['#####', '#@@.#', '# $ #', '#####'],
    ['#####', '#@ .#', '#   #', '#####'],
  ])('rejects malformed, open, disconnected or unbalanced maps %j', (...map) => {
    expect(() => boardOf(...map)).toThrow();
  });
});
