import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`page: ${e.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('requestfailed', (req) => {
  errors.push(`failed: ${req.url()} ${req.failure()?.errorText || ''}`);
});

await page.goto('https://dev.doeventsapp.com/', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(5000);

const url = page.url();
const root = await page.locator('#root').innerHTML().catch(() => '');
const bodyText = await page.locator('body').innerText().catch(() => '');

console.log(JSON.stringify({
  finalUrl: url,
  rootLength: root.length,
  rootPreview: root.slice(0, 400),
  bodyTextPreview: bodyText.slice(0, 200),
  errors,
}, null, 2));

await browser.close();
