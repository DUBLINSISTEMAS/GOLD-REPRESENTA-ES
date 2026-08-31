/**
 * Perguntas frequentes — fonte única para duas saídas:
 *  1. o JSON-LD FAQPage gerado em vite.config.js (buildFaqJsonLd);
 *  2. a seção <details> em index.html (mantida em sincronia pelo teste tests/unit/faq.test.mjs,
 *     que falha se o texto visível divergir do texto daqui).
 * Google exige que o texto do schema seja idêntico ao texto visível na página.
 * Plain ESM: roda em Node (Vite config, testes) e no navegador.
 */
export const faqItems = [
  {
    question: 'Consórcio tem juros?',
    answer:
      'Não. No consórcio você não paga juros como em um financiamento — o que existe é a taxa de administração cobrada pela administradora do grupo, diluída nas parcelas. Por isso o consórcio costuma ter parcelas mais baixas do que um financiamento equivalente.',
  },
  {
    question: 'Como funciona a contemplação no consórcio?',
    answer:
      'A contemplação acontece por sorteio — todo participante concorre a cada assembleia — ou por lance, quando você oferece parte do valor da carta de crédito para antecipar a contemplação. Ao ser contemplado, você recebe a carta de crédito para comprar o bem do seu plano à vista.',
  },
  {
    question: 'Consórcio vale a pena?',
    answer:
      'Para quem pode planejar a compra sem pressa e quer fugir dos juros de um financiamento, o consórcio costuma valer a pena — principalmente para imóveis, veículos e formação de patrimônio de médio e longo prazo. A Gold ajuda você a simular o plano ideal para o seu objetivo antes de decidir.',
  },
  {
    question: 'Qual a diferença entre consórcio e financiamento?',
    answer:
      'No financiamento, o banco empresta o dinheiro e cobra juros sobre ele. No consórcio, um grupo de pessoas forma um fundo comum que gera as cartas de crédito, contempladas por sorteio ou lance, sem juros — apenas a taxa de administração do grupo.',
  },
  {
    question: 'A Gold Representações trabalha com qual administradora de consórcio?',
    answer:
      'A Gold Representações atua em Pedreiras - MA como parceira da Multimarcas Consórcios, administradora com presença em todo o Brasil e mais de 200 lojas.',
  },
];
