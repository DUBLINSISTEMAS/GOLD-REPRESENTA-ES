# Gold Representações — site

Landing page de uma página (Vite, HTML/CSS/JS sem framework) para a Gold Representações: carta de crédito por consórcio para imóveis, veículos e investimentos.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera `dist/` (é isso que vai para o ar) |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run images` | Regenera `public/img/` a partir de `assets-src/originals/` |
| `npm run video` | Regenera `public/hero-video.mp4` (faststart, sem áudio) a partir do original |
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

1. `whatsappNumber` — **preenchido** com o número real (`5586998152406`). Todos os CTAs (hero, botão flutuante, chatbot, formulário, rodapé) usam esse valor.
2. `formEndpoint` — vazio **de propósito**: o formulário envia direto para o WhatsApp (nome + modalidade + mensagem opcional). Se um dia a Gold quiser receber por e-mail, configure um endpoint (ex.: Formspree) — o envio passa a ser POST/JSON.
3. `email` — vazio porque ainda não existe e-mail comercial. Quando existir: preencha em `src/lib/config.js` (o JSON-LD passa a incluí-lo sozinho) e recoloque os links de e-mail na seção de contato e no rodapé de `index.html`.
4. `siteUrl` — usado em canonical, Open Graph e sitemap. Confirme o domínio final.
5. `administradora` — já preenchido com "Multimarcas Consórcios" (parceira citada na seção Sobre); a nota aparece na seção de contemplados. Confirme a **autorização de uso de imagem** das pessoas fotografadas.
6. `addressLine` — rua e número para o mapa, o rodapé e o JSON-LD.
7. Revisar `privacidade.html` com o responsável jurídico.

## Deploy

Qualquer hospedagem estática serve: rode `npm run build` e publique a pasta `dist/` (Netlify, Vercel, Cloudflare Pages, cPanel…). O `dist/` não vai para o git — gere sempre a partir do código atual.

**Vercel (host escolhido):** basta importar o repositório — o preset "Vite" detecta `vite build` e `dist/` sozinho. Os cabeçalhos de segurança e o cache vêm do `vercel.json` na raiz (a Vercel ignora o `dist/_headers`). Se `buildCsp()` mudar (ex.: novo `formEndpoint`), o build avisa que o `vercel.json` precisa ser atualizado junto.

## Cabeçalhos de segurança

O build gera `dist/_headers` (formato Netlify / Cloudflare Pages) com CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e HSTS, e injeta a mesma CSP como `<meta http-equiv>` nas páginas (fallback para hosts que ignoram o arquivo — a meta não cobre `frame-ancestors`).

- **Vercel:** nada a fazer — o `vercel.json` na raiz já traz os mesmos cabeçalhos (+ `Cache-Control` para assets) e o build acusa se a CSP dos dois sair de sincronia.
- **Netlify / Cloudflare Pages:** nada a fazer (usam o `dist/_headers`).
- **Apache/cPanel:** copie para `.htaccess` com `Header set ...`.
- **Nginx:** `add_header ...` no server block.

A CSP libera só o que o site usa: o iframe do Google Maps, o `wa.me` (destino do formulário) e o endpoint do formulário (`formEndpoint`, ou `formspree.io` por padrão). As fontes são **self-hosted** (`public/fonts/`, subset latin) — nenhum request ao Google no carregamento. O único script inline (detecção de JS) entra pelo hash SHA-256. Se adicionar um script/estilo externo, atualize `buildCsp()` em `vite.config.js` — o teste e2e "sem erros de console" acusa violações.

## Decisões técnicas

- Vídeo do hero (1,46 MB) só é anexado em telas ≥ 768 px, sem `prefers-reduced-motion`/`Save-Data`, e depois de a página ficar ociosa. Celular vê o poster (64 KB).
- O MP4 **precisa** ser gerado por `npm run video`: o original tinha o índice (`moov`) no fim do arquivo, o que fazia o vídeo começar tarde ou não começar. O script move o índice para o início (`+faststart`) e descarta o áudio (a tag é muda). Um teste unitário falha se o arquivo publicado perder o faststart.
- `hero-video.js` não confia numa única chamada de `play()`: repete a tentativa em `canplay`, ao voltar para a aba e no primeiro gesto do visitante (autoplay bloqueado). Enquanto não tocar, o poster continua visível.
- Sem mapa incorporado: a localização é um botão que abre o Perfil da Empresa no Google. Isso tira ~600 KB e o último iframe de terceiros da página — a CSP pôde fechar em `frame-src 'none'`. O mesmo link entra no JSON-LD (`hasMap` e `sameAs`) para o Google casar o site com a ficha do negócio.
- O link do perfil é derivado do `googlePlaceId` (formato oficial de Maps URLs, permanente). Links `share.google` **não** servem: expiram e às vezes nem abrem. Do mesmo Place ID sai `googleReviewUrl`, o formulário para pedir avaliação a clientes reais.
- Sem JavaScript o conteúdo fica todo visível: o reveal só esconde elementos quando `<html class="js">`.
- Nenhum `window.open` fora de um clique do usuário — a entrega para o WhatsApp é sempre um link/botão.
- Formulário com três camadas: com `formEndpoint`, POST JSON (timeout de 10 s); sem ele, abre o WhatsApp com a mensagem formatada (nome, modalidade, mensagem opcional); sem JavaScript, o `action` nativo faz GET para o `wa.me` (abre o chat, sem os campos) e um `<noscript>` explica.
- Assistente virtual é um `role="dialog"` com `aria-modal`, foco preso enquanto aberto e fechamento por Esc.
