# Painel de preparação de conteúdo

O backend foi adiado por solicitação do proprietário. Esta entrega é a interface
de preparação do painel, e não um CMS completo em produção.

## Acesso

Com o Live Server aberto na raiz do projeto, visite:
`http://127.0.0.1:5500/admin/index.html`.

No GitHub Pages, a rota é `/eletrotech-site/admin/`. É necessário HTTP/HTTPS:
abrir o HTML diretamente por `file://` não permite importar as páginas por fetch.
Não há instalação, dependências ou build.

## O que funciona nesta etapa

- Leitura das seis páginas públicas, sem modificar nenhum arquivo delas.
- Dashboard com contagens e distribuição dos produtos reais por categoria.
- Catálogo com pesquisa, filtro, formulário de produto e prévia de edição/criação.
- Campos de preço, promoção, estoque, SKU, variações, galeria e SEO no rascunho.
- Validação de preço promocional, SKU duplicado e números nos formulários.
- Leitura do destaque inicial e preparação de banners desktop/mobile.
- Edição dos textos em português/espanhol com prévia textual e paginação.
- Preparação de títulos, ordem e visibilidade das seções existentes.
- Biblioteca das imagens usadas no HTML, com indicação das páginas de origem.
- Seleção local de JPEG/PNG/WebP para prévia: até 5 MB e 20 milhões de pixels.
- Configurações de identidade, contato e SEO em uma prévia central.
- Registro das operações de prévia realizadas nesta aba.
- Exportação das alterações para `eletrotech-rascunho.json`.

Aplicar à prévia altera somente objetos JavaScript em memória. Recarregar fecha
esse estado. A exportação é um download real, mas não publica nem envia nada.
Não existe importação de rascunhos nesta etapa. Imagens locais não entram no JSON:
guarde os arquivos originais para upload na etapa de backend. A validação no
cliente ajuda na prévia e não substitui a futura validação no servidor.

## O que depende da próxima etapa

- Autenticação, primeiro administrador, sessões, recuperação de acesso e papéis.
- Banco, API, migrations, persistência, auditoria e validação no servidor.
- Salvamento, exclusão, desativação e publicação reais; atualização do site público.
- Upload persistente, substituição/remoção de arquivos e referências no servidor.
- Editor de texto rico com sanitização; a interface atual edita texto simples.
- Galerias, variações, SEO e ordenação aplicados ao site público.
- Novas páginas institucionais e configuração de carrosséis publicados.
- Indicadores de vendas: o site atual não registra pedidos ou vendas.

Os botões de operação no servidor estão desabilitados. Não há tela que aceite
senhas nem login simulado. Esta interface é pública: não inserir segredos ou
dados privados. `noindex` é apenas uma orientação de indexação, não proteção.

## Arquivos e integração futura

- `index.html`: estrutura, navegação, avisos e diálogo do editor.
- `admin.css`: identidade azul da Eletrotech e layout responsivo isolado do site.
- `admin.js`: leitura do site, estado da aba, filtros, formulários e exportação.
- `../qa/scripts/review-admin.ps1`: verificação real em Edge via Live Server.

O frontend deve futuramente trocar a leitura de HTML e as alterações em memória
por uma API autenticada em origem própria. Manter o painel junto dessa API
simplifica os cookies; o Pages pode consumir somente os dados públicos.
Os identificadores extraídos por posição servem ao protótipo e devem ser
substituídos por IDs estáveis na importação para o banco. Não importar o JSON
diretamente em produção sem validação e correspondência com esses IDs.

## Validação executada

Edge headless: oito telas nas larguras 1440, 1024, 768, 390 e 320 px (40
combinações), sem overflow da página. Tabelas e menu móvel têm rolagem própria.
Editores cabem nas cinco larguras. Verificados carregamento dos seis produtos,
busca sem resultados, validação de promoção, aplicação de prévia com texto
contendo HTML sem executá-lo, paginação e estado desconectado de acesso.
Também verificados rejeição de SVG selecionado, prévia local de PNG e conteúdo
JSON gerado pela exportação (download interceptado durante o teste).
Capturas desktop e mobile inspecionadas. Não é teste em aparelho físico nem
auditoria de acessibilidade/segurança. Recursos de backend não foram testados,
pois não foram implementados.

Execute com Live Server na porta 5500:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File qa/scripts/review-admin.ps1
```
