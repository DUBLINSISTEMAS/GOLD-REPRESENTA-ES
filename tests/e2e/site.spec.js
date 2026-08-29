import { test, expect } from '@playwright/test';

const collectErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

test.describe('landing page', () => {
  test('loads without console errors and shows the hero', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Gold Representações/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('has landmarks, a skip link and a single h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#conteudo');
    // On mobile the menu is display:none until opened, so query the DOM, not the a11y tree.
    await expect(page.locator('nav#menu-principal[aria-label="Navegação principal"]')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
  });

  test('does not overflow horizontally', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('every image declares width and height (no layout shift)', async ({ page }) => {
    await page.goto('/');
    const missing = await page.$$eval('img', (images) =>
      images.filter((img) => !img.getAttribute('width') || !img.getAttribute('height')).map((img) => img.src),
    );
    expect(missing).toEqual([]);
  });

  test('all WhatsApp links point to the same configured number', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.$$eval('a[href*="wa.me"]', (anchors) => anchors.map((a) => a.href));
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    const numbers = new Set(hrefs.map((href) => new URL(href).pathname.replace('/', '')));
    expect(numbers.size).toBe(1);
    expect([...numbers][0]).toMatch(/^\d{12,13}$/);
  });

  test('external links are safe and no link is a dead "#"', async ({ page }) => {
    await page.goto('/');
    const unsafe = await page.$$eval('a[target="_blank"]', (anchors) =>
      anchors.filter((a) => !/\bnoopener\b/.test(a.rel)).map((a) => a.href),
    );
    expect(unsafe).toEqual([]);
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
  });

  test('SEO files and the privacy page are served', async ({ request }) => {
    for (const path of ['/robots.txt', '/sitemap.xml', '/site.webmanifest', '/og-image.jpg', '/privacidade.html']) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }
  });

  test('map is only loaded after an explicit click', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.getByRole('button', { name: 'Carregar mapa' }).click();
    await expect(page.locator('#map-facade iframe')).toHaveAttribute('title', /Mapa/);
  });
});

test.describe('lead capture', () => {
  test('chatbot ends with a WhatsApp link the visitor clicks', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Abrir assistente virtual' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: 'Comprar imóvel' }).click();
    await page.getByRole('button', { name: 'R$ 150 a 300 mil' }).click();

    const link = page.locator('a.chat-wa-link');
    await expect(link).toBeVisible();
    const href = decodeURIComponent(await link.getAttribute('href'));
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(href).toContain('*Imóvel*');
    expect(href).toContain('*R$ 150 a 300 mil*');
  });

  test('chatbot accepts a typed amount', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir assistente virtual' }).click();
    await page.getByRole('button', { name: 'Comprar veículo' }).click();
    const input = page.getByLabel('Sua resposta');
    await expect(input).toBeEnabled();
    await input.fill('80 mil');
    await input.press('Enter');

    const link = page.locator('a.chat-wa-link');
    await expect(link).toBeVisible();
    expect(decodeURIComponent(await link.getAttribute('href'))).toContain('*80 mil*');
  });

  test('contact form validates, then hands the message to WhatsApp', async ({ page }) => {
    await page.addInitScript(() => {
      window.__opened = [];
      window.open = (url) => {
        window.__opened.push(url);
        return null;
      };
    });
    await page.goto('/');
    const form = page.locator('#contact-form');

    await form.getByRole('button', { name: 'Enviar mensagem' }).click();
    expect(await page.evaluate(() => window.__opened.length), 'native validation must block').toBe(0);

    await form.getByLabel('Nome completo').fill('Maria Silva');
    await form.getByLabel('E-mail').fill('maria@exemplo.com');
    await form.getByLabel('Mensagem').fill('Quero simular um imóvel de 250 mil.');
    await form.getByLabel(/Política de Privacidade/).check();
    await form.getByRole('button', { name: 'Enviar mensagem' }).click();

    const opened = await page.evaluate(() => window.__opened);
    expect(opened).toHaveLength(1);
    expect(decodeURIComponent(opened[0])).toContain('Maria Silva');
    await expect(page.locator('#form-status a', { hasText: 'Abrir WhatsApp' })).toBeVisible();
  });

  test('form fields carry name and autocomplete attributes', async ({ page }) => {
    await page.goto('/');
    const fields = await page.$$eval(
      '#contact-form input:not([type="checkbox"]):not([name="_gotcha"]), #contact-form textarea',
      (elements) => elements.map((el) => ({ name: el.name, autocomplete: el.getAttribute('autocomplete') })),
    );
    expect(fields.length).toBe(3);
    for (const field of fields) {
      expect(field.name).toBeTruthy();
      expect(field.autocomplete).toBeTruthy();
    }
  });
});

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('hamburger opens a menu with Contato and the CTA; Esc closes it', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Abrir menu' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const menu = page.locator('#menu-principal');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Contato' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Fale Conosco' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('hero video is not attached on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await expect(page.locator('.hero-bg-video source')).toHaveCount(0);
  });
});

test.describe('desktop hero', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('hero video is attached once the page is idle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-bg-video source')).toHaveCount(1, { timeout: 5000 });
  });
});
