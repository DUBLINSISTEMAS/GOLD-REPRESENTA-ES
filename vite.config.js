import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { siteConfig, validateConfig } from './src/lib/config.js';
import { faqItems } from './src/lib/faq.js';

const TOKEN = /\{\{\s*(\w+)\s*\}\}/g;
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

/** The only inline script: marks the document as JS-enabled before first paint (reveal animations). */
const JS_CLASS_SNIPPET = "document.documentElement.classList.add('js');";
const snippetHash = `'sha256-${createHash('sha256').update(JS_CLASS_SNIPPET).digest('base64')}'`;

const DEFAULT_FORM_ORIGIN = 'https://formspree.io';

/** Content Security Policy shared by the response header (_headers) and the <meta> fallback. */
function buildCsp(config, { forHeader }) {
  const formOrigin = config.formEndpoint ? new URL(config.formEndpoint).origin : DEFAULT_FORM_ORIGIN;
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `script-src 'self' ${snippetHash}`,
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self' data:",
    "media-src 'self'",
    "frame-src 'none'",
    `connect-src 'self' ${formOrigin}`,
    // wa.me: destino do action nativo do formulário quando não há formEndpoint (fallback sem JS).
    `form-action 'self' https://wa.me ${formOrigin}`,
    'upgrade-insecure-requests',
  ];
  if (forHeader) directives.push("frame-ancestors 'none'"); // not allowed in <meta>
  return directives.join('; ');
}

/** Structured data built from the config object — never string-templated into HTML. */
function buildJsonLd(config) {
  const address = {
    '@type': 'PostalAddress',
    ...(config.addressLine && { streetAddress: config.addressLine }),
    addressLocality: config.city,
    addressRegion: config.state,
    addressCountry: 'BR',
  };
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: config.siteName,
    url: `${config.siteUrl}/`,
    logo: `${config.siteUrl}/img/logo-360.webp`,
    image: `${config.siteUrl}/og-image.jpg`,
    description: 'Consórcio para imóveis, veículos, investimentos e alavancagem patrimonial. Sem juros, apenas taxa de administração.',
    telephone: config.phoneE164,
    ...(config.email && { email: config.email }),
    address,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: config.latitude,
      longitude: config.longitude,
    },
    areaServed: `${config.city} - ${config.state}`,
    // hasMap + sameAs apontando para o Perfil da Empresa ajudam o Google a casar
    // o site com a ficha do negócio (Local Pack).
    hasMap: config.googleProfileUrl,
    sameAs: [config.instagramUrl, config.googleProfileUrl],
  };
  // "<" escaped so a value can never close the <script> element.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** FAQPage schema from the same data as the visible <details> section (see src/lib/faq.js). */
function buildFaqJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Vercel ignores the _headers file (Netlify/Cloudflare format) and reads a static
 * vercel.json from the repo root instead. That file can't be generated at build time,
 * so this warns whenever its CSP drifts from the one buildCsp() produces.
 */
function checkVercelCspDrift(expectedCsp) {
  let raw;
  try {
    raw = readFileSync(new URL('./vercel.json', import.meta.url), 'utf8');
  } catch {
    return 'vercel.json não encontrado — na Vercel o site subiria sem cabeçalhos de segurança (o _headers é ignorado lá).';
  }
  try {
    const headers = (JSON.parse(raw).headers ?? []).flatMap((rule) => rule.headers ?? []);
    const csp = headers.find((h) => h.key?.toLowerCase() === 'content-security-policy')?.value;
    if (csp !== expectedCsp) {
      return 'a Content-Security-Policy em vercel.json difere da gerada por buildCsp() — copie o valor novo para vercel.json.';
    }
  } catch {
    return 'vercel.json existe mas não é JSON válido.';
  }
  return '';
}

const CHARSET_BYTE_LIMIT = 1024; // browsers only honor <meta charset> within the first 1024 bytes
const PREPEND_MARKUP_OVERHEAD = 200; // tag markup around the CSP value and the inline script

/** Prepending the CSP/script must not push <meta charset> past the 1024-byte window. */
function assertCharsetStaysEarly(html, metaCsp) {
  const charsetOffset = html.indexOf('charset');
  const prependedBytes = Buffer.byteLength(metaCsp) + JS_CLASS_SNIPPET.length + PREPEND_MARKUP_OVERHEAD;
  if (charsetOffset < 0 || charsetOffset + prependedBytes > CHARSET_BYTE_LIMIT) {
    throw new Error('[site-config] <meta charset> ficaria além dos primeiros 1024 bytes — encurte a CSP.');
  }
}

