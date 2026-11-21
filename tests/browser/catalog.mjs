import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createBrowser, sleep } from '../helpers/browser.mjs';
const root = resolve('dist'),
  folder = resolve('.cache/review/catalog');
await mkdir(folder, { recursive: true });
const browser = await createBrowser();
const { cdp, evaluate, errors } = browser;
try {
  async function navigate(file) {
    await cdp('Page.navigate', { url: pathToFileURL(resolve(root, file)).href });
    await sleep(130);
    for (let i = 0; i < 40; i++) {
      if (await evaluate('document.readyState==="complete"')) break;
      await sleep(80);
    }
    await evaluate(
      'Promise.all([...document.images].filter(i=>i.loading!=="lazy").map(i=>i.decode().catch(()=>{})))',
    );
  }
  const { products } = JSON.parse(await readFile(join(root, 'data/products.json'), 'utf8'));
  const routes = products.filter((p) => p.active).map((p) => 'produtos/' + p.slug + '.html');
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  let checks = 0;
  for (const width of [1440, 1024, 768, 390, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
    for (const file of ['portfolio.html', ...routes]) {
      await navigate(file);
      const state = await evaluate(
        `({overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,broken:[...document.images].filter(i=>i.loading!=='lazy'&&!i.naturalWidth).length,canonical:document.querySelector('link[rel=canonical]')?.href,ids:[...document.querySelectorAll('[id]')].map(e=>e.id)})`,
      );
      assert(!state.overflow, `${file} overflow ${width}`);
      assert.equal(state.h1, 1);
      assert.equal(state.broken, 0);
      assert(state.canonical);
      assert.equal(new Set(state.ids).size, state.ids.length);
      if (file.startsWith('produtos/')) {
        const p = products.find((p) => file.endsWith(p.slug + '.html'));
        const quote = await evaluate(
          'new URL(document.querySelector("[data-product-quote]").href).searchParams.get("text")',
        );
        assert(quote.includes(p.name));
        assert(quote.includes(p.slug + '.html'));
        const heading = await evaluate('document.querySelector("h1").textContent');
        assert.equal(heading, p.name);
        assert(
          (await evaluate('document.querySelector("meta[name=description]").content')).length > 20,
        );
        const seo = await evaluate(
          '[...document.querySelectorAll("script[type=\\"application/ld+json\\"]")].map(e=>JSON.parse(e.textContent))',
        );
        assert(seo.some((s) => s['@type'] === 'Product'));
      }
      if (
        [1440, 390].includes(width) &&
        ['produtos/painel-da-sonda.html', 'portfolio.html'].includes(file)
      ) {
        const shot = await cdp('Page.captureScreenshot', { format: 'png' });
        await writeFile(
          join(folder, file.replaceAll('/', '-') + '-' + width + '.png'),
          Buffer.from(shot.data, 'base64'),
        );
      }
      checks++;
    }
  }
  await navigate('produtos/painel-da-sonda.html');
  await evaluate('document.querySelector("[data-gallery-main]").click()');
  assert(await evaluate('document.querySelector("dialog").open'));
  await cdp('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'ArrowRight',
    code: 'ArrowRight',
    windowsVirtualKeyCode: 39,
  });
  assert(
    (await evaluate('document.querySelector("dialog img").src')).endsWith('painel-sonda-hero.jpeg'),
  );
  await cdp('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await sleep(50);
  assert(
    await evaluate(
      '!document.querySelector("dialog").open && document.activeElement.hasAttribute("data-gallery-main")',
    ),
  );
  await evaluate('document.querySelector("[data-lang=es]").click()');
  assert(
    (
      await evaluate(
        'new URL(document.querySelector("[data-product-quote]").href).searchParams.get("text")',
      )
    ).includes('Tablero de sonda'),
  );
  await cdp('Emulation.setScriptExecutionDisabled', { value: true });
  await navigate('produtos/motores-hercules.html');
  await cdp('Emulation.setScriptExecutionDisabled', { value: false });
  assert((await evaluate('document.querySelector("h1").textContent')).includes('Motores'));
  assert.equal(await evaluate('document.querySelectorAll("[data-gallery-item]").length'), 2);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(
    `PASS: ${checks} page/viewport checks, galleries, focus restoration, translated product quote, SEO and static content.`,
  );
  console.log('Screenshots: ' + folder);
} finally {
  await browser.close();
}
