// Icons collected from iconfont.cn through opencli on 2026-11-23; source IDs and URLs are in ICONS.md.
import './style.css';
import { mountCharacters } from './characters';
import { createGame, isWon, move, parseLevel, undo, type Direction } from './engine';
import { levels } from './levels';
import { loadProgress, recordWin, saveProgress, type StorageLike } from './storage';

const app = document.querySelector<HTMLDivElement>('#app')!;
const icons = {
  box: '<path d="M94.586667 298.666667l112.466666-187.44a53.593333 53.593333 0 0 1 45.733334-25.893334H512v213.333334zM554.666667 298.666667h417.413333l-112.466667-187.44a53.593333 53.593333 0 0 0-45.733333-25.893334H554.666667z m426.666666 42.666666v544a53.393333 53.393333 0 0 1-53.333333 53.333334H138.666667a53.393333 53.393333 0 0 1-53.333334-53.333334V341.333333z m-298.666666 192a21.333333 21.333333 0 0 0-21.333334-21.333333H405.333333a21.333333 21.333333 0 0 0 0 42.666667h256a21.333333 21.333333 0 0 0 21.333334-21.333334z"></path>',
  undo: '<path d="M384 230.4L273.066667 341.333333H682.666667c119.466667 0 213.333333 93.866667 213.333333 213.333334s-93.866667 213.333333-213.333333 213.333333H298.666667v-42.666667h384c93.866667 0 170.666667-76.8 170.666666-170.666666s-76.8-170.666667-170.666666-170.666667H170.666667l42.666666-42.666667 140.8-140.8 29.866667 29.866667z"></path>',
  reset: '<path d="M524.8 106.666667c-106.666667 0-209.066667 42.666667-285.866667 110.933333l-8.533333-68.266667c0-25.6-21.333333-42.666667-46.933333-38.4-25.6 0-42.666667 21.333333-38.4 46.933334l8.533333 115.2c4.266667 55.466667 51.2 98.133333 106.666667 98.133333h8.533333L384 362.666667c25.6 0 42.666667-21.333333 38.4-46.933334 0-25.6-21.333333-42.666667-46.933333-38.4l-85.333334 4.266667c64-55.466667 145.066667-89.6 230.4-89.6 187.733333 0 341.333333 153.6 341.333334 341.333333s-153.6 341.333333-341.333334 341.333334-341.333333-153.6-341.333333-341.333334c0-25.6-17.066667-42.666667-42.666667-42.666666s-42.666667 17.066667-42.666666 42.666666c0 234.666667 192 426.666667 426.666666 426.666667s426.666667-192 426.666667-426.666667c4.266667-234.666667-187.733333-426.666667-422.4-426.666666z"></path>',
  help: '<path d="M878.08 731.274667a32 32 0 0 1-54.88-32.938667A360.789333 360.789333 0 0 0 874.666667 512c0-200.298667-162.368-362.666667-362.666667-362.666667S149.333333 311.701333 149.333333 512s162.368 362.666667 362.666667 362.666667a360.789333 360.789333 0 0 0 186.314667-51.445334 32 32 0 0 1 32.928 54.88A424.778667 424.778667 0 0 1 512 938.666667C276.362667 938.666667 85.333333 747.637333 85.333333 512S276.362667 85.333333 512 85.333333s426.666667 191.029333 426.666667 426.666667c0 78.293333-21.152 153.568-60.586667 219.274667zM650.666667 437.333333c0 65.898667-46.72 120.853333-109.194667 135.082667V608a32 32 0 0 1-64 0v-64a32 32 0 0 1 32-32C552.266667 512 586.666667 478.4 586.666667 437.333333s-34.4-74.666667-77.194667-74.666666c-26.773333 0-51.082667 13.248-65.173333 34.624a73.088 73.088 0 0 0-8.522667 17.717333 32 32 0 0 1-60.885333-19.690667c3.797333-11.754667 9.173333-22.933333 15.978666-33.237333 25.856-39.253333 70.186667-63.413333 118.613334-63.413333C587.274667 298.666667 650.666667 360.576 650.666667 437.333333zM512 736a32 32 0 1 1 0-64 32 32 0 0 1 0 64z"></path>',
  grid: '<path d="M170.666667 426.666667h170.666666v170.666666H170.666667v-170.666666z m0 384v-128h170.666666v128H170.666667z m256 0v-128h170.666666v128h-170.666666z m256 0v-128h170.666666v128h-170.666666z m0-213.333334v-170.666666h170.666666v170.666666h-170.666666z m0-256V213.333333h170.666666v128h-170.666666z m-85.333334-128v128h-170.666666V213.333333h170.666666z m0 213.333334v170.666666h-170.666666v-170.666666h170.666666zM170.666667 341.333333V213.333333h170.666666v128H170.666667zM128 128a42.666667 42.666667 0 0 0-42.666667 42.666667v682.666666a42.666667 42.666667 0 0 0 42.666667 42.666667h768a42.666667 42.666667 0 0 0 42.666667-42.666667V170.666667a42.666667 42.666667 0 0 0-42.666667-42.666667H128z"></path>',
};
const icon = (name: keyof typeof icons) => `<svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">${icons[name]}</svg>`;
let storage: StorageLike | null = null;
try { storage = window.localStorage; } catch { /* A blocked accessor must not prevent playing. */ }
const loaded = loadProgress(storage);
let progress = loaded.progress;
let available = loaded.available;
let level = levels[progress.selected - 1];
let board = parseLevel(level);
let state = createGame(board);
let facing: Direction = 'down';
let lastOpener: HTMLElement | null = null;

