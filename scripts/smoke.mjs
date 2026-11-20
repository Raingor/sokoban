import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.GAME_URL || 'http://localhost:5179';
const label = new URL(base).port === '5179' ? 'dev' : new URL(base).port === '4179' ? 'preview' : 'online';
const out = fileURLToPath(new URL(`../artifacts/${label}/`, import.meta.url));
const solutions = JSON.parse(await readFile(new URL('../src/solutions.json', import.meta.url), 'utf8'));
const key = 'puzzle-sokoban-v1';
const directions = { U: 'up', D: 'down', L: 'left', R: 'right' };
const arrows = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight' };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = []; const checks = []; const contexts = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); console.log('PASS', name); };
const fixture = (selected = 1, best = {}) => ({ version: 1, selected, best });
const getSave = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const snapshot = page => page.locator('#board').evaluate(el => ({
  level: Number(el.dataset.level), moves: Number(el.dataset.moves), pushes: Number(el.dataset.pushes), won: el.dataset.won === 'true',
  player: Number(el.querySelector('[data-player]').dataset.player),
  boxes: [...el.querySelectorAll('[data-box]')].map(box => Number(box.dataset.box)),
}));
async function setup(save, options = {}, mode = '') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options }); contexts.push(context);
  if (save !== undefined || mode) await context.addInitScript(({ save, key, mode }) => {
    if (mode === 'blocked') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
    else if (!sessionStorage.getItem('fixture-seeded')) {
      localStorage.setItem(key, mode === 'corrupt' ? '{broken JSON' : JSON.stringify(save));
      sessionStorage.setItem('fixture-seeded', '1');
    }
  }, { save, key, mode });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`pageerror ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console ${message.text()}`); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' }); await page.locator('[data-player]').waitFor();
  return { page, context };
}
async function select(page, id, touch = false) {
  if (touch) await page.locator('#choose').tap(); else await page.locator('#choose').click();
  const button = page.locator(`[data-level="${id}"]`);
  if (touch) await button.tap(); else await button.click();
}
async function execute(page, sequence, mode = 'keyboard') {
  if (mode === 'keyboard') await page.locator('#board').focus();
  for (const letter of sequence) {
    if (mode === 'keyboard') await page.keyboard.press(arrows[letter]);
    else if (mode === 'touch') await page.locator(`[data-direction="${directions[letter]}"]`).tap();
    else await page.locator(`[data-direction="${directions[letter]}"]`).click();
  }
}
try {
  await mkdir(out, { recursive: true });
  const { page } = await setup();
  check('desktop renders original warehouse and no horizontal overflow', await page.locator('.terrain-layer .cell').count() === 35 && await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
  const initial = await snapshot(page);
  await page.locator('#help').focus(); await page.keyboard.press('ArrowRight');
  check('arrows outside board focus never move the player', JSON.stringify(await snapshot(page)) === JSON.stringify(initial));
  await page.keyboard.press('Enter');
  check('rules open with keyboard and explain push, no pull and undo', await page.locator('dialog').isVisible() && (await page.locator('.rules').textContent()).includes('不能穿墙、拉箱子'));
  await page.keyboard.press('ArrowRight');
  check('open modal prevents board movement', (await snapshot(page)).moves === 0);
  await page.keyboard.press('Tab');
  check('native modal traps focus', await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  check('Escape closes rules and restores opener focus', !await page.locator('dialog').isVisible() && await page.locator('#help').evaluate(el => el === document.activeElement));
  await page.locator('#board').focus();
  check('board exposes visible focus outline', await page.locator('#board').evaluate(el => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 3));
  await page.keyboard.press('ArrowUp'); const walked = await snapshot(page);
  await page.keyboard.press('ArrowUp');
  check('real keyboard walking counts once and wall collision is ignored', walked.moves === 1 && walked.pushes === 0 && JSON.stringify(await snapshot(page)) === JSON.stringify(walked));
  await page.keyboard.press('z');
  check('Z undo restores complete initial position and both counts', JSON.stringify(await snapshot(page)) === JSON.stringify(initial));
  await page.locator('[data-direction="right"]').focus(); await page.keyboard.press('Enter');
  check('keyboard activation of direction button completes first original level', (await snapshot(page)).won && await page.locator('#completion').isVisible() && (await getSave(page)).best['1'] === 1);
  check('goal is its own retained terrain layer under crate', await page.locator('.goal .goal-marker').count() === 1 && await page.locator('.crate.on-goal .crate-check').count() === 1);
  await page.screenshot({ path: `${out}/victory-first.png`, fullPage: true });
  await page.locator('#undo').click();
  check('undo after victory restores gameplay without deleting best result', !(await snapshot(page)).won && (await snapshot(page)).moves === 0 && (await getSave(page)).best['1'] === 1);
  await execute(page, solutions[0]); await page.locator('#next').click();
  check('next level starts a fresh board with empty undo', (await snapshot(page)).level === 2 && (await snapshot(page)).moves === 0 && await page.locator('#undo').isDisabled());
  await page.reload({ waitUntil: 'networkidle' });
  check('reload remembers selected level and completed best record', (await snapshot(page)).level === 2 && (await getSave(page)).best['1'] === 1 && (await page.locator('#progress-count').textContent()).includes('1 / 12'));
  await execute(page, 'UR'); const beforeReset = await snapshot(page);
  await page.locator('#reset').click(); await page.keyboard.press('Escape');
  check('cancel reset preserves current position', JSON.stringify(await snapshot(page)) === JSON.stringify(beforeReset));
  await page.locator('#reset').click(); await page.locator('[data-confirm-reset]').click();
  check('confirmed reset clears position, counters and undo but preserves progress', (await snapshot(page)).moves === 0 && (await snapshot(page)).pushes === 0 && await page.locator('#undo').isDisabled() && (await getSave(page)).best['1'] === 1);
  await execute(page, 'URDR'); await page.locator('#undo').click(); await page.locator('#undo').click();
  check('unlimited stepwise undo works repeatedly', (await snapshot(page)).moves === 2);
  await page.locator('#reset').click(); await page.locator('[data-confirm-reset]').click();
  await page.locator('#reset').dblclick();
  check('rapid fresh reset is stable and leaves no dialog or stale undo', (await snapshot(page)).moves === 0 && !await page.locator('dialog').isVisible() && await page.locator('#undo').isDisabled());
  for (let id = 1; id <= 12; id++) {
    await select(page, id); await execute(page, solutions[id - 1]); const result = await snapshot(page);
    check(`real keyboard legal solution completes original level ${id}`, result.won && result.moves === solutions[id - 1].length && result.pushes > 0 && (await getSave(page)).best[String(id)] === result.moves);
  }
  check('final level offers all levels instead of nonexistent next level', !await page.locator('#next').isVisible() && await page.locator('#all-levels').isVisible() && (await page.locator('#progress-count').textContent()).includes('12 / 12'));
  await page.screenshot({ path: `${out}/victory-final.png`, fullPage: true });
  await page.reload({ waitUntil: 'networkidle' });
  check('all twelve completed records survive reload while in-progress board resets', Object.keys((await getSave(page)).best).length === 12 && (await snapshot(page)).moves === 0 && !(await snapshot(page)).won);
  await select(page, 10); await execute(page, solutions[9].slice(0, 8));
  await page.screenshot({ path: `${out}/desktop-1440.png`, fullPage: true });
  check('product has no global cheat state or test solutions', await page.evaluate(() => !('game' in window) && !('__GAME__' in window) && !('solutions' in window)));
  await page.locator('#choose').click();
  check('level picker exposes 12 accessible levels and completed labels', await page.locator('.level-choice').count() === 12 && await page.locator('.choice-number i').count() === 12);
  await page.screenshot({ path: `${out}/level-picker.png`, fullPage: true }); await page.keyboard.press('Escape');

  const mobile = (await setup(fixture(7), { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })).page;
  check('390px mobile has no horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth === innerWidth));
  const beforeMobile = await snapshot(mobile); await execute(mobile, 'L', 'touch');
  check('real touch direction button moves player', (await snapshot(mobile)).moves === 1 && (await snapshot(mobile)).player !== beforeMobile.player);
  await mobile.locator('#undo').tap();
  check('touch undo restores initial position', JSON.stringify(await snapshot(mobile)) === JSON.stringify(beforeMobile));
  await execute(mobile, solutions[6].slice(0, 8), 'touch');
  await mobile.screenshot({ path: `${out}/mobile-390.png`, fullPage: true });
  await mobile.locator('#reset').tap(); await mobile.locator('[data-confirm-reset]').tap();
  check('touch reset clears counters and undo', (await snapshot(mobile)).moves === 0 && await mobile.locator('#undo').isDisabled());
  await mobile.locator('#help').tap();
  check('mobile rules are visible with tappable close', await mobile.locator('dialog').isVisible() && await mobile.locator('#dialog-close').isVisible());
  await mobile.locator('#dialog-close').tap();
  await execute(mobile, solutions[6], 'touch');
  check('real touch solution completes multi-box planning level', (await snapshot(mobile)).won && (await snapshot(mobile)).moves === 30 && (await getSave(mobile)).best['7'] === 30);
  await mobile.locator('#next').tap(); await mobile.reload({ waitUntil: 'networkidle' });
  check('mobile next and refresh persist multi-box completion', (await snapshot(mobile)).level === 8 && (await getSave(mobile)).best['7'] === 30);
  await select(mobile, 12, true);
  check('touch level selection opens hardest original board', (await snapshot(mobile)).level === 12 && await mobile.locator('.crate').count() === 3);

  const small = (await setup(fixture(12), { viewport: { width: 360, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })).page;
  await execute(small, 'L', 'touch');
  check('360px largest board and controls do not overflow', await small.evaluate(() => document.documentElement.scrollWidth === innerWidth));
  check('reduced motion removes entry animation without blocking moves', await small.locator('.play-layout').evaluate(el => getComputedStyle(el).animationName === 'none') && (await snapshot(small)).moves === 1);
  await small.screenshot({ path: `${out}/mobile-360-reduced-motion.png`, fullPage: true });
  await small.locator('#choose').tap();
  check('360px level picker fits viewport without horizontal overflow', await small.evaluate(() => document.documentElement.scrollWidth === innerWidth) && await small.locator('.level-choice').count() === 12);

  const blocked = (await setup(undefined, {}, 'blocked')).page;
  await execute(blocked, solutions[0]);
  check('blocked storage still allows complete real gameplay with fallback notice', (await snapshot(blocked)).won && await blocked.locator('#storage-note').isVisible());
  await blocked.locator('#next').click();
  check('blocked storage still retains progress for current session', (await snapshot(blocked)).level === 2 && (await blocked.locator('#progress-count').textContent()).includes('1 / 12'));
  const corrupt = (await setup(undefined, {}, 'corrupt')).page;
  check('corrupt JSON degrades to playable default', (await snapshot(corrupt)).level === 1 && (await getSave(corrupt)).version === 1);
  const version = (await setup({ version: 9, selected: 12, best: { '1': 1 } })).page;
  check('unsupported version resets progress without crashing', (await snapshot(version)).level === 1 && Object.keys((await getSave(version)).best).length === 0);
  const illegal = (await setup({ version: 1, selected: -1, best: { '1': -3, '2': '4', '13': 2 } })).page;
  check('illegal stored fields are safely ignored', (await snapshot(illegal)).level === 1 && Object.keys((await getSave(illegal)).best).length === 0);
  check('no pageerror, console errors or resource 404/errors', errors.length === 0);
  await writeFile(`${out}/smoke-results.json`, JSON.stringify({ base, passed: checks.length, checks, errors }, null, 2));
  console.log(`\n${checks.length} browser checks passed against ${base}. Screenshots: ${out}`);
} finally {
  await Promise.all(contexts.map(context => context.close())); await browser.close();
  if (errors.length) console.error(errors);
}