/** Files derived from siteConfig: served in dev and emitted into dist on build. */
function generatedFiles(config) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    'robots.txt': {
      type: 'text/plain',
      source: `User-agent: *\nAllow: /\nSitemap: ${config.siteUrl}/sitemap.xml\n`,
    },
    'sitemap.xml': {
      type: 'application/xml',
      source:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        `  <url><loc>${config.siteUrl}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n` +
        '</urlset>\n',
    },
    'site.webmanifest': {
      type: 'application/manifest+json',
      source: JSON.stringify(
        {
          name: config.siteName,
          short_name: 'Gold',
          start_url: '/',
          display: 'browser',
          background_color: '#0A192F',
          theme_color: '#0A192F',
          icons: [
            { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        null,
        2,
      ),
    },
    'llms.txt': {
      type: 'text/plain',
      source:
        `# ${config.siteName}\n\n` +
        `> Consórcio para imóveis, veículos, investimentos e alavancagem patrimonial em ${config.city} - ${config.state}. Sem juros, apenas taxa de administração.\n\n` +
        `- [Página inicial](${config.siteUrl}/): soluções, clientes contemplados e contato\n` +
        `- [Política de Privacidade](${config.siteUrl}/privacidade.html)\n` +
        `- [Instagram](${config.instagramUrl})\n`,
    },
    // Netlify / Cloudflare Pages format. Other hosts: see README ("Cabeçalhos de segurança").
    '_headers': {
      type: 'text/plain',
      source:
        '/*\n' +
        `  Content-Security-Policy: ${buildCsp(config, { forHeader: true })}\n` +
        '  X-Content-Type-Options: nosniff\n' +
        '  X-Frame-Options: DENY\n' +
        '  Referrer-Policy: strict-origin-when-cross-origin\n' +
        '  Permissions-Policy: camera=(), microphone=(), geolocation=()\n' +
        '  Strict-Transport-Security: max-age=31536000; includeSubDomains\n',
    },
  };
}

/**
 * - Replaces {{key}} tokens in the HTML entries with siteConfig values, so phone,
 *   e-mail and URLs live in one place and the page works without JavaScript.
 * - Injects the JS-detection snippet, the JSON-LD (index only) and, on build,
 *   a <meta> CSP fallback for hosts that ignore the _headers file.
 * - Generates robots.txt, sitemap.xml, site.webmanifest and _headers from the same config.
 * - Warns at startup about values that still need attention before going live.
 */
function siteConfigPlugin() {
  const files = generatedFiles(siteConfig);
  const jsonLd = buildJsonLd(siteConfig);
  const faqJsonLd = buildFaqJsonLd();
  const metaCsp = buildCsp(siteConfig, { forHeader: false });

  return {
    name: 'gold:site-config',

    configResolved() {
      for (const warning of validateConfig(siteConfig)) {
        console.warn(`\n[site-config] AVISO: ${warning}`);
      }
      const drift = checkVercelCspDrift(buildCsp(siteConfig, { forHeader: true }));
      if (drift) console.warn(`\n[site-config] AVISO: ${drift}`);
    },

    transformIndexHtml(html, ctx) {
      const isDev = Boolean(ctx.server);
      const isIndex = ctx.filename.replace(/\\/g, '/').endsWith('/index.html');

      const replaced = html.replace(TOKEN, (_match, key) => {
        if (!(key in siteConfig)) {
          throw new Error(`[site-config] token desconhecido no HTML: {{${key}}}`);
        }
        return escapeHtml(siteConfig[key] ?? '');
      });

      // A <meta> CSP only governs what comes after it, so it must be the first thing in <head>.
      // Dev is skipped on purpose: the CSP would block Vite's HMR websocket.
      const tags = [];
      if (!isDev) {
        tags.push({ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: metaCsp }, injectTo: 'head-prepend' });
      }
      tags.push({ tag: 'script', children: JS_CLASS_SNIPPET, injectTo: 'head-prepend' });
      if (isIndex) {
        if (siteConfig.googleSiteVerification) {
          tags.push({
            tag: 'meta',
            attrs: { name: 'google-site-verification', content: siteConfig.googleSiteVerification },
            injectTo: 'head',
          });
        }
        tags.push({ tag: 'script', attrs: { type: 'application/ld+json' }, children: jsonLd, injectTo: 'head' });
        tags.push({ tag: 'script', attrs: { type: 'application/ld+json' }, children: faqJsonLd, injectTo: 'head' });
      }
      assertCharsetStaysEarly(replaced, metaCsp);
      return { html: replaced, tags };
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = files[req.url?.slice(1)];
        if (!file) return next();
        res.setHeader('Content-Type', file.type);
        res.end(file.source);
      });
    },

    generateBundle() {
      for (const [fileName, file] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName, source: file.source });
      }
    },
  };
}

const page = (name) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

export default defineConfig({
  plugins: [siteConfigPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: page('index'),
        privacidade: page('privacidade'),
      },
    },
  },
});
