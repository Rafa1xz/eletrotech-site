import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import assert from 'node:assert/strict';

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

export async function createBrowser() {
  const executable =
    process.env.BROWSER_PATH ||
    (process.platform === 'win32'
      ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      : 'chromium');
  const profile = await mkdtemp(join(tmpdir(), 'eletrotech-browser-'));
  const child = spawn(
    executable,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { windowsHide: true, stdio: 'ignore' },
  );
  let socket,
    launchError,
    sequence = 0;
  const pending = new Map(),
    errors = [];
  child.once('error', (error) => {
    launchError = error;
  });
  async function close() {
    if (socket?.readyState === WebSocket.OPEN) await cdp('Browser.close').catch(() => {});
    socket?.close();
    child.kill();
    for (let attempt = 0; attempt < 20 && child.exitCode == null && !launchError; attempt++)
      await sleep(100);
    const local = relative(tmpdir(), profile);
    if (!local.startsWith('eletrotech-browser-') || local.includes(sep))
      throw Error('Perfil temporário inesperado.');
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  function cdp(method, params = {}) {
    return new Promise((done, fail) => {
      const id = ++sequence;
      const timer = setTimeout(() => {
        pending.delete(id);
        fail(Error('CDP timeout: ' + method));
      }, 15000);
      pending.set(id, { done, fail, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  try {
    let port;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (launchError) throw launchError;
      try {
        port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
        break;
      } catch {
        await sleep(100);
      }
    }
    assert(port, 'Set BROWSER_PATH to an installed Chromium browser.');
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
    await new Promise((done, fail) => {
      socket.onopen = done;
      socket.onerror = fail;
    });
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.exceptionThrown') errors.push(data.params);
      const task = pending.get(data.id);
      if (!task) return;
      pending.delete(data.id);
      clearTimeout(task.timer);
      data.error ? task.fail(data.error) : task.done(data.result);
    };
    socket.onclose = () => {
      for (const task of pending.values()) {
        clearTimeout(task.timer);
        task.fail(Error('Browser disconnected'));
      }
      pending.clear();
    };
    return { cdp, evaluate, errors, close };
  } catch (error) {
    await close();
    throw error;
  }
}
