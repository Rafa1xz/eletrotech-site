# Reformulação industrial — entrega de frontend

## Escopo realizado

Preservadas as seis páginas originais, busca, filtros, idiomas, navegação mobile,
formulário de orçamento e WhatsApp. A skill `frontend-faculdade` orientou a
preservação de HTML/CSS/JS nativos, foco por teclado, movimento reduzido e testes
responsivos. A geração estática foi acrescentada para atender ao requisito
expresso de páginas individuais no GitHub Pages; não há framework ou dependências.

O tema compartilhado `css/industrial.css` usa azul-petróleo, azul industrial,
superfícies claras e ciano. Reutiliza os componentes e organiza o hero, serviços,
filtros, catálogo, OxiLife, contato e rodapé. A home evidencia três áreas de
atuação e mantém as fotografias já existentes. As fotos de serviço são
identificadas como equipamentos/materiais relacionados, não como prova de cada
serviço executado. O WhatsApp apresenta sua animação brevemente, sem repetição
contínua, e respeita movimento reduzido.

## Páginas individuais de produtos

Todos os seis produtos publicados têm páginas em `produtos/<slug>.html`.
Imagem, nome, card e botão Ver detalhes levam à página. Cada página contém:

- Nome, categoria e marca quando informada; modelo e SKU quando disponíveis.
- Galeria com miniaturas, ampliação em diálogo, setas e Escape; foco restaurado.
- Descrição e especificações existentes, sem estimar potência ou outros dados.
- Preço/promocional, estoque e variações somente quando presentes no cadastro.
- Sob consulta quando não há preço. Ausência de estoque não significa zero.
- WhatsApp com nome, SKU quando informado, opção selecionada e URL canônica.
- Relacionados da mesma categoria ou sugestões do catálogo quando não há pares.
- Breadcrumbs, título/meta individuais, canonical, Open Graph e JSON-LD.

O conteúdo principal e os links existem no HTML sem JS. A ampliação adiciona
estados de carregamento/erro; sem JS, as imagens abrem pelo link normal.
O SVG do alarme continua claramente identificado como ilustração.

## Fonte única e publicação

`data/products.json` é a fonte para o catálogo, os cards OxiLife, os relacionados,
as páginas individuais. O Sanity pode atualizar essa fonte durante o build. As fotos permanecem em
`images/`. `data/site.json` fornece origem canônica e WhatsApp para os produtos e
gera `js/site-config.js`, usado pelos contatos dinâmicos e formulário do site.

`scripts/build-products.mjs` gera esses artefatos e `portfolio.html` usando o
header/rodapé existentes. `templates/portfolio-main.html` contém o conteúdo do
portfólio. Não editar diretamente os produtos gerados: a próxima publicação os
reconstruirá a partir do JSON.

`data/product-routes.json` registra IDs e slugs já utilizados. Slugs não podem ser
alterados ou reutilizados por outro ID. Produtos desativados ou removidos da fonte
mantêm uma página de indisponibilidade com `noindex`, sem aparecer no catálogo ou
sitemap. Em hospedagem estática essa página tem HTTP 200; não se afirma retorno
410/404 dinâmico. Para novos registros, incluir ID/slug no registro versionado
executando o gerador antes do commit; isso preserva a rota em futuras exclusões.

O workflow `.github/workflows/publish.yml` gera as páginas a cada push para main,
executa testes de publicação e referências locais e publica somente a lista de
arquivos públicos montada por `scripts/prepare-site.mjs`. Fontes de backend,
credenciais e documentação de desenvolvimento não entram no artefato.

## Portfólio e OxiLife

`portfolio.html` reúne quatro registros já presentes no projeto, com galeria
ampliável e links aos serviços/equipamentos. A home e os rodapés dão acesso à
página. Não foram inventados clientes, depoimentos, métricas ou resultados.
A autorização de uso das fotos preexistentes não foi reavaliada nesta etapa.

O fluxo OxiLife apresenta as quatro etapas existentes com conexão visual em
desktop/mobile. Os equipamentos usam os mesmos dados do catálogo e levam às
páginas individuais. Não há painel de sensores nem indicadores simulados.

## Integração de conteúdo

O painel próprio foi removido e substituído pelo Sanity Studio. Consulte
[SANITY.md](SANITY.md) para criação do projeto, importação, configuração e publicação.
A conta foi conectada, o projeto `zr5fcto8` foi criado e os seis produtos foram importados no dataset `production`.

## Validações

- Revisão estática: 13 HTML e referências/âncoras locais.
- Suite existente: 66 verificações de páginas, navegação, formulário, idiomas,
  filtros e sete larguras entre 320 e 1440 px; sem envio de mensagens externas.
- Novas páginas: 35 combinações de página/largura (portfólio + seis produtos em
  cinco larguras), sem overflow; SEO, mensagem de produto e conteúdo sem JS.
- Galeria: navegação por setas, Escape e retorno de foco; orçamento em espanhol.
- Histórico: o antigo painel foi validado em 40 combinações antes de ser removido.
- Publicação: geração determinística; novo produto; edição; preço/variação/SKU;
  texto com HTML escapado; desativação; remoção com URL preservada; bloqueio de
  alteração de slug. Dados artificiais usados somente em cópia temporária do teste.
- Capturas de home, produto e mobile inspecionadas.

Esses testes usam Edge headless e não substituem testes em celulares físicos,
leitor de tela, auditoria completa de contraste ou indexação real no buscador.
A leitura real do Sanity e o build foram validados após conectar a conta; novos uploads e publicação remota ainda não foram exercitados.

Comandos: `node --test qa/scripts/test-publication.mjs`,
`node qa/scripts/review-redesign.mjs`,
`powershell -File qa/scripts/static-review.ps1`.
