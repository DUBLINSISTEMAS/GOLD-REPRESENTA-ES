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

  test('reveal animates on scroll and releases its classes when done', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.service-card').first();
    await expect(card).toHaveClass(/reveal/); // abaixo da dobra: ainda escondido
    await card.scrollIntoViewIfNeeded();
    // Ao fim da transição as classes de reveal são removidas — o elemento
    // volta às próprias transições (hover ágil) e o estado final é o padrão.
    await expect(card).not.toHaveClass(/reveal/, { timeout: 5000 });
    await expect(card).toBeVisible();
  });

  test('location is a link to the Google profile, with no third-party frame', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('iframe')).toHaveCount(0); // nenhum embed de terceiros
    const link = page.getByRole('link', { name: /Ver no Google Maps/ });
    // Formato oficial de Maps URLs com o Place ID: link permanente para a ficha.
    await expect(link).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&.*query_place_id=ChIJ/);
    await expect(link).toHaveAttribute('target', '_blank');

    const review = page.getByRole('link', { name: /Deixe sua avaliação/ });
    await expect(review).toHaveAttribute('href', /^https:\/\/search\.google\.com\/local\/writereview\?placeid=ChIJ/);
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

  test('chatbot offers the credit modalities and accepts a typed amount', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir assistente virtual' }).click();
    for (const option of ['Comprar imóvel', 'Comprar veículo', 'Investir', 'Crédito rural', 'Outro objetivo']) {
      await expect(page.getByRole('button', { name: option })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Crédito rural' }).click();
    const input = page.getByLabel('Sua resposta');
    await expect(input).toBeEnabled();
    await input.fill('80 mil');
    await input.press('Enter');

    const link = page.locator('a.chat-wa-link');
    await expect(link).toBeVisible();
    const href = decodeURIComponent(await link.getAttribute('href'));
    expect(href).toContain('*Crédito rural*');
    expect(href).toContain('*80 mil*');
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
    await form.getByLabel('Modalidade de crédito').selectOption('Imóvel');
    await form.getByLabel(/Mensagem/).fill('Quero simular um imóvel de 250 mil.');
    await form.getByLabel(/Política de Privacidade/).check();
    await form.getByRole('button', { name: 'Enviar mensagem' }).click();

    const opened = await page.evaluate(() => window.__opened);
    expect(opened).toHaveLength(1);
    expect(decodeURIComponent(opened[0])).toContain('Maria Silva');
    expect(decodeURIComponent(opened[0])).toContain('*Interesse:* Imóvel');
    await expect(page.locator('#form-status a', { hasText: 'Abrir WhatsApp' })).toBeVisible();
  });

  test('contact form POSTs JSON to a configured endpoint and reports success and failure', async ({ page }) => {
    const ENDPOINT = 'https://formspree.io/f/e2e-test';
    const received = [];
    await page.route(ENDPOINT, (route) => {
      received.push(route.request().postDataJSON());
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/');
    await page.evaluate((endpoint) => {
      document.getElementById('contact-form').dataset.endpoint = endpoint;
    }, ENDPOINT);

    const form = page.locator('#contact-form');
    const fill = async () => {
      await form.getByLabel('Nome completo').fill('João Souza');
      await form.getByLabel('Modalidade de crédito').selectOption('Veículo');
      await form.getByLabel(/Mensagem/).fill('Quero um carro de 80 mil.');
      await form.getByLabel(/Política de Privacidade/).check();
    };

    await fill();
    await form.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.locator('#form-status')).toHaveText(/Mensagem enviada/);
    await expect(form.getByLabel('Nome completo')).toHaveValue(''); // reset after success
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ name: 'João Souza', interesse: 'Veículo', consent: 'sim' });

    // Endpoint failure: visitor gets an error, button is usable again.
    await page.route(ENDPOINT, (route) => route.fulfill({ status: 500, body: 'nope' }));
    await fill();
    await form.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.locator('#form-status')).toHaveText(/Não foi possível enviar/);
    await expect(form.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled();
  });

  test('degrades without JavaScript: content visible, form falls back to WhatsApp', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseURL}/`);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#sobre h2')).toBeVisible(); // reveal must not hide content
    await expect(page.locator('#contact-form')).toHaveAttribute('action', /^https:\/\/wa\.me\/\d+$/);
    await expect(page.locator('#contact-form')).toHaveAttribute('method', /get/i);
    await expect(page.getByText(/sem JavaScript/)).toBeVisible();

    await context.close();
  });

  test('form fields carry name and autocomplete attributes', async ({ page }) => {
    await page.goto('/');
    const fields = await page.$$eval(
      '#contact-form input:not([type="checkbox"]):not([name="_gotcha"]), #contact-form select, #contact-form textarea',
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

});

test.describe('hero video', () => {
  test('is attached and plays on every screen size, phones included', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-bg-video source')).toHaveCount(1, { timeout: 5000 });
    await expect
      .poll(() => page.evaluate(() => document.querySelector('.hero-bg-video').currentTime), { timeout: 8000 })
      .toBeGreaterThan(0);
  });

  test('the poster is the video first frame, so there is no flash when it starts', async ({ page }) => {
    await page.goto('/');
    const poster = await page.getAttribute('.hero-bg-video', 'poster');
    expect(poster).toMatch(/hero-poster/);
    // O poster é gerado do vídeo por `npm run video`: mesma cena, mesma moldura.
    const [posterSize, videoRatio] = await Promise.all([
      page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        return img.naturalWidth / img.naturalHeight;
      }, poster),
      page.evaluate(async () => {
        const v = document.querySelector('.hero-bg-video');
        if (!v.videoWidth) await new Promise((r) => v.addEventListener('loadeddata', r, { once: true }));
        return v.videoWidth / v.videoHeight;
      }),
    ]);
    expect(Math.abs(posterSize - videoRatio)).toBeLessThan(0.02);
  });

  test('is skipped when the visitor asked to save data', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: true, effectiveType: '4g' },
        configurable: true,
      });
    });
    await page.goto('/');
    await page.waitForTimeout(2500);
    await expect(page.locator('.hero-bg-video source')).toHaveCount(0);
  });
});

test.describe('desktop hero', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('nav link glides to the section and updates the URL hash', async ({ page }) => {
    await page.goto('/');
    await page.locator('#menu-principal').getByRole('link', { name: 'Sobre Nós' }).click();
    await expect(page).toHaveURL(/#sobre$/);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(300); // a rolagem animada (Lenis) chegou na seção
  });
});

test.describe('privacy notice', () => {
  test('shows on first visit, links to the policy and stays dismissed after reload', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('link', { name: /Política de Privacidade/ })).toHaveAttribute('href', '/privacidade.html');
    await banner.getByRole('button', { name: /Entendi/ }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.locator('#cookie-banner')).toBeHidden();
  });

  test('lifts the floating buttons above the bar instead of covering them', async ({ page }) => {
    await page.goto('/');
    const banner = await page.locator('#cookie-banner').boundingBox();
    const whatsapp = await page.locator('a.whatsapp-float').boundingBox();
    const chat = await page.locator('#chatbot-toggle').boundingBox();
    expect(banner).not.toBeNull();
    expect(whatsapp.y + whatsapp.height).toBeLessThanOrEqual(banner.y);
    expect(chat.y + chat.height).toBeLessThanOrEqual(banner.y);
  });
});
