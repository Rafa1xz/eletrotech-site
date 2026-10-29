// Browser regression checks for navigation and the floating WhatsApp control.
// Run from the project root with Node.js 24; override BROWSER_PATH if needed.
import {spawn} from 'node:child_process';
import {mkdtemp, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const browserPath = process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = await mkdtemp(join(tmpdir(), 'eletrotech-navigation-qa-'));
const browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], {windowsHide: true, stdio: 'ignore'});
const sleep = ms => new Promise(done => setTimeout(done, ms));
let socket;

try {
  let port;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; }
    catch { await sleep(100); }
  }
  assert(port, 'The browser did not start. Set BROWSER_PATH to an installed Chromium browser.');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') errors.push(data.params);
    const task = pending.get(data.id);
    if (task) {
      pending.delete(data.id);
      clearTimeout(task.timer);
      data.error ? task.fail(data.error) : task.done(data.result);
    }
  };
  function cdp(method, params = {}) {
    return new Promise((done, fail) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); fail(Error(`CDP timeout: ${method}`)); }, 15000);
      pending.set(id, {done, fail, timer});
      socket.send(JSON.stringify({id, method, params}));
    });
  }
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function navigate(file, width, reducedMotion = true) {
    await cdp('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: false});
    await cdp('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference'}]});
    await cdp('Page.navigate', {url: pathToFileURL(resolve(file)).href});
    for (let attempt = 0; attempt < 80; attempt++) {
      await sleep(50);
      if (await evaluate("document.readyState === 'complete' && document.querySelector('.floating-contact')?.dataset.contactEnhanced === 'true'")) return;
    }
    assert.fail(`Page did not finish initializing: ${file}`);
  }
  async function pointAt(selector) {
    const point = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw Error('Missing control: ' + ${JSON.stringify(selector)});
      element.scrollIntoView({block: 'center', behavior: 'instant'});
      const box = element.getBoundingClientRect();
      return {x: box.x + box.width / 2, y: box.y + box.height / 2};
    })()`);
    await cdp('Input.dispatchMouseEvent', {type: 'mouseMoved', ...point});
    return point;
  }
  async function click(selector) {
    const point = await pointAt(selector);
    const hit = await evaluate(`!!document.elementFromPoint(${point.x}, ${point.y})?.closest(${JSON.stringify(selector)})`);
    assert(hit, `Another element obscures ${selector}`);
    await cdp('Input.dispatchMouseEvent', {type: 'mousePressed', ...point, button: 'left', clickCount: 1});
    await cdp('Input.dispatchMouseEvent', {type: 'mouseReleased', ...point, button: 'left', clickCount: 1});
  }
  const whatsappState = () => evaluate(`(() => {
    const button = document.querySelector('.floating-contact');
    return {width: button.getBoundingClientRect().width, expanded: button.classList.contains('is-expanded'), labelOpacity: getComputedStyle(button.querySelector('.ww-float-whatsapp__label')).opacity};
  })()`);
  function assertCompact(state, context) {
    assert(state.width <= 60.1 && !state.expanded, `${context}: ${JSON.stringify(state)}`);
  }

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Page.addScriptToEvaluateOnNewDocument', {source: `
    window.__qaExternalOpen = [];
    window.open = url => { window.__qaExternalOpen.push(url); return null; };
    document.addEventListener('click', event => {
      if (event.target.closest('a[href*="wa.me"]')) event.preventDefault();
    }, true);
  `});

  let headerChecks = 0;
  for (const file of ['index.html', 'produtos.html', 'contato.html']) {
    for (const width of [1281, 1366, 1440]) {
      await navigate(file, width);
      const outliers = await evaluate(`(() => {
        const shell = document.querySelector('.nav-shell').getBoundingClientRect();
        return [...document.querySelectorAll('.nav-shell > .brand, .nav-shell > #main-nav, .nav-shell > .header-actions, .nav-shell > .menu-toggle')]
          .filter(element => getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden')
          .map(element => ({name: element.className || element.id, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right}))
          .filter(box => box.left < shell.left - 1 || box.right > shell.right + 1);
      })()`);
      assert.equal(outliers.length, 0, `${file} header exceeds its shell at ${width}px: ${JSON.stringify(outliers)}`);
      headerChecks++;
    }
  }

  for (const width of [320, 390]) {
    await navigate('produtos.html', width);
    await click('.menu-toggle');
    assert.equal(await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"), 'true');
    const arrow = await evaluate(`(() => {
      const link = document.querySelector('#main-nav > a[aria-current]');
      return {text: getComputedStyle(link).color, arrow: getComputedStyle(link, '::after').color, content: getComputedStyle(link, '::after').content};
    })()`);
    assert.equal(arrow.arrow, arrow.text, `Current-page arrow must inherit readable link color at ${width}px: ${JSON.stringify(arrow)}`);
    assert(!['none', 'normal', '""'].includes(arrow.content), 'The navigation arrow should remain present');
    await cdp('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
    assert.equal(await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"), 'false');
  }

  let compactChecks = 0;
  for (const reducedMotion of [true, false]) {
    for (const [file, width] of [['index.html', 1440], ['produtos.html', 390]]) {
      await cdp('Input.dispatchMouseEvent', {type: 'mouseMoved', x: 0, y: 0});
      await navigate(file, width, reducedMotion);
      assertCompact(await whatsappState(), `${file} initial reducedMotion=${reducedMotion}`);
      await sleep(1700); // Crosses the automatic typing-indicator start time.
      assertCompact(await whatsappState(), `${file} idle reducedMotion=${reducedMotion}`);
      compactChecks++;
    }
  }

  await navigate('index.html', 1440, true);
  await pointAt('.floating-contact');
  const hovered = await whatsappState();
  assert(hovered.width > 140 && Number(hovered.labelOpacity) > .9, `Hover should reveal the label: ${JSON.stringify(hovered)}`);
  await cdp('Input.dispatchMouseEvent', {type: 'mouseMoved', x: 0, y: 0});
  await sleep(1100);
  assertCompact(await whatsappState(), 'Mouse out under reduced motion');

  await cdp('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9});
  await evaluate("document.querySelector('.floating-contact').focus()");
  assert((await whatsappState()).width > 140, 'Keyboard focus should reveal the label under reduced motion');
  await evaluate("document.querySelector('.search-toggle').focus()");
  await sleep(750);
  assertCompact(await whatsappState(), 'Blur under reduced motion');
  assert.equal(await evaluate('window.__qaExternalOpen.length'), 0, 'QA must not open external messaging');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(`PASS: ${headerChecks} header alignment checks, two real mobile-menu checks, ${compactChecks} idle WhatsApp checks, reduced-motion hover/focus/leave/blur. No external messages opened.`);
} finally {
  socket?.close();
  browser.kill();
}
