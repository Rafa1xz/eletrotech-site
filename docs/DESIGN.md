# Organização visual

O site conserva a identidade Eletrotech: fundo claro, texto azul-escuro, ações em laranja
e canais de WhatsApp em verde. Na home, o cabeçalho começa sobre o vídeo e recebe fundo
branco ao rolar. No desktop, o hover do menu é amarelo em todas as páginas. No mobile,
o menu mostra a página atual em azul e fecha por botão, Escape ou clique fora.

A tipografia usa fontes do sistema. A navegação, busca, seleção de idioma, galerias e
contatos funcionam com controles nativos e foco visível. Movimento reduzido e economia
de dados são considerados na apresentação do vídeo.

## Estilos

`src/styles/styles.css`, `industrial.css` e `theme.css` formam as camadas compartilhadas.
`home.css` e `pages.css` ajustam os layouts gerais. Os demais arquivos tratam componentes
ou páginas: produtos, serviços, contato, processo, OxiLife, botões e contato flutuante.

A ordem dos estilos nos templates é intencional e é preservada ao agrupá-los no build.
Edite esses arquivos de origem, não os bundles gerados em `dist/css/`.

Mantenha a mesma ordem de leitura no desktop e no celular. Novos estilos de página devem
ser limitados à classe correspondente no `body`. Antes de alterar uma regra compartilhada,
confira home, catálogo, contato e uma página de produto.

O contato usa links diretos, sem formulário intermediário. As descrições e imagens continuam
editáveis pelo Sanity. As licenças dos ícones ficam em `public/assets/licenses/` e acompanham
o pacote publicado.
