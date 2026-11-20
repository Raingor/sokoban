import type { Level } from './levels';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Terrain = 'wall' | 'floor' | 'goal';
export interface Board {
  readonly width: number;
  readonly height: number;
  readonly terrain: readonly Terrain[];
  readonly goals: readonly number[];
  readonly startPlayer: number;
  readonly startBoxes: readonly number[];
}
export interface Position {
  readonly player: number;
  readonly boxes: readonly number[];
  readonly moves: number;
  readonly pushes: number;
}
export interface GameState extends Position {
  readonly history: readonly Position[];
}

export function parseLevel(level: Pick<Level, 'map'>): Board {
  const { map } = level;
  const width = map[0]?.length ?? 0;
  if (width < 3 || map.length < 3 || map.some(row => row.length !== width)) throw new Error('关卡尺寸无效');
  const terrain: Terrain[] = [];
  const goals: number[] = [];
  const startBoxes: number[] = [];
  let startPlayer = -1;
  let players = 0;
  for (let y = 0; y < map.length; y++) for (let x = 0; x < width; x++) {
    const char = map[y][x];
    if (!'# .$@+*'.includes(char)) throw new Error('未知关卡符号');
    if ((x === 0 || y === 0 || x === width - 1 || y === map.length - 1) && char !== '#') throw new Error('边界必须封闭');
    const index = y * width + x;
    const isGoal = '.*+'.includes(char);
    terrain.push(char === '#' ? 'wall' : isGoal ? 'goal' : 'floor');
    if (isGoal) goals.push(index);
    if ('$*'.includes(char)) startBoxes.push(index);
    if ('@+'.includes(char)) { startPlayer = index; players++; }
  }
  if (players !== 1 || goals.length === 0 || startBoxes.length !== goals.length) throw new Error('角色或箱子/目标数量无效');
  const board: Board = { width, height: map.length, terrain, goals, startPlayer, startBoxes };
  const reached = new Set([startPlayer]);
  const queue = [startPlayer];
  for (let i = 0; i < queue.length; i++) for (const direction of directions) {
    const next = neighbor(board, queue[i], direction);
    if (next !== null && terrain[next] !== 'wall' && !reached.has(next)) { reached.add(next); queue.push(next); }
  }
  if (reached.size !== terrain.filter(cell => cell !== 'wall').length) throw new Error('地面必须连通');
  return board;
}

export const directions: readonly Direction[] = ['up', 'down', 'left', 'right'];
export function neighbor(board: Board, index: number, direction: Direction): number | null {
  const x = index % board.width;
  const y = Math.floor(index / board.width);
  const nx = x + (direction === 'right' ? 1 : direction === 'left' ? -1 : 0);
  const ny = y + (direction === 'down' ? 1 : direction === 'up' ? -1 : 0);
  return nx < 0 || nx >= board.width || ny < 0 || ny >= board.height ? null : ny * board.width + nx;
}
export function createGame(board: Board): GameState {
  return { player: board.startPlayer, boxes: [...board.startBoxes], moves: 0, pushes: 0, history: [] };
}
export function isWon(board: Board, state: Position): boolean {
  return state.boxes.length === board.goals.length && state.boxes.every(box => board.goals.includes(box));
}
export function move(board: Board, state: GameState, direction: Direction): GameState {
  if (isWon(board, state)) return state;
  const next = neighbor(board, state.player, direction);
  if (next === null || board.terrain[next] === 'wall') return state;
  const boxIndex = state.boxes.indexOf(next);
  const boxes = [...state.boxes];
  if (boxIndex !== -1) {
    const beyond = neighbor(board, next, direction);
    if (beyond === null || board.terrain[beyond] === 'wall' || boxes.includes(beyond)) return state;
    boxes[boxIndex] = beyond;
  }
  const previous: Position = { player: state.player, boxes: state.boxes, moves: state.moves, pushes: state.pushes };
  return { player: next, boxes, moves: state.moves + 1, pushes: state.pushes + (boxIndex !== -1 ? 1 : 0), history: [...state.history, previous] };
}
export function undo(state: GameState): GameState {
  const previous = state.history.at(-1);
  return previous ? { ...previous, history: state.history.slice(0, -1) } : state;
}
