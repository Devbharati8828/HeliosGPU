import puppeteer from 'puppeteer';

const ARTIFACT_DIR = 'C:/Users/91882/.gemini/antigravity-ide/brain/12ff5d45-b544-47d7-a883-527da1f0ae6e';

(async () => {
  console.log('Launching browser with GPU support...');
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
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type().toUpperCase()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(`[ERROR] ${text}`);
      console.log(`[CONSOLE ERROR] ${text}`);
    } else if (text.includes('[Cesium]') || text.includes('pitch') || text.includes('Buildings')) {
      console.log(`[LOG] ${text}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[EXCEPTION] ${err.message}`);
    console.log('[PAGE EXCEPTION]', err.message);
  });

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('Waiting for app to boot (8s)...');
  await new Promise(r => setTimeout(r, 8000));

  // ── GLOBE (default, New Delhi) ───────────────────────────────────────────
  console.log('Taking GLOBE screenshot (New Delhi)...');
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-globe.png` });

  // ── Switch to 3D MAP and search Tokyo ────────────────────────────────────
  console.log('Clicking 3D MAP...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('3D Map'));
    if (btn) btn.click();
    else console.error('Could not find 3D Map button');
  });
  
  // Wait for Cesium to reload and fly. Buildings + terrain stream in over ~5-8s
  console.log('Waiting 10s for 3D Map to render (buildings stream in)...');
  await new Promise(r => setTimeout(r, 10000));
  console.log('Taking 3D MAP screenshot (default city)...');
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-3dmap.png` });

  // ── Search Tokyo (a city with LOTS of buildings) ──────────────────────────
  console.log('Opening location search...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('New Delhi') || b.textContent.includes('Search') || b.id === 'location-search-btn');
    if (btn) btn.click();
    else {
      // Try clicking the location name in header
      const locBtn = document.querySelector('[data-location-search], #location-btn');
      if (locBtn) locBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Type Tokyo in the search box
  await page.evaluate(() => {
    const input = document.querySelector('input[type="text"], input[placeholder*="Search"], input[placeholder*="city"]');
    if (input) {
      input.value = '';
      input.focus();
    }
  });
  await page.keyboard.type('Tokyo', { delay: 50 });
  await new Promise(r => setTimeout(r, 2000));

  // Click first result
  await page.evaluate(() => {
    const results = document.querySelectorAll('[role="option"], .location-result, li');
    if (results.length > 0) results[0].click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Still in 3D Map? (Should have flown to Tokyo)
  console.log('Making sure 3D Map is still active...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('3D Map'));
    if (btn) btn.click();
  });

  console.log('Waiting 12s for Tokyo buildings to stream in...');
  await new Promise(r => setTimeout(r, 12000));
  console.log('Taking Tokyo 3D MAP screenshot...');
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-3dmap-tokyo.png` });

  // ── SKY mode ─────────────────────────────────────────────────────────────
  console.log('Clicking SKY...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'Sky');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-sky.png` });

  // ── SHADOWS mode ──────────────────────────────────────────────────────────
  console.log('Clicking SHADOWS...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('Shadows'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-shadows.png` });

  // ── Globe again (confirm Globe mode hides buildings) ─────────────────────
  console.log('Clicking GLOBE again to verify buildings hide...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'Globe');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-globe-after.png` });

  await browser.close();
  
  console.log('\n=== CONSOLE LOGS ===');
  logs.filter(l => l.includes('[Cesium]') || l.includes('pitch') || l.includes('Buildings')).forEach(l => console.log(l));

  console.log('\n=== ERRORS ===');
  if (errors.length === 0) console.log('No errors!');
  else errors.forEach(e => console.log(e));

  console.log('Done.');
})();
