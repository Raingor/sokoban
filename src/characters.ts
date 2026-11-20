import './characters.css';

// A local copy of the approved portrait identities; no sibling runtime imports.
export const characters = [
  { id: 'classic', name: 'Joke Bear', short: '自嘲熊' },
  { id: 'chiikawa', name: '吉伊', short: '吉伊' },
  { id: 'hachiware', name: '小八', short: '小八' },
  { id: 'usagi', name: '乌萨奇', short: '乌萨奇' },
  { id: 'mole-croquette', name: '鼹鼠饼', short: '鼹鼠饼' },
  { id: 'old-dog', name: '老头狗', short: '老头狗' },
  { id: 'bear-raincoat', name: '小黄鸭雨衣熊', short: '雨衣熊' },
  { id: 'bear-pajama', name: '睡衣派对熊', short: '睡衣熊' },
  { id: 'bear-ninja', name: '夜行忍者熊', short: '忍者熊' },
  { id: 'kurimanju', name: '栗子馒头', short: '栗子馒头' },
  { id: 'momonga', name: '飞鼠', short: '飞鼠' },
  { id: 'rakko', name: '海獭', short: '海獭' },
  { id: 'shisa', name: '狮萨', short: '狮萨' },
  { id: 'furuhonya', name: '古本屋', short: '古本屋' },
  { id: 'bear-strawberry', name: '草莓熊', short: '草莓熊' },
  { id: 'bear-frog', name: '青蛙熊', short: '青蛙熊' },
  { id: 'bear-astronaut', name: '太空熊', short: '太空熊' },
  { id: 'bear-chef', name: '厨师熊', short: '厨师熊' },
  { id: 'bear-pirate', name: '海盗熊', short: '海盗熊' },
] as const;
export type Character = typeof characters[number];
export const CHARACTER_STORAGE_KEY = 'puzzle-sokoban-character-v1';
export interface CharacterStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function resolveCharacter(id: unknown): Character {
  return characters.find(character => character.id === id) ?? characters[0];
}
export function loadCharacter(storage: CharacterStorage | null): Character {
  try {
    const raw = storage?.getItem(CHARACTER_STORAGE_KEY);
    if (!raw) return characters[0];
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return characters[0];
    const record = value as Record<string, unknown>;
    return record.version === 1 ? resolveCharacter(record.id) : characters[0];
  } catch { return characters[0]; }
}
export function saveCharacter(storage: CharacterStorage | null, id: unknown): boolean {
  try {
    if (!storage) return false;
    storage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify({ version: 1, id: resolveCharacter(id).id }));
    return true;
  } catch { return false; }
}
export const portraitPath = (id: string): string => `./characters-2d/${resolveCharacter(id).id}.webp`;

export function mountCharacters(host: HTMLElement): void {
  let storage: CharacterStorage | null = null;
  try { storage = window.localStorage; } catch { /* Playing and switching remain available. */ }
  let selected = loadCharacter(storage);
  host.innerHTML = `<details class="companions" id="characters"><summary class="companion-summary" aria-label="选择仓库陪伴员，当前 ${selected.name}"><span class="companion-portrait"><img id="companion-portrait" src="${portraitPath(selected.id)}" alt="${selected.name}的头像" width="64" height="64"></span><span class="companion-copy"><small>今日陪伴员</small><strong id="companion-name">${selected.name}</strong><span>陪你慢慢想，把每件小事放好。</span></span><span class="companion-switch">换位伙伴 <span class="companion-chevron" aria-hidden="true">⌄</span></span></summary><div class="companion-picker"><p class="companion-hint" id="companion-hint">19 位伙伴，随时换班 · 不会改变本关进度</p><div class="companion-grid" role="group" aria-label="选择陪伴角色" aria-describedby="companion-hint">${characters.map(character => `<button type="button" class="companion-choice" data-character="${character.id}" aria-label="选择${character.name}" aria-pressed="${character.id === selected.id}"><img src="${portraitPath(character.id)}" alt="${character.name}的头像" width="64" height="64" loading="lazy"><span>${character.short}</span><i class="companion-selected" aria-hidden="true">✓</i></button>`).join('')}</div></div></details><p class="companion-storage-note" role="status" hidden>陪伴员选择暂时无法保存；本次仍可随时换伙伴。</p>`;
  const details = host.querySelector<HTMLDetailsElement>('details')!;
  const summary = host.querySelector<HTMLElement>('summary')!;
  const portrait = host.querySelector<HTMLImageElement>('#companion-portrait')!;
  const name = host.querySelector<HTMLElement>('#companion-name')!;
  const note = host.querySelector<HTMLElement>('.companion-storage-note')!;
  const close = () => { details.open = false; summary.focus({ preventScroll: true }); };
  details.addEventListener('keydown', event => {
    if (event.key === 'Escape' && details.open) { event.preventDefault(); event.stopPropagation(); close(); }
  });
  details.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-character]');
    if (!button) return;
    selected = resolveCharacter(button.dataset.character);
    portrait.src = portraitPath(selected.id);
    portrait.alt = `${selected.name}的头像`;
    name.textContent = selected.name;
    summary.setAttribute('aria-label', `选择仓库陪伴员，当前 ${selected.name}`);
    for (const choice of host.querySelectorAll<HTMLButtonElement>('[data-character]')) {
      choice.setAttribute('aria-pressed', String(choice.dataset.character === selected.id));
    }
    note.hidden = saveCharacter(storage, selected.id);
    close();
  });
}
