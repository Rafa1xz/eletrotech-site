# Eletrotech Marechal

Site institucional acadêmico desenvolvido com HTML, CSS e JavaScript puro.

## Como abrir

Abra `index.html` diretamente no navegador. Não é necessário instalar dependências, executar npm ou compilar o projeto.

## Estrutura

- `*.html`: páginas do site.
- `css/`: estilos compartilhados.
- `js/`: comportamento e tradução.
- `assets/`: favicon, ícones e licenças.
- `images/`: fotografias e ilustrações.
- `videos/`: vídeos usados pelo projeto.
- `docs/`: apresentação e histórico de mudanças.
- `qa/scripts/`: verificações automatizadas e scripts de manutenção.
- `qa/screenshots/`: capturas das revisões visuais.
- `qa/results/`: resultados das verificações.
- `dist/`: pacote pronto para entrega.

## Páginas

- `index.html`: início.
- `servicos.html`: serviços.
- `produtos.html`: catálogo e filtros.
- `como-trabalhamos.html`: processo de trabalho.
- `oxilife-fish.html`: soluções para piscicultura.
- `contato.html`: formulário e canais de contato.
- `portfolio.html`: galeria de projetos e equipamentos.
- `produtos/*.html`: páginas individuais, com URL estável, galeria e orçamento.

Mais detalhes estão em `docs/APRESENTACAO.md` e `docs/MUDANCAS.md`.

## Interface administrativa

Abra `admin/index.html` pelo Live Server ou `/admin/` na hospedagem para acessar
a interface de preparação. Ela lê os conteúdos atuais e permite editar prévias
e exportar rascunhos. O backend será desenvolvido depois: ainda não há login,
persistência ou publicação de alterações. Consulte [admin/README.md](admin/README.md).

## Catálogo e publicação automática

Os dados publicados dos produtos ficam em `data/products.json`. O painel lê essa
mesma fonte. As páginas individuais, a listagem e o sitemap são gerados a partir
dela, mantendo o site utilizável sem JavaScript e compatível com GitHub Pages.

Ao enviar alterações para `main`, o workflow `Publicar site` gera, valida e
publica os arquivos. Para gerar localmente, use Node.js 24:

```powershell
node scripts/build-products.mjs
```

Não altere os slugs de produtos existentes: `data/product-routes.json` preserva
as URLs. Desative com `active: false`; a página continua acessível com aviso de
indisponibilidade. Preços e estoque desconhecidos são `null`, não zero.

O site pronto não exige Node para abrir. Para visualizar o painel sem Live Server,
há também um servidor estático local opcional: `node scripts/serve.mjs`.

Escopo, testes e pendências: [docs/REDESIGN.md](docs/REDESIGN.md).
