# Integração com o backend da equipe

O backend está sob responsabilidade de outro integrante do grupo. Este documento
é uma proposta para alinhar a integração, não uma API já implementada. A tecnologia,
as rotas e a autenticação efetivas devem ser confirmadas com esse integrante.

## Estado atual

- Site público: seis páginas estáticas no GitHub Pages.
- Painel: `admin/index.html`, `admin/admin.js` e `admin/admin.css`.
- O painel importa conteúdo dos HTML por `loadSite()`.
- O envio dos formulários apenas atualiza `state` na memória da aba.
- `localImage()` gera URLs temporárias; não faz upload.
- O JSON exportado é um rascunho, não uma gravação no banco.
- Não existe login nem serviço de backend conectado.

## Informações necessárias do responsável pelo backend

1. URL local e, quando disponível, URL HTTPS da API publicada.
2. Documentação das rotas (OpenAPI/Swagger ou exemplos de requisição/resposta).
3. Fluxo de login/logout, sessão, permissões e proteção CSRF aplicável.
4. Nomes, tipos e IDs dos campos de cada recurso.
5. Rotas de upload e formato das URLs públicas das imagens.
6. Como criar o primeiro administrador; não compartilhar senhas no Git.
7. Regra de publicação: salvar publica imediatamente ou mantém rascunho?
8. Origens permitidas para desenvolvimento e para o GitHub Pages.

## Operações que o painel precisa

| Recurso | Operações |
| --- | --- |
| Sessão | Entrar, consultar usuário/permissões, sair |
| Produtos | Listar/buscar/filtrar, criar, editar, desativar, excluir |
| Banners | Listar, criar, editar, ordenar, ativar/desativar, excluir |
| Textos | Listar por página, editar português e espanhol |
| Seções | Listar por página, editar título, ordem e visibilidade |
| Configurações | Consultar e atualizar identidade, contato e SEO |
| Mídias | Listar, enviar imagem, consultar referências, substituir/excluir |
| Histórico | Consultar alterações reais e responsável/data |
| Acessos | Gerenciar usuários e papéis, restrito ao administrador |
| Conteúdo público | Consultar apenas conteúdo publicado, sem dados privados |

Não se pressupõe um prefixo como `/api` nem um método de autenticação antes de
conhecer o contrato real. O frontend será adaptado às rotas aprovadas pela equipe.

## Dados já usados pelos formulários

Produtos: `id`, `name`, `nameEs`, `description`, `descriptionEs`, `category`,
`src`, `gallery`, `sku`, `price`, `salePrice`, `stock`, `lowStock`, `variations`,
`details`, `featured`, `active`, `order`, `seoTitle`, `seoDescription`.

Banners: `id`, `name`, `title`, `subtitle`, `button`, `link`, `src`, `mobileSrc`,
`active`, `order`.

Textos: `id`, `page`, `pageName`, `element`, `pt`, `es`.

Seções: `id`, `page`, `pageName`, `name`, `active`, `order`.

Configurações: `name`, `phone`, `whatsapp`, `message`, `email`, `address`, `hours`,
`instagram`, `facebook`, `tiktok`, `youtube`, `logo`, `favicon`, `description`,
`seoTitle`, `seoDescription`.

Esses são campos atuais da interface, não uma exigência para as tabelas do banco.
O adaptador pode mapear nomes e formatos diferentes. Na API, preferir valores
monetários em centavos ou decimais exatos, ausências como `null`, galerias e
variações estruturadas. O frontend atual usa strings em alguns desses campos.

Os IDs por posição extraídos do HTML são temporários. A importação precisa de
IDs estáveis e preservar os registros já existentes. Não inventar estoque ou
preço para os seis cards atuais, que incluem linhas de equipamentos.

## Pontos de alteração no frontend

- `loadSite()`: substituir leitura dos HTML por consultas reais à API.
- Formulários: aguardar confirmação do servidor antes de indicar salvamento.
- Manter valores digitados quando houver erro; exibir erros de validação.
- `localImage()`: preservar prévia e acrescentar upload autenticado real.
- `access()`: conectar login, logout e permissões fornecidos pelo servidor.
- Dashboard: usar contagens e histórico reais; não simular vendas.
- `js/script.js`: aplicar produtos antes da inicialização de `initCatalog()`.
- `js/i18n.js`: integrar conteúdo atualizado aos dois idiomas.
- WhatsApp: atualizar links estáticos, links gerados e formulário de orçamento.
- Site público: preservar o conteúdo estático se a API estiver indisponível.

## Hospedagem e proteção

O GitHub Pages continua hospedando arquivos estáticos. O backend precisa de
hospedagem própria com banco e mídia persistentes. Definir se o painel será
servido pelo backend, o que facilita cookies de sessão na mesma origem.

Se a API administrativa for acessada de outra origem, planejar CORS, cookies e
CSRF em conjunto. Não resolver erros de CORS liberando indiscriminadamente
operações administrativas. Não colocar credenciais ou segredos nos scripts.
Permissões, validação de upload e validação dos dados são obrigatórias no servidor;
esconder botões na interface não protege endpoints.

## Validação da integração

Testar login/logout e expiração, acessos sem permissão, CRUD e persistência após
recarregar, validações e erros, upload inválido, edição simultânea, mudanças de
WhatsApp, publicação em português/espanhol e funcionamento quando a API cai.
Confirmar a atualização no site publicado, não apenas no painel.

Nenhuma dessas operações de backend foi implementada ou validada nesta etapa.

## Atualização após a reformulação visual

Os produtos agora vêm de `data/products.json`, com IDs estáveis e campos
`slug`, `brand`, `model`, `gallery`, `specifications` e traduções. O painel já
lê esse arquivo em vez de extrair produtos do HTML. Os demais conteúdos ainda
são lidos das páginas. Os preços são números em reais (ou `null`), e galerias,
variações e especificações são listas no contrato de publicação atual.

O backend pode usar outra representação interna, como centavos, mas deve
normalizar os dados ao exportar esse contrato. `scripts/build-products.mjs`
reconstrói o catálogo, OxiLife e páginas individuais. O workflow de Pages executa
esse gerador antes do deploy. O servidor deverá salvar/autenticar e disparar a
publicação; nunca expor token de GitHub no browser. Detalhes em `docs/REDESIGN.md`.
