# CMS: análise e proposta de integração

Status: o proprietário escolheu manter o site no GitHub Pages, com backend
separado, e depois determinou desenvolver o backend em uma próxima etapa.
A interface de preparação foi criada em `admin/`. Não há autenticação, API,
banco ou publicação de edições. Consulte `admin/README.md` para o escopo atual.

## Estrutura existente confirmada

- Seis páginas HTML: início, serviços, produtos, processo, OxiLife Fish e contato.
- CSS compartilhado em `css/styles.css`; comportamento em `js/script.js`;
  tradução português/espanhol em `js/i18n.js` e atributos `data-pt`/`data-es`.
- Imagens locais, ícones SVG e vídeo com alternativa estática no celular.
- Seis cards de catálogo em `produtos.html`, distribuídos em quatro categorias.
- Busca e filtros montam um índice dos cards ao iniciar `initCatalog()`.
- WhatsApp centralizado parcialmente em `PHONE`, mas também duplicado nos HTML.
- Formulário prepara mensagem para WhatsApp; não registra pedidos ou vendas.
- Não há banco, API, autenticação, migrations ou dependências de backend.
- Hospedagem atual no GitHub Pages; esse serviço serve arquivos estáticos.
- Há verificações PowerShell de HTML, links e navegação em Edge.

## Decisão de hospedagem

Alternativa A: servir site, API e painel na mesma origem em uma hospedagem com
backend e armazenamento persistente. Simplifica cookies de sessão, publicação
de conteúdo, uploads e renderização de SEO. Preservar URLs e layout atuais.

Alternativa B: manter o site público no Pages e hospedar painel/API/banco à parte.
Exige configurar a URL pública da API, integração entre origens, estratégia de
SEO e atualização dos arquivos estáticos. Credenciais administrativas nunca
podem entrar no JavaScript público ou no repositório.

Alternativa B escolhida. Não há provedor, orçamento ou infraestrutura de backend definidos. Não contratar
serviços nem migrar o endereço público antes dessa definição.

## Modelo de dados proposto

- Usuários, papéis, sessões e histórico de alterações.
- Produtos, categorias, traduções, variações e galeria ordenada.
- Preços em centavos; SKU único quando informado; estoque opcional, com limite
  de alerta configurável. Ausência de preço/estoque não significa valor zero.
- Banners com posição, imagens desktop/mobile, textos traduzidos, destino,
  ordenação e estado de publicação.
- Páginas e seções com identificadores estáveis e tipos de conteúdo permitidos.
- Blocos de texto formatado com marcação restrita e sanitização no servidor.
- Configurações centrais de identidade, contato, redes sociais e SEO.
- Mídias com metadados, caminhos controlados e referências de utilização.
- Revisões e versões para prévia e prevenção de sobrescritas concorrentes.

Importar os textos e imagens existentes de forma idempotente. Não inventar
preços, quantidades, vendas ou histórico. Os cards atuais podem representar
linhas de produtos, não necessariamente SKUs individuais.

## Pontos de integração

1. Renderizar conteúdo antes de iniciar filtros e tradução; o índice atual do
   catálogo não reconhece cards inseridos depois da inicialização.
2. Preservar português/espanhol em conteúdo e metadados. O tradutor atual usa
   `textContent`; textos formatados precisam de tratamento compatível.
3. Aplicar contato central ao formulário, links estáticos e dinâmicos, rodapé,
   cabeçalho, botão flutuante e dados estruturados.
4. Substituir apenas conteúdo das seções existentes, preservando suas classes,
   proporções, comportamento responsivo e navegação.
5. Manter edições em prévia separadas da versão pública até a publicação.
6. Não apresentar indicadores de pedidos/vendas: o site não registra esses dados.

## Segurança e validação previstas

Usar mecanismos mantidos de autenticação do backend escolhido, hash de senha,
sessões revogáveis com cookies protegidos, CSRF, limitação de login e autorização
por operação no servidor. Editor não deve gerenciar usuários ou permissões.
Primeiro administrador criado por comando seguro, sem senha padrão publicada.

Validar entradas e URLs, sanitizar conteúdo formatado, usar consultas
parametrizadas e transações. Uploads precisam de limites de tamanho/dimensões,
verificação real do formato, nomes gerados no servidor e armazenamento sem
execução. Impedir remoção de mídia referenciada. Banco, backups e segredos
ficam fora da raiz pública e do Git.

## Critérios de entrega

Testar login/logout, expiração, papéis, acessos não autenticados, CSRF, entradas
maliciosas, CRUD, uploads inválidos e exclusão de mídia em uso. Verificar
persistência após reinício, publicação e prévia, edições concorrentes, tradução,
WhatsApp, busca, responsividade e preservação das seis páginas.

Entregar migrations, importação inicial, instruções de instalação, criação do
administrador, backup/restauração e configuração de produção. Distinguir testes
locais de validações executadas na hospedagem. Esta proposta não representa um
painel implementado nem uma auditoria de segurança concluída.
