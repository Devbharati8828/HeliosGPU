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
  
  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('Waiting for app to boot (6s)...');
  await new Promise(r => setTimeout(r, 6000));

  console.log('Setting location to Rishikesh and Time to Morning via store...');
  await page.evaluate(() => {
    // Assuming useHeliosStore is attached to window for debugging or we can just trigger it if exposed
    // Wait, let's just click the New Delhi button, type Rishikesh, and select it.
  });

  // Just going to navigate to shadows first
  console.log('Clicking SHADOWS mode...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('Shadows') || b.textContent.includes('SHADOWS'));
    if (btn) btn.click();
    else console.error('Could not find Shadows button');
  });

  console.log('Waiting 10s for DEM to load and WebGPU compute to initialize...');
  await new Promise(r => setTimeout(r, 10000));
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: `${ARTIFACT_DIR}/shadows_phase5_screenshot.png` });

  await browser.close();
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\nSuccess! No errors.');
  }
})();
