import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.GAME_URL || 'http://localhost:5179';
const out = fileURLToPath(new URL('../artifacts/', import.meta.url));
const key = 'puzzle-sokoban-character-v1';
const ids = ['classic','chiikawa','hachiware','usagi','mole-croquette','old-dog','bear-raincoat','bear-pajama','bear-ninja','kurimanju','momonga','rakko','shisa','furuhonya','bear-strawberry','bear-frog','bear-astronaut','bear-chef','bear-pirate'];
const checks = []; const errors = []; const contexts = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); console.log('PASS', name); };
const boardState = page => page.locator('#board').evaluate(el => ({ level: el.dataset.level, moves: el.dataset.moves, pushes: el.dataset.pushes, player: el.querySelector('[data-player]').dataset.player, boxes: [...el.querySelectorAll('[data-box]')].map(box => box.dataset.box) }));
const selectedId = page => page.locator('[data-character][aria-pressed="true"]').getAttribute('data-character');
async function setup(mode = '', raw, options = {}) {
  const context = await browser.newContext({ viewport: {width:1440,height:900}, ...options }); contexts.push(context);
  if (mode || raw !== undefined) await context.addInitScript(({mode,raw,key}) => {
    if (mode === 'blocked') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked','SecurityError'); } });
    else if (mode === 'quota') Storage.prototype.setItem = () => { throw new DOMException('Quota','QuotaExceededError'); };
    else if (!sessionStorage.getItem('character-fixture')) { localStorage.setItem(key,raw); sessionStorage.setItem('character-fixture','1'); }
  }, {mode,raw,key});
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`pageerror ${error.message}`));
  page.on('console', message => { if(message.type()==='error') errors.push(`console ${message.text()}`); });
  page.on('response', response => { if(response.status()>=400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  await page.goto(base,{waitUntil:'networkidle'}); await page.locator('#companion-portrait').waitFor();
  return page;
}
try {
  await mkdir(out,{recursive:true});
  const page = await setup();
  check('visible themed companion has default portrait and full name', await selectedId(page)==='classic' && (await page.locator('#companion-name').textContent())==='Joke Bear' && await page.locator('#companion-portrait').evaluate(img=>img.complete && img.naturalWidth>0));
  check('companion does not add extra dialogs or replace the board worker', await page.locator('dialog').count()===1 && await page.locator('.worker').count()===1);
  await page.locator('#board').focus(); await page.keyboard.press('ArrowUp');
  const before = await boardState(page);
  await page.locator('.companion-summary').focus(); await page.keyboard.press('Enter');
  check('native details opens with keyboard', await page.locator('#characters').evaluate(el=>el.open));
  check('all nineteen choices have names, alt text and one pressed selection', await page.locator('[data-character]').count()===19 && await page.locator('[data-character][aria-label]').count()===19 && await page.locator('[data-character] img[alt]').count()===19 && await page.locator('[data-character][aria-pressed="true"]').count()===1);
  // Scroll each lazy portrait into view to prove all nineteen local resources decode.
  for(const id of ids) {
    const portrait=page.locator(`[data-character="${id}"] img`); await portrait.scrollIntoViewIfNeeded();
    await portrait.evaluate(img => img.decode());
  }
  check('all nineteen WebP portraits load and decode', await page.locator('[data-character] img').evaluateAll(images=>images.every(img=>img.complete && img.naturalWidth>0 && img.getAttribute('src').startsWith('./characters-2d/'))));
  await page.locator('[data-character="chiikawa"]').focus(); await page.keyboard.press('ArrowRight');
  check('direction keys on character controls do not move game', JSON.stringify(await boardState(page))===JSON.stringify(before));
  check('character button has visible focus', await page.locator('[data-character="chiikawa"]').evaluate(el=>getComputedStyle(el).outlineStyle!=='none' && parseFloat(getComputedStyle(el).outlineWidth)>=3));
  await page.keyboard.press('Enter');
  check('keyboard selection updates name and pressed state, collapses and restores summary focus', await selectedId(page)==='chiikawa' && (await page.locator('#companion-name').textContent())==='吉伊' && !await page.locator('#characters').evaluate(el=>el.open) && await page.locator('.companion-summary').evaluate(el=>el===document.activeElement));
  check('choosing a companion preserves exact level, player, boxes and counters', JSON.stringify(await boardState(page))===JSON.stringify(before));
  for(const id of ids) {
    await page.locator('.companion-summary').click(); await page.locator(`[data-character="${id}"]`).click();
    assert.equal(await selectedId(page),id); assert.equal(await page.locator('#characters').evaluate(el=>el.open),false);
  }
  check('every one of nineteen identities is selectable and closes picker', await selectedId(page)==='bear-pirate' && JSON.stringify(await boardState(page))===JSON.stringify(before));
  await page.reload({waitUntil:'networkidle'});
  check('independent versioned character preference survives refresh', await selectedId(page)==='bear-pirate' && (await page.locator('#companion-name').textContent())==='海盗熊' && await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).version===1,key));
  await page.locator('.companion-summary').focus(); await page.keyboard.press('Space'); await page.locator('[data-character="usagi"]').focus(); await page.keyboard.press('Escape');
  check('Escape closes picker and returns focus to summary without selecting', !await page.locator('#characters').evaluate(el=>el.open) && await page.locator('.companion-summary').evaluate(el=>el===document.activeElement) && await selectedId(page)==='bear-pirate');
  await page.screenshot({path:`${out}/characters-desktop.png`,fullPage:true});
  await page.locator('.companion-summary').click(); await page.screenshot({path:`${out}/characters-picker.png`,fullPage:true});

  const mobile=await setup('',undefined,{viewport:{width:360,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  check('360px collapsed companion has no horizontal overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  await mobile.locator('.companion-summary').tap();
  check('360px expanded nineteen-character grid has no horizontal overflow',await mobile.locator('[data-character]').count()===19 && await mobile.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  await mobile.screenshot({path:`${out}/characters-mobile-360-picker.png`,fullPage:true});
  await mobile.locator('[data-character="bear-raincoat"]').tap();
  check('touch selection shows complete long character name and preserves game',await selectedId(mobile)==='bear-raincoat' && (await mobile.locator('#companion-name').textContent())==='小黄鸭雨衣熊' && (await boardState(mobile)).moves==='0' && await mobile.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  await mobile.screenshot({path:`${out}/characters-mobile-360.png`,fullPage:true});
  await mobile.locator('[data-direction="up"]').tap();
  check('touch game remains playable after character selection', (await boardState(mobile)).moves==='1');
  for(const [mode,raw] of [['corrupt','{broken'],['illegal',JSON.stringify({version:1,id:'../invalid'})],['version',JSON.stringify({version:2,id:'chiikawa'})],['fields',JSON.stringify({version:1,id:19})]]) {
    const invalid=await setup(mode,raw);
    check(`${mode} saved character safely defaults`,await selectedId(invalid)==='classic' && await invalid.locator('#companion-portrait').evaluate(img=>img.complete && img.naturalWidth>0));
  }
  for(const mode of ['blocked','quota']) {
    const blocked=await setup(mode);
    await blocked.locator('.companion-summary').click(); await blocked.locator('[data-character="hachiware"]').click();
    check(`${mode} storage still allows changing companion with notice`,await selectedId(blocked)==='hachiware' && await blocked.locator('.companion-storage-note').isVisible());
    await blocked.locator('#board').focus(); await blocked.keyboard.press('ArrowRight');
    check(`${mode} storage still allows real winning move`,await blocked.locator('#board').getAttribute('data-won')==='true');
  }
  check('no product cheat globals',await page.evaluate(()=>!('game' in window)&&!('__GAME__' in window)&&!('characters' in window && window.characters?.tagName===undefined)));
  check('no pageerror, console errors or HTTP resource errors',errors.length===0);
  await writeFile(`${out}/characters-results.json`,JSON.stringify({base,passed:checks.length,checks,errors},null,2));
  console.log(`\n${checks.length} companion browser checks passed against ${base}`);
} finally {
  await Promise.all(contexts.map(context=>context.close())); await browser.close();
  if(errors.length)console.error(errors);
}
