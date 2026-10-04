import puppeteer from 'puppeteer';

const ARTIFACT_DIR = 'C:/Users/91882/.gemini/antigravity-ide/brain/12ff5d45-b544-47d7-a883-527da1f0ae6e';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--enable-accelerated-2d-canvas',
      '--no-first-run',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('[ERR]', msg.text().slice(0, 200));
    } else {
      console.log('[LOG]', msg.text().slice(0, 200));
    }
  });

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Boot wait
  await new Promise(r => setTimeout(r, 10000));

  // ── Step 6: Globe mode ────────────────────────────────────────────────────
  console.log('Globe mode...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => /globe/i.test(b.textContent));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 6000));

  // Count canvases
  const globeCanvasCount = await page.evaluate(
    () => document.querySelectorAll('canvas').length
  );
  console.log(`[CHECK] Canvas count in Globe mode: ${globeCanvasCount}`);

  await page.screenshot({ path: `${ARTIFACT_DIR}/proof_globe_imagery.png` });
  console.log('Saved: proof_globe_imagery.png');

  // ── Step 2: 3D Map mode at Mumbai (city with tall buildings) ─────────────
  console.log('Switching to 3D Map mode...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => /3d map/i.test(b.textContent));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 8000));

  const mapCanvasCount = await page.evaluate(
    () => document.querySelectorAll('canvas').length
  );
  console.log(`[CHECK] Canvas count in 3D Map mode: ${mapCanvasCount}`);

  await page.screenshot({ path: `${ARTIFACT_DIR}/proof_3dmap_imagery.png` });
  console.log('Saved: proof_3dmap_imagery.png');

  // ── Step 7: Rapid mode switching sanity check ─────────────────────────────
  console.log('Rapid mode switching...');
  for (const label of ['SKY', 'SHADOWS', 'GLOBE', '3D MAP', 'GLOBE']) {
    await page.evaluate((lbl) => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.toUpperCase().includes(lbl));
      if (btn) btn.click();
    }, label);
    await new Promise(r => setTimeout(r, 1500));
  }

  const finalCanvasCount = await page.evaluate(
    () => document.querySelectorAll('canvas').length
  );
  console.log(`[CHECK] Final canvas count after mode cycling: ${finalCanvasCount}`);
  await page.screenshot({ path: `${ARTIFACT_DIR}/proof_final_globe.png` });

  await browser.close();

  console.log('\n=== SUMMARY ===');
  console.log(`Globe canvas count: ${globeCanvasCount} (expected 1)`);
  console.log(`3D Map canvas count: ${mapCanvasCount} (expected 1)`);
  console.log(`Post-cycling canvas count: ${finalCanvasCount} (expected 1)`);

  if (errors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    errors.forEach(e => console.log(e.slice(0, 300)));
  } else {
    console.log('\nNo console errors.');
  }
})();
