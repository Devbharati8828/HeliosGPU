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
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('[CONSOLE ERROR]', msg.text());
    } else {
      console.log('[LOG]', msg.text());
    }
  });
  
  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('Waiting for app to boot...');
  await new Promise(r => setTimeout(r, 8000));

  console.log('1. Globe Mode screenshot...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Globe') || b.textContent.includes('GLOBE'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/regression_globe.png` });

  console.log('2. 3D Map Mode screenshot...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D Map') || b.textContent.includes('3D MAP'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/regression_3d_map.png` });

  console.log('3. Sky Mode screenshot...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sky') || b.textContent.includes('SKY'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/regression_sky.png` });

  console.log('4. Switch to Shadows Mode (Rishikesh, Hilly)...');
  // First, set location to Rishikesh
  await page.evaluate(() => {
    window.__HELIOS_STORE_HACK = (lat, lng, name) => {
      // Find the store and set it
      // Actually we can just dispatch a custom event or do something simple.
    };
  });
  // Without hacking, we can just click the location button and type if we had to, but it's easier to just use the UI or store if exposed.
  // We'll assume default location (New Delhi) first.
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Shadows') || b.textContent.includes('SHADOWS'));
    if (btn) btn.click();
  });

  // Capture loading state quickly!
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shadows_loading.png` });

  // Wait for fetch to finish
  await new Promise(r => setTimeout(r, 8000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shadows_new_delhi_flat.png` });

  // Now change location to Rishikesh (hilly) via evaluate
  await page.evaluate(() => {
    // We can simulate clicking the location search, typing Rishikesh, and selecting it.
    const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Delhi'));
    if (searchBtn) searchBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.keyboard.type('Rishikesh');
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.press('Enter');
  
  console.log('Waiting for Rishikesh DEM to fetch...');
  await new Promise(r => setTimeout(r, 8000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shadows_rishikesh_hilly.png` });

  await browser.close();
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\nSuccess! No errors.');
  }
})();
