import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log('[PAGE EXCEPTION]', err.message);
  });

  console.log('Navigating to http://localhost:5173/');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log('Waiting for initial load (5s)...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Clicking SKY...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Sky'));
    if (btn) btn.click();
    else console.log('[TEST ERROR] Could not find SKY button');
  });

  console.log('Waiting 3 seconds...');
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
  console.log('Done.');
})();
