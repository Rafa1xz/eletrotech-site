# Eletrotech Marechal

Site institucional e catálogo em português e espanhol, com conteúdo gerenciado pelo Sanity.
O frontend usa HTML, CSS e JavaScript nativos. O build gera um site estático em `dist/`;
o Sanity Studio fica separado em `studio/`.

- [Site publicado](https://rafa1xz.github.io/eletrotech-site/)
- [Painel do lojista](https://eletrotech-marechal-painel.sanity.studio/)
- [Como editar o conteúdo](docs/SANITY.md)

## Começar

Requisito: Node.js 24 ou superior.

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:5500. O desenvolvimento usa o conteúdo local preservado e reconstrói
o site quando arquivos de `src/`, `public/` ou `data/` mudam. Recarregue a página para ver o resultado.
No PowerShell, use `npm.cmd` se a política local bloquear `npm.ps1`.

Para buscar o conteúdo atual do Sanity, copie `.env.example` para `.env` e execute:

```sh
npm run build
npm run preview
```

Para desenvolver o painel:

```sh
npm ci --prefix studio
# Copie studio/.env.example para studio/.env.local.
npm run studio
```

O Studio local usa http://localhost:3333. Arquivos `.env` existentes devem ser preservados.

## Estrutura

```text
src/
  pages/       páginas com os campos editáveis do Sanity
  partials/    cabeçalho, rodapé e contato flutuante compartilhados
  styles/      estilos gerais, componentes e páginas
  scripts/     comportamento público do site
  redirects/   compatibilidade com endereços antigos
  templates/   recursos usados pelos geradores
public/        imagens, vídeo, ícones e licenças utilizados
data/          conteúdo local, padrões do CMS e registro de URLs
scripts/       build, sincronização, validação e desenvolvimento
studio/        configuração, schemas e manutenção do Sanity
tests/         testes unitários, de integração e de navegador
docs/          documentação de arquitetura, edição e manutenção
dist/          site gerado; não editar nem versionar
.cache/        downloads e artefatos temporários; não versionar
```

## Comandos principais

| Comando                 | Finalidade                                         |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Desenvolvimento local, com reconstrução automática |
| `npm run build`         | Sincronizar o Sanity e gerar `dist/`               |
| `npm run build:offline` | Gerar o site com o conteúdo local                  |
| `npm run preview`       | Servir a versão já gerada                          |
| `npm test`              | Gerar o site e executar os testes automatizados    |
| `npm run check`         | Validar sintaxe, HTML, estilos, arquivos e âncoras |
| `npm run test:browser`  | Verificar layout e interações em Chromium/Edge     |
| `npm run format`        | Padronizar o código-fonte com Prettier             |
| `npm run format:check`  | Conferir a padronização sem alterar arquivos       |

Os testes de navegador usam Edge no Windows ou `chromium` nos demais sistemas.
Defina `BROWSER_PATH` para escolher outro executável compatível.

## Publicação

O GitHub Actions publica somente `dist/`. Alterações no código são publicadas após os
testes. O workflow também consulta o Sanity aproximadamente a cada cinco minutos;
o GitHub pode atrasar o agendamento. Para antecipar uma atualização, execute
**Publicar site** em Actions.

Detalhes em [Arquitetura](docs/ARCHITECTURE.md), [Sanity](docs/SANITY.md) e
[Revisão e manutenção](docs/REVIEW.md).
