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

  console.log('Clicking 3D MAP mode...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('3D Map') || b.textContent.includes('3D MAP'));
    if (btn) btn.click();
    else console.error('Could not find 3D Map button');
  });

  console.log('Waiting 10s for 3D tiles to load...');
  await new Promise(r => setTimeout(r, 10000));
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: `${ARTIFACT_DIR}/google_3d_tiles.png` });

  await browser.close();
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\nSuccess! No errors.');
  }
})();
