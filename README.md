# Gold Representações — site

Landing page de uma página (Vite, HTML/CSS/JS sem framework) para a Gold Representações: carta de crédito por consórcio para imóveis, veículos e investimentos.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera `dist/` (é isso que vai para o ar) |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run images` | Regenera `public/img/` a partir de `assets-src/originals/` |
| `npm run test:unit` | Testes das funções puras (`node --test`) |
| `npm run test:e2e` | Testes de ponta a ponta com Playwright (usa o Chrome instalado) |
| `npm test` | Os dois acima |

## Onde mudar o quê

- **Telefone, e-mail, endereço, Instagram, nome do especialista, administradora:** `src/lib/config.js`. É a única fonte — os valores entram no HTML na build (tokens `{{chave}}`), no chatbot, no formulário, no `robots.txt`, `sitemap.xml` e `site.webmanifest`.
- **Textos da página:** `index.html`. Política de privacidade: `privacidade.html`.
- **Estilos:** `src/styles/*.css` (um arquivo por componente; `src/style.css` só importa).
- **Comportamento:** `src/modules/*.js` (navbar, reveal, vídeo do hero, chatbot, formulário, mapa).
- **Imagens:** coloque o original em `assets-src/originals/` e rode `npm run images`. Nunca edite `public/img/` na mão.

## Pendências antes de publicar

`npm run dev` e `npm run build` avisam no terminal enquanto algo abaixo estiver faltando.

1. `whatsappNumber` em `src/lib/config.js` — hoje é o placeholder `5511999999999`. Todos os CTAs (hero, botão flutuante, chatbot, formulário, rodapé) usam esse valor.
2. `formEndpoint` — sem ele o formulário abre o WhatsApp com a mensagem preenchida (funciona, mas nada chega por e-mail). Com um endpoint (ex.: Formspree, `https://formspree.io/f/xxxx`) o envio passa a ser por POST/JSON.
3. `siteUrl` — usado em canonical, Open Graph e sitemap. Confirme o domínio final.
4. `administradora` — se a Gold representa uma administradora (as fotos da galeria são de contemplados da Multimarcas Consórcios), preencha para exibir a nota na seção de contemplados. Confirme também a **autorização de uso de imagem** das pessoas fotografadas.
5. `addressLine` — rua e número para o mapa, o rodapé e o JSON-LD.
6. Revisar `privacidade.html` com o responsável jurídico.

## Deploy

Qualquer hospedagem estática serve: rode `npm run build` e publique a pasta `dist/` (Netlify, Vercel, Cloudflare Pages, cPanel…). O `dist/` não vai para o git — gere sempre a partir do código atual.

## Cabeçalhos de segurança

O build gera `dist/_headers` (formato Netlify / Cloudflare Pages) com CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e HSTS, e injeta a mesma CSP como `<meta http-equiv>` nas páginas (fallback para hosts que ignoram o arquivo — a meta não cobre `frame-ancestors`).

- **Netlify / Cloudflare Pages:** nada a fazer.
- **Vercel:** copie os valores para `headers` em `vercel.json`.
- **Apache/cPanel:** copie para `.htaccess` com `Header set ...`.
- **Nginx:** `add_header ...` no server block.

A CSP libera só o que o site usa: fontes do Google, o iframe do Google Maps e o endpoint do formulário (`formEndpoint`, ou `formspree.io` por padrão). O único script inline (detecção de JS) entra pelo hash SHA-256. Se adicionar um script/estilo externo, atualize `buildCsp()` em `vite.config.js` — o teste e2e "sem erros de console" acusa violações.

## Decisões técnicas

- Vídeo do hero (4,2 MB) só é anexado em telas ≥ 992 px, sem `prefers-reduced-motion`/`Save-Data`, e depois de a página ficar ociosa. Celular vê o poster (64 KB).
- Mapa do Google só carrega depois de um clique (privacidade + ~600 KB a menos).
- Sem JavaScript o conteúdo fica todo visível: o reveal só esconde elementos quando `<html class="js">`.
- Nenhum `window.open` fora de um clique do usuário — a entrega para o WhatsApp é sempre um link/botão.
- Formulário com três camadas: com `formEndpoint`, POST JSON (timeout de 10 s); sem ele, abre o WhatsApp com a mensagem; sem JavaScript, o `action` nativo é `mailto:` (ou o endpoint, se configurado) e um `<noscript>` explica.
- Assistente virtual é um `role="dialog"` com `aria-modal`, foco preso enquanto aberto e fechamento por Esc.
