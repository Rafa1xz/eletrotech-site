# Revisão e organização — 21/11/2026

## Resultado

O projeto agora separa código-fonte, arquivos públicos, conteúdo, ferramentas, testes e
saída gerada. O frontend continua em HTML, CSS e JavaScript nativos, com o Studio separado.
As páginas publicadas e os identificadores do Sanity foram preservados.

Medição do estado inicial e da versão reorganizada, sem dependências instaladas,
histórico Git ou caches locais:

| Medida                                |   Antes |  Depois |
| ------------------------------------- | ------: | ------: |
| Arquivos de projeto versionáveis      |     263 |     126 |
| Tamanho desses arquivos               | 78,6 MB | 18,7 MB |
| Arquivos do site distribuído          |     135 |      61 |
| Tamanho do site distribuído           | 48,9 MB | 18,5 MB |
| Folhas de estilo por página principal |     6–8 |       2 |

Os valores em MB usam base decimal. A redução é de aproximadamente 76% no material
versionado e 62% no pacote público. O tamanho de `dist/` pode variar com novos uploads.

## Remoções

- Capturas antigas, relatórios de execução e scripts PowerShell ligados a versões anteriores.
- Migrações já concluídas, incluindo a troca de projeto Sanity e a remoção do formulário.
- Dezoito imagens e vídeos sem referências no código, schemas ou conteúdo de fallback.
- Cópias de mídias baixadas do Sanity que repetiam os originais locais.
- Templates de portfólio e extratores de conteúdo substituídos pelo CMS atual.
- Sessenta e quatro regras CSS de componentes aposentados.
- HTML, sitemap e JavaScript de dados gerados que antes eram versionados junto do código-fonte.

As licenças dos ícones foram preservadas. Configurações locais de ambiente e documentos
do projeto ativo no Sanity não foram excluídos.

## Revisão do código

- Cabeçalho, rodapé e contato flutuante passaram a componentes compartilhados.
- Grids de produtos e serviços deixaram de conter cópias estáticas dos cadastros nos templates.
- A montagem do catálogo usa o parser HTML, em vez de depender da formatação e de expressões regulares sobre os cartões.
- O build reconstrói a saída do zero e publica apenas recursos utilizados e arquivos explicitamente permitidos.
- O CSS mantém uma base compartilhada em cache e um complemento por página; imports entram no cálculo da revisão.
- Downloads de mídia reutilizam os originais pelo hash, têm limite de tamanho e ficam isolados em cache quando novos.
- Metadados internos do Sanity foram retirados dos snapshots públicos.
- Um catálogo de serviços vazio passa a ser respeitado, sem recriar serviços de fallback.
- Testes compartilham os utilitários de navegador e removem seus perfis temporários após a execução.
- Prettier, EditorConfig e Git Attributes padronizam formatação, codificação e finais de linha.

## Dependências

O Sanity foi atualizado dentro da série 6. As dependências transitivas `js-yaml`,
`smol-toml` e `minimatch`, usadas pela CLI, receberam versões corrigidas por overrides
limitados aos seus consumidores. Essas exceções estão em `studio/package.json` e devem
ser reavaliadas quando o fornecedor atualizar as dependências originais.

A auditoria npm terminou sem vulnerabilidades conhecidas na raiz e no Studio. Isso
representa o resultado do banco de avisos consultado nessa revisão; não substitui
atualizações e verificações futuras.

## Validação

- Build conectado ao Sanity e build offline.
- Dezoito testes automatizados de conteúdo, renderização, publicação, cache e URLs.
- Verificação de sintaxe, imports relativos, HTML, CSS, arquivos e âncoras locais.
- Navegação, menu mobile, hover, contato direto, idiomas, galerias e páginas de produtos em navegador Chromium.
- Comparação de geometria antes/depois na home, catálogo e contato, em 1440 e 390 pixels: nenhuma diferença acima de um pixel nos elementos principais medidos.
- Servidor de preview: entrega das páginas, bloqueio de código-fonte e arquivos de ambiente e recusa de escrita por HTTP.
- Build do Studio e validação dos documentos contra os schemas.

Os testes de navegador usam uma sessão isolada; não dependem da sessão pessoal do Brave
e não enviam mensagens pelo WhatsApp.

## Manutenção

Edite o conteúdo no Sanity e o layout em `src/`. Não edite `dist/`. Use os comandos
documentados no README antes de publicar mudanças no código. Preserve `data/product-routes.json`,
os padrões de conteúdo e as chaves de bindings existentes.
