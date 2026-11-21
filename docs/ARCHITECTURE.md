# Arquitetura

## Responsabilidades

O frontend é estático. HTML, CSS e JavaScript públicos ficam em `src/`; o Studio é uma
aplicação separada em `studio/`. Node.js, Cheerio, PostCSS, Acorn e Prettier são ferramentas
de desenvolvimento e geração. Essas dependências não são enviadas ao navegador do visitante.

`src/pages/` contém as seis páginas do CMS. Os comentários `site:header`, `site:footer`
e `site:floating-contact` são resolvidos por `scripts/templates.mjs`, a partir dos
componentes compartilhados em `src/partials/`. Não duplique esses componentes nas páginas.

Os grids de produtos e serviços são preenchidos pelo build; não há cópias estáticas dos
cadastros dentro dos templates. A página antiga `servicos.html` continua redirecionando
para o catálogo e preserva parâmetros e âncoras.

## Fluxo do build

1. `sync-sanity.mjs` lê somente documentos publicados e atualiza os snapshots de `data/`.
2. `build.mjs` limpa e recria `dist/`.
3. `render-content.mjs` aplica o conteúdo às páginas e gera os textos públicos.
4. `build-products.mjs` valida o catálogo, gera os produtos e o sitemap e preserva as URLs.
5. `prepare-site.mjs` agrupa os estilos por página, versiona os scripts e copia apenas os recursos utilizados.

`npm run build:offline` pula a primeira etapa. `npm run dev` usa esse modo e observa
`src/`, `public/` e `data/`. O servidor entrega exclusivamente `dist/`, sem expor o código
do Studio, arquivos de ambiente, exportações ou ferramentas internas.

O build configurado para ler o Sanity falha se a leitura remota falhar. Ele não publica
silenciosamente um catálogo antigo no lugar de uma resposta com erro.

## Dados que devem ser preservados

| Arquivo                                                                   | Responsabilidade                            |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| `products.json`, `pages.json`, `services.json`, `site.json`, `texts.json` | Snapshot do conteúdo para geração local     |
| `cms-defaults.json`, `site-defaults.json`, `text-defaults.json`           | Padrões usados quando campos estão ausentes |
| `page-text-manifest.json`                                                 | Campos e bindings que existem nos templates |
| `product-routes.json`                                                     | Registro permanente de URLs de produtos     |

Esses arquivos têm funções diferentes. Não remova o registro de rotas nem trate os
padrões do CMS como cópias descartáveis dos documentos publicados. Metadados como
revisões e datas internas do Sanity são retirados dos snapshots públicos.

## Mídias e cache

As mídias originais e necessárias ficam em `public/`. A sincronização compara o hash
do arquivo Sanity com os originais locais para evitar cópias idênticas. Uploads novos
ficam em `.cache/media/`; seus URLs públicos continuam sob `images/` ou `videos/`.

Downloads são restritos ao CDN, projeto e dataset configurados. O tamanho é verificado
durante a leitura, e o hash retornado é conferido antes de salvar o arquivo. A pasta de
cache pode ser reconstruída com `npm run build`; um build offline precisa das mídias
referenciadas no snapshot local.

Os estilos usam um bundle de base compartilhado e um complemento por página, mantendo
a ordem original da cascata. Assim, a base pode ser reutilizada pelo cache ao navegar.
Os imports CSS locais são incorporados aos bundles. Seus nomes usam o hash do conteúdo
completo, incluindo os imports, para evitar misturar estilos de publicações diferentes.
Os scripts públicos também recebem uma revisão no endereço.

## Validação e publicação

Os testes verificam escaping, traduções, uploads, edição do menu, seções, estabilidade
das rotas, desativação de produtos, determinismo do build e isolamento dos arquivos públicos.
Os testes de navegador cobrem menu, busca, galerias, contato, idiomas e diferentes larguras.

O workflow sincroniza o conteúdo antes de comparar o site publicado. Quando há mudanças,
gera o site, executa os testes e valida o código e os arquivos locais. Somente o artefato
`dist/` é enviado ao GitHub Pages. Falhas nessas etapas preservam a publicação anterior.