app.innerHTML = `
  <main class="warehouse">
    <header class="site-header">
      <a class="brand" href="./" aria-label="小小仓库首页"><span class="brand-mark">${icon('box')}</span><span>慢慢玩<span class="brand-sub">小小益智 · 推箱子</span></span></a>
      <button class="quiet-button" id="help">${icon('help')}<span>玩法说明</span></button>
    </header>
    <section class="intro" aria-labelledby="title">
      <div><p class="eyebrow">A LITTLE WAREHOUSE</p><h1 id="title">小小仓库<span class="title-dot">。</span></h1><p class="intro-copy">把生活放慢，把木箱放好。</p></div>
      <div class="warehouse-stamp" aria-hidden="true"><span>用 心 归 位</span><strong>12</strong><span>个原创小关卡</span></div>
    </section>
    <section id="companions-host" aria-label="仓库陪伴员"></section>
    <section class="play-layout" aria-label="推箱子游戏">
      <div class="board-column">
        <div class="board-heading"><p><span class="chapter" id="chapter"></span><span class="level-counter" id="level-counter"></span></p><button class="quiet-button" id="choose">${icon('grid')}选择关卡</button></div>
        <div class="board-frame"><div class="frame-label" aria-hidden="true">小 仓 · 慢 运</div><div id="board" class="board" tabindex="0" role="group" aria-label="推箱子棋盘"></div></div>
        <div class="board-caption"><span class="legend"><i class="legend-box" aria-hidden="true"></i>木箱<i class="legend-goal" aria-hidden="true"></i>目标泊位</span><span id="placed"></span></div>
        <p class="keyboard-note">点击棋盘后，使用 <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> 或 WASD 移动 · Z 撤销</p>
      </div>
      <aside class="dispatch" aria-label="当前关卡与操作">
        <div class="dispatch-top"><span class="paper-clip" aria-hidden="true"></span><p class="eyebrow">今日入库单 <span id="dispatch-id"></span></p><h2 id="level-name"></h2><p class="level-note" id="level-note"></p></div>
        <p class="tally"><span>移动 <strong id="moves">0</strong></span><span>推箱 <strong id="pushes">0</strong></span></p>
        <p class="best-note" id="best"></p>
        <div class="action-row"><button id="undo" class="paper-button">${icon('undo')}撤销</button><button id="reset" class="paper-button">${icon('reset')}重置</button></div>
        <div class="direction-pad" role="group" aria-label="移动方向">
          <button data-direction="up" aria-label="向上移动">↑</button>
          <button data-direction="left" aria-label="向左移动">←</button>
          <span class="pad-center" aria-hidden="true">✦</span>
          <button data-direction="right" aria-label="向右移动">→</button>
          <button data-direction="down" aria-label="向下移动">↓</button>
        </div>
        <div id="completion" class="completion" role="status" aria-live="polite" hidden><p class="completion-title">✓ 这一间，整理好了</p><p id="win-copy"></p><button id="next" class="primary-button">下一间仓库 <span aria-hidden="true">→</span></button><button id="all-levels" class="paper-button" hidden>查看全部关卡</button></div>
        <p id="status" class="status" role="status" aria-live="polite">不急，想好再推。</p>
      </aside>
    </section>
    <footer><span id="progress-count">已整理 0 / 12 间</span><span>不赶时间 · 随时撤销</span></footer>
    <p id="storage-note" class="storage-note" role="status" hidden>本地记录暂不可用，本次仍可正常游玩；关闭页面后进度可能不会保留。</p>
  </main>
  <dialog id="dialog" aria-labelledby="dialog-title"><div class="dialog-heading"><h2 id="dialog-title"></h2><button id="dialog-close" class="close-button" aria-label="关闭弹窗">×</button></div><div id="dialog-content"></div></dialog>
`;
const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
const dialog = $<HTMLDialogElement>('#dialog');
const boardElement = $('#board');
function persist() {
  if (!saveProgress(storage, progress)) available = false;
  $('#storage-note').hidden = available;
}
function render() {
  const won = isWon(board, state);
  $('#chapter').textContent = level.chapter;
  $('#level-counter').textContent = `${String(level.id).padStart(2, '0')} / 12`;
  $('#dispatch-id').textContent = `NO. ${String(level.id).padStart(2, '0')}`;
  $('#level-name').textContent = level.name;
  $('#level-note').textContent = level.note;
  $('#moves').textContent = String(state.moves); $('#pushes').textContent = String(state.pushes);
  const best = progress.best[String(level.id)];
  $('#best').textContent = best ? `本关最佳 ${best} 步 · 每次都可以再试试` : '本关尚未完成 · 慢慢来就好';
  $('#placed').textContent = `${state.boxes.filter(box => board.goals.includes(box)).length} / ${board.goals.length} 已归位`;
  $('#progress-count').textContent = `已整理 ${Object.keys(progress.best).length} / 12 间`;
  $<HTMLButtonElement>('#undo').disabled = state.history.length === 0;
  $('#completion').hidden = !won;
  $('#next').hidden = level.id === levels.length;
  $('#all-levels').hidden = level.id !== levels.length;
  $('#win-copy').textContent = `${state.moves} 步，${state.pushes} 次推箱。给认真思考的你盖个章。`;
  $('#status').hidden = won;
  boardElement.style.setProperty('--columns', String(board.width));
  boardElement.style.setProperty('--rows', String(board.height));
  boardElement.style.aspectRatio = `${board.width} / ${board.height}`;
  boardElement.dataset.level = String(level.id);
  boardElement.dataset.moves = String(state.moves);
  boardElement.dataset.pushes = String(state.pushes);
  boardElement.dataset.won = String(won);
  const x = state.player % board.width + 1; const y = Math.floor(state.player / board.width) + 1;
  boardElement.setAttribute('aria-label', `第${level.id}关 ${level.name}，${board.width}列${board.height}行，角色第${y}行第${x}列，移动${state.moves}步，推箱${state.pushes}次。方向键或WASD移动，Z撤销。`);
  const cellPosition = (index: number) => `grid-column:${index % board.width + 1};grid-row:${Math.floor(index / board.width) + 1}`;
  boardElement.innerHTML = `<div class="terrain-layer" aria-hidden="true"><div class="ground-layer">${board.terrain.map((terrain, index) => terrain === 'wall' ? '' : `<div class="cell floor" data-cell="${index}" style="${cellPosition(index)}"></div>`).join('')}</div><div class="wall-layer">${board.terrain.map((terrain, index) => terrain !== 'wall' ? '' : `<div class="cell wall" data-cell="${index}" style="${cellPosition(index)}"></div>`).join('')}</div><div class="goal-layer">${board.goals.map(index => `<div class="goal" data-goal="${index}" style="${cellPosition(index)}"><span class="goal-marker"><i></i></span></div>`).join('')}</div></div><div class="entity-layer" aria-hidden="true">${state.boxes.map(index => `<div class="crate ${board.goals.includes(index) ? 'on-goal' : ''}" data-box="${index}" style="${cellPosition(index)}"><span class="crate-face"></span>${board.goals.includes(index) ? '<span class="crate-check">✓</span>' : ''}</div>`).join('')}<div class="worker facing-${facing}" data-player="${state.player}" style="${cellPosition(state.player)}"><span class="worker-shadow"></span><span class="worker-body"></span><span class="worker-head"><i></i></span><span class="worker-cap"></span></div></div>`;
}
function startLevel(id: number) {
  level = levels.find(item => item.id === id) ?? levels[0];
  board = parseLevel(level); state = createGame(board); facing = 'down';
  progress = { ...progress, selected: level.id }; persist(); render();
  $('#status').textContent = '不急，想好再推。';
}
function step(direction: Direction) {
  if (dialog.open) return;
  const next = move(board, state, direction);
  facing = direction;
  if (next === state) {
    $('#status').textContent = isWon(board, state) ? '本关已完成，可以前往下一间。' : '这里推不动。换个方向，或撤销上一步。';
    return;
  }
  const pushed = next.pushes > state.pushes;
  state = next;
  if (isWon(board, state)) { progress = recordWin(progress, level.id, state.moves); persist(); }
  render();
  $('#status').textContent = pushed ? `推箱成功，已移动 ${state.moves} 步。` : `已移动 ${state.moves} 步。`;
}
function undoStep() {
  state = undo(state); render(); $('#status').textContent = state.moves ? '已退回一步，换个思路再试试。' : '回到最初，可以重新出发。';
}
function closeDialog() { dialog.close(); lastOpener?.focus(); }
function openDialog(title: string, content: string) {
  lastOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  $('#dialog-title').textContent = title; $('#dialog-content').innerHTML = content; dialog.showModal();
}
function showLevels() {
  openDialog('选一间仓库', `<p class="dialog-lead">12 个原创小关卡，都可以自由尝试。<br>完成记录和最佳步数会留在这台设备上。</p><div class="level-grid">${levels.map(item => {
    const best = progress.best[String(item.id)];
    return `<button class="level-choice ${item.id === level.id ? 'current' : ''}" data-level="${item.id}" ${item.id === level.id ? 'aria-current="true"' : ''}><span class="choice-number">${String(item.id).padStart(2, '0')} ${best ? '<i aria-label="已完成">✓</i>' : ''}</span><strong>${item.name}</strong><small>${best ? `最佳 ${best} 步` : item.chapter}</small></button>`;
  }).join('')}</div>`);
}
$('#help').addEventListener('click', () => openDialog('仓库小守则', `<div class="rules"><p class="dialog-lead">把每只木箱，送到一个圆形目标泊位上。</p><ol><li><strong>走一步，推一格。</strong>用方向键 / WASD，或下方方向按钮移动。只能推身旁的一只箱子，不能穿墙、拉箱子或连续推动两只箱子。</li><li><strong>圆环是泊位，不是障碍。</strong>人物和木箱都可以经过；木箱归位会出现 ✓，全部归位才算完成。</li><li><strong>走进死角？没关系。</strong>点「撤销」或在棋盘上按 Z，可逐步退回任意多步。「重置」会重新开始本关。</li><li><strong>先把焦点交给棋盘。</strong>点击棋盘后方向键才接管移动；弹窗打开时不会误走。每个有效移动计 1 步，推箱另计次数。</li></ol><p class="rule-footnote">只保存已完成关卡、每关最佳步数和所选关卡；不保存中途局面。没有计时，也没有惩罚。刷新后从本关起点继续。</p><button class="primary-button" data-close>明白了，开始整理</button></div>`));
$('#choose').addEventListener('click', showLevels);
$('#all-levels').addEventListener('click', showLevels);
$('#undo').addEventListener('click', undoStep);
$('#reset').addEventListener('click', () => {
  if (state.moves === 0) { startLevel(level.id); return; }
  openDialog('重新整理这一间？', '<p class="dialog-lead">当前步数和撤销记录会清空。已完成关卡与最佳步数会保留。</p><div class="dialog-actions"><button class="paper-button" data-close>继续想想</button><button class="primary-button" data-confirm-reset>确认重置</button></div>');
});
$('#next').addEventListener('click', () => { startLevel(level.id + 1); boardElement.focus(); });
$('#dialog-close').addEventListener('click', closeDialog);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
dialog.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('button');
  if (!target) return;
  if (target.hasAttribute('data-close')) closeDialog();
  if (target.hasAttribute('data-confirm-reset')) { closeDialog(); startLevel(level.id); boardElement.focus(); }
  if (target.dataset.level) { closeDialog(); startLevel(Number(target.dataset.level)); boardElement.focus(); }
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-direction]')) {
  button.addEventListener('click', () => step(button.dataset.direction as Direction));
}
const keyDirections: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
boardElement.addEventListener('keydown', event => {
  if (dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  const direction = keyDirections[event.key] ?? keyDirections[event.key.toLowerCase()];
  if (direction) { event.preventDefault(); step(direction); }
  else if (event.key.toLowerCase() === 'z') { event.preventDefault(); undoStep(); }
});
boardElement.addEventListener('pointerdown', () => boardElement.focus({ preventScroll: true }));
persist(); render();
mountCharacters($('#companions-host'));
