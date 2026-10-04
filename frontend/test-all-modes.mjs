import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/91882/.gemini/antigravity-ide/brain/12ff5d45-b544-47d7-a883-527da1f0ae6e';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push(`[${msg.type().toUpperCase()}] ${text}`);
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${text}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[EXCEPTION] ${err.message}`);
    console.log('[PAGE EXCEPTION]', err.message);
  });

  console.log('Navigating to http://localhost:5173/');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log('Waiting for app to boot (6s)...');
  await new Promise(r => setTimeout(r, 6000));
  
  // --- GLOBE mode ---
  console.log('Taking GLOBE screenshot...');
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-globe.png` });

  // --- 3D MAP mode ---
  console.log('Clicking 3D MAP...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('3D Map'));
    if (btn) btn.click();
    else console.error('Could not find 3D Map button');
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-3dmap.png` });

  // --- SKY mode ---
  console.log('Clicking SKY...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim() === 'Sky');
    if (btn) btn.click();
    else console.error('Could not find Sky button');
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-sky.png` });

  // --- SHADOWS mode ---
  console.log('Clicking SHADOWS...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Shadows'));
    if (btn) btn.click();
    else console.error('Could not find Shadows button');
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/test-shadows.png` });

  await browser.close();
  
  console.log('\n=== ERRORS FOUND ===');
  if (errors.length === 0) console.log('No errors!');
  else errors.forEach(e => console.log(e));
  
  console.log('Done.');
})();
