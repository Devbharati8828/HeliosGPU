import puppeteer from 'puppeteer';
import fs from 'fs';

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

  page.on('console', msg => console.log('[LOG]', msg.text()));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));

  // Go to Shadows Mode
  console.log('Switching to shadows mode...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toUpperCase().includes('SHADOWS'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shadow_himalaya.png` });

  // Open LocationSearch
  console.log('Opening location search...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Uttarakhand Himalaya'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click 'Machu Picchu, Peru' in the popular list
  console.log('Selecting Machu Picchu...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[cmdk-item]'));
    const mp = items.find(i => i.textContent.includes('Machu Picchu'));
    if (mp) mp.click();
  });

  console.log('Waiting for DEM to fetch for Machu Picchu...');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shadow_machu_picchu.png` });

  await browser.close();
  console.log('Done.');
})();
