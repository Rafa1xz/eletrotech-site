# Eletrotech Marechal

Site institucional em HTML, CSS e JavaScript, com Sanity Studio separado. O painel antigo em `admin/` foi removido.

O site público continua abrindo por `index.html`. Para desenvolvimento, use Node.js 24 ou superior:

```powershell
npm install --prefix studio
npm run dev
```

Site: http://127.0.0.1:5500. Studio online: https://eletrotech-marechal.sanity.studio/. Para desenvolver o Studio localmente, use `npm run studio` (porta 3333).

## Sanity

O Studio em `studio/` gerencia produtos, traduções, imagens, preços, estoque, especificações, SEO e as configurações usadas pelo gerador. Está conectado ao projeto `zr5fcto8`, dataset público `production`, com os seis produtos e as configurações importados.

Consulte [docs/SANITY.md](docs/SANITY.md) para reconectar em outra máquina e configurar a publicação. Os arquivos locais `.env` e `studio/.env.local` já estão configurados e são ignorados pelo Git.

```powershell
npm run sanity:seed
npm run sanity:sync
npm run studio
```

## Publicação e testes

```powershell
npm run build
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File qa/scripts/static-review.ps1
```

O build busca conteúdo publicado do Sanity, gera catálogo, páginas e sitemap e prepara `_site/`. Sem Project ID configurado, usa os JSON locais preservados. Com projeto configurado, falhas de leitura interrompem a publicação.

O GitHub Pages usa `.github/workflows/publish.yml`. Depois de publicar no Sanity, o workflow verifica mudanças a cada cinco minutos e atualiza os HTML automaticamente. O GitHub pode atrasar o agendamento. Para antecipar, execute `Publicar site` em Actions. Veja limitações e manutenção do agendamento em [docs/SANITY.md](docs/SANITY.md).

Os IDs e slugs existentes são preservados por `data/product-routes.json`. Prefira desativar produtos com `active: false`. Preço e estoque desconhecidos são `null`, não zero. Fotos enviadas ao Sanity são copiadas para `images/` no build.

## Estrutura

- `*.html`, `css/`, `js/`: site público.
- `produtos/`: páginas geradas com URLs estáveis.
- `data/`: catálogo, configurações e registro de rotas.
- `studio/`: Sanity Studio e schemas.
- `scripts/`: sincronização, exportação, geração e servidor local.
- `images/`, `assets/`, `videos/`: mídias.
- `qa/`: verificações e capturas.
- `docs/`: documentação.

O pacote público não inclui Studio, dependências, credenciais ou o painel removido.
