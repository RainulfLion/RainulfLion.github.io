const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.HERALDRY_BASE_URL || 'http://127.0.0.1:8765/Heraldry/';
const fixture = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path fill="white" d="M10 10H90V90H10Z"/><path fill="black" d="M10 45H90V55H10Z"/><path fill="red" d="M10 10H30V30H10Z"/></svg>';
const closeColor = (actual, expected, message) => assert(actual.every((v, i) => Math.abs(v - expected[i]) <= 2), `${message}: ${actual} != ${expected}`);

async function sample(page, points, dataUrl) {
  return page.evaluate(async ({ points, dataUrl }) => {
    const url = dataUrl || URL.createObjectURL(new Blob([exportSVGString().str], { type: 'image/svg+xml' }));
    try {
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 960;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 800, 960);
      return points.map(([x, y]) => [...ctx.getImageData(x * 4, y * 4, 1, 1).data]);
    } finally { if (!dataUrl) URL.revokeObjectURL(url); }
  }, { points, dataUrl });
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + 'designer.html');
    const png = await page.evaluate(async source => {
      const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(source); await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 100;
      canvas.getContext('2d').drawImage(img, 0, 0); return canvas.toDataURL('image/png').split(',')[1];
    }, fixture);

    for (const format of ['svg', 'png']) {
      await page.evaluate(() => {
        state.layers = []; state.sel = null; state.division = 'plain'; state.ordinary = 'none';
        state.shading = false; state.outline = false; getFill(0).color = '#112233'; render();
      });
      await page.locator('#fileInput').setInputFiles({
        name: `fixture.${format}`, mimeType: format === 'svg' ? 'image/svg+xml' : 'image/png',
        buffer: format === 'svg' ? Buffer.from(fixture) : Buffer.from(png, 'base64')
      });
      await page.waitForFunction(() => state.layers.length === 1);
      await page.evaluate(() => { Object.assign(state.layers[0], { x: 50, y: 60, w: 100, h: 100 }); render(); });
      const source = await page.evaluate(() => state.layers[0].href);
      assert.equal(await page.locator('#sColorMode').inputValue(), 'original');
      assert.equal(await page.locator('#sKeepDetails').isVisible(), false);
      await page.locator('#sColorMode').selectOption('solid');
      await page.locator('#sColor').fill('#00cc66');
      let pixels = await sample(page, [[85, 95], [85, 110], [65, 80], [55, 65], [0, 0]]);
      for (const p of pixels.slice(0, 3)) closeColor(p, [0, 204, 102, 255], `${format} solid recolor`);
      closeColor(pixels[3], [17, 34, 51, 255], 'transparent source reveals field');
      assert.equal(pixels[4][3], 0, 'transparent export outside shield');
      await page.locator('#sKeepDetails').check();
      pixels = await sample(page, [[85, 95], [85, 110]]);
      closeColor(pixels[0], [0, 204, 102, 255], 'white fill recolored');
      closeColor(pixels[1], [0, 0, 0, 255], 'black linework retained');
      await page.locator('#sColorMode').selectOption('original');
      pixels = await sample(page, [[85, 95], [85, 110], [65, 80]]);
      [[255, 255, 255, 255], [0, 0, 0, 255], [255, 0, 0, 255]].forEach((expected, i) => closeColor(pixels[i], expected, 'original restored'));
      assert.equal(await page.evaluate(() => state.layers[0].href), source);
      await page.locator('#sColorMode').selectOption('split');
      await page.locator('#sKeepDetails').uncheck();
      await page.locator('#sColor').fill('#ff0000');
      await page.locator('#sColor2').fill('#0000ff');
      pixels = await sample(page, [[85, 95], [115, 95]]);
      closeColor(pixels[0], [255, 0, 0, 255], 'left color');
      closeColor(pixels[1], [0, 0, 255, 255], 'right color');
      await page.locator('#sSwapColors').click();
      pixels = await sample(page, [[85, 95], [115, 95]]);
      closeColor(pixels[0], [0, 0, 255, 255], 'swapped left');
      closeColor(pixels[1], [255, 0, 0, 255], 'swapped right');
      await page.locator('#sColorSplit').selectOption('perFess');
      pixels = await sample(page, [[85, 95], [85, 125]]);
      closeColor(pixels[0], [0, 0, 255, 255], 'top split');
      closeColor(pixels[1], [255, 0, 0, 255], 'bottom split');

      await page.evaluate(() => { state.division = 'perPale'; getFill(0).color = '#000000'; getFill(1).color = '#ffffff'; render(); });
      await page.locator('#sColorMode').selectOption('counterchanged');
      await page.locator('#sSwapColors').click();
      pixels = await sample(page, [[90, 100], [110, 100]]);
      closeColor(pixels[0], [0, 0, 0, 255], 'counterchanged colors swap back to field order');
      closeColor(pixels[1], [255, 255, 255, 255], 'counterchanged swapped right');
      await page.locator('#sSwapColors').click();
      for (const transform of [{ rot: 0 }, { rot: 37, flipH: true, flipV: true }, { rot: 90, x: 40, w: 120, h: 110 }]) {
        await page.evaluate(t => { Object.assign(state.layers[0], t); renderLayers(); }, transform);
        pixels = await sample(page, [[90, 100], [110, 100]]);
        closeColor(pixels[0], [255, 255, 255, 255], 'counterchange left after transform');
        closeColor(pixels[1], [0, 0, 0, 255], 'counterchange right after transform');
      }
      await page.evaluate(() => { getFill(0).color = '#0066ff'; getFill(1).color = '#ffd000'; render(); });
      pixels = await sample(page, [[90, 100], [110, 100]]);
      closeColor(pixels[0], [255, 208, 0, 255], 'field color edit updates left');
      closeColor(pixels[1], [0, 102, 255, 255], 'field color edit updates right');
      await page.evaluate(() => { state.division = 'perFess'; getFill(0).color = '#000000'; getFill(1).color = '#ffffff'; render(); });
      pixels = await sample(page, [[90, 95], [90, 125]]);
      closeColor(pixels[0], [255, 255, 255, 255], 'changed field division top');
      closeColor(pixels[1], [0, 0, 0, 255], 'changed field division bottom');
      const definitions = await page.locator('[data-layer-paint]').count();
      await page.evaluate(() => { for (let i = 0; i < 30; i++) renderLayers(); });
      assert.equal(await page.locator('[data-layer-paint]').count(), definitions, 'no leaked filters or clips');
      await page.locator('#dupBtn').click();
      assert.equal(await page.evaluate(() => state.layers[1].colorMode), 'counterchanged');
      assert.equal(await page.evaluate(() => {
        const ids = [...defs.querySelectorAll('[id]')].map(n => n.id); return ids.length === new Set(ids).size;
      }), true, 'duplicate has distinct filter and clipping IDs');
      console.log(`PASS ${format}: import, original restore, recolor, linework, transparency, split/swap, transformed counterchange, field edits, duplicate, definition cleanup`);
    }

    // Built-in cross, actual downloaded exports, and selection/dragging of colored copies.
    await page.evaluate(() => {
      state.layers = []; state.division = 'perPale'; getFill(0).color = '#000000'; getFill(1).color = '#ffffff'; render();
    });
    await page.getByRole('button', { name: 'Cross Moline', exact: true }).click();
    await page.locator('#sColorMode').selectOption('counterchanged');
    let pixels = await sample(page, [[99, 108], [101, 108]]);
    closeColor(pixels[0], [255, 255, 255, 255], 'cross left');
    closeColor(pixels[1], [0, 0, 0, 255], 'cross right');
    await page.locator('#expSize').selectOption('800');
    for (const [id, format] of [['saveSvgBtn', 'svg+xml'], ['saveBtn', 'png']]) {
      const download = page.waitForEvent('download'); await page.locator('#' + id).click();
      const file = await (await download).path();
      const dataUrl = `data:image/${format};base64,${fs.readFileSync(file).toString('base64')}`;
      pixels = await sample(page, [[99, 108], [101, 108]], dataUrl);
      closeColor(pixels[0], [255, 255, 255, 255], `${format} download left`);
      closeColor(pixels[1], [0, 0, 0, 255], `${format} download right`);
    }
    await page.evaluate(() => select(null));
    const point = await page.evaluate(() => {
      const p = svg.createSVGPoint(); p.x = 99; p.y = 108;
      const s = p.matrixTransform(svg.getScreenCTM()); return { x: s.x, y: s.y };
    });
    await page.mouse.move(point.x, point.y); await page.mouse.down();
    await page.mouse.move(point.x + 10, point.y + 10); await page.mouse.up();
    assert(await page.evaluate(() => state.sel === state.layers[0].id && state.layers[0].x > 64));

    for (const asset of ['heraldic-rose', 'lion-rampant-argent', 'cross-moline']) {
      await page.goto(base + 'designer.html?asset=' + asset);
      await page.waitForFunction(() => state.layers.length === 1);
      await page.locator('#sColorMode').selectOption('solid');
      await page.locator('#sColor').fill('#7722dd');
      await page.locator('#sKeepDetails').check();
      const exported = await page.evaluate(() => exportSVGString().str);
      assert(exported.includes('charge-color-'));
      assert(exported.includes('Artwork sources and licenses'));
      await sample(page, [[100, 110]]); // Nested SVG/PNG must decode in a standalone export.
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#tab-adjust').click();
    assert(await page.locator('#sColorMode').isVisible());
    await page.locator('#sColorMode').selectOption('split');
    await page.locator('#sColor').fill('#00aa44');
    await page.locator('#sColor2').fill('#ffd000');
    await page.locator('#sSwapColors').click();
    assert.equal(await page.locator('#sColor').inputValue(), '#ffd000');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#tab-save').click();
    await page.locator('#expSize').selectOption('800'); await page.locator('#saveBtn').click();
    await page.locator('#phoneExport[open]').waitFor();
    await page.locator('#phoneExportImage').evaluate(img => img.decode());
    assert.equal(await page.locator('#phoneExportImage').evaluate(img => img.naturalWidth), 800);
    assert.deepEqual(errors, []);
    console.log('PASS cross, exported PNG/SVG pixels, pointer selection/drag, catalog SVG/PNG recoloring, credits, mobile colors and export; no page errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
