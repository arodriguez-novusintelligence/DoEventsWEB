import { chromium } from 'playwright';

const baseUrl = 'https://qa.doeventsapp.com';
const email = 'qa-full@doeventsapp.com';
const password = 'QaTest123!';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});

try {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('text=Bienvenido de nuevo', { timeout: 15000 });
  console.log('OK: formulario de login visible');

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Iniciar sesión")');

  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 20000 });
  console.log(`OK: redirigido a ${page.url()}`);

  await page.waitForSelector('text=Wall', { timeout: 15000 }).catch(async () => {
    const body = await page.textContent('body');
    if (!body?.includes('evento') && !body?.includes('Event')) {
      throw new Error('Wall no cargó contenido esperado');
    }
  });
  console.log('OK: shell principal visible tras login');

  const token = await page.evaluate(() => localStorage.getItem('doevents_auth_token'));
  const userId = await page.evaluate(() => localStorage.getItem('doevents_user_id'));
  if (!token || !userId) throw new Error('Token o userId no persistidos en localStorage');
  console.log(`OK: sesión persistida userId=${userId}`);

  await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle', timeout: 30000 });
  const profileText = await page.textContent('body');
  if (!profileText?.includes('qa-full') && !profileText?.includes('Tatiana')) {
    throw new Error('Perfil no muestra datos del usuario');
  }
  console.log('OK: perfil accesible');

  if (errors.length) {
    console.warn('Advertencias:', errors.slice(0, 5).join('\n'));
  }
  console.log('\n=== E2E login QA: PASÓ ===');
  process.exit(0);
} catch (err) {
  console.error('FALLÓ:', err.message);
  if (errors.length) console.error('Errores JS:', errors.join('\n'));
  await page.screenshot({ path: 'e2e-login-fail.png', fullPage: true }).catch(() => {});
  process.exit(1);
} finally {
  await browser.close();
}
