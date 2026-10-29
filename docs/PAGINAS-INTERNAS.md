# Atualização das páginas internas

A direção visual aprovada na página inicial foi estendida a serviços, catálogo, processo de trabalho, OxiLife, contato, portfólio e às seis páginas de produto. O Sanity Studio não faz parte desta alteração: trata-se do site público.

`css/pages.css` compartilha tipografia de sistema, superfícies neutras, azul de ação, contêiner de 1120 px, bordas discretas e foco visível. Cada página mantém organização própria para sua tarefa.

- Serviços: fotografias, nomes e ações de orçamento mais legíveis; numeração decorativa subordinada ao conteúdo.
- Catálogo: filtros separados da abertura, seleção em azul, rótulo de busca com contraste e imagens de equipamentos sem recorte.
- Processo: sequência numerada preservada e painel de preparação com menos peso visual, sem posição fixa em telas menores.
- OxiLife: título dominante, marca secundária, foto real e capacidades com a ressalva de configuração preservada.
- Contato: formulário principal, campos de 48 px, erros e mensagem preparada preservados. No celular, o WhatsApp fica compacto enquanto um campo, inclusive select, recebe foco.
- Portfólio: fotos e títulos em destaque, com a ampliação existente.
- Produtos: galeria, nome, disponibilidade e orçamento precedem especificações e relacionados. Valores sob consulta e as URLs existentes permanecem.

O gerador `scripts/build-products.mjs` inclui o novo CSS nas páginas de produto. O portfólio herda o CSS de sua origem em `como-trabalhamos.html`. Assim, a próxima publicação do Sanity mantém a apresentação.

## Verificação

- Cinco testes de publicação, transformação do Sanity, preservação de rotas e separação de arquivos privados passaram.
- Verificação existente: 35 combinações de página/largura, galeria com setas/Escape, retorno de foco, orçamento traduzido, SEO e conteúdo sem JavaScript.
- Verificação adicional: 130 combinações, com as 13 páginas em cinco larguras (1440, 1024, 768, 390 e 320 px) e dois idiomas; sem overflow, h1 duplicado, IDs duplicados ou imagens iniciais quebradas.
- Links e sua ordem comparados com a versão anterior; destinos preservados.
- Filtros do catálogo, busca vazia e limpeza exercitados.
- Formulário vazio e válido, mensagem preparada e invalidação após edição exercitados com a abertura externa interceptada; nenhuma mensagem enviada.
- Busca do cabeçalho, menu e Escape preservados.
- Capturas de sete páginas representativas em desktop e celular inspecionadas.
- Revisão estática: 13 HTML e 567 referências locais e âncoras verificadas.

O detector de layout reportou avisos `cramped-padding` nos wrappers de largura total com filhos `.wrap`, e nos passos lineares de OxiLife. Os recuos reais vêm dos contêineres internos e a linha dos passos não envolve uma caixa à direita. Os avisos foram inspecionados em contexto, sem criar regras de ignore. Não representam novos erros de overflow.

Limites: testes em Edge headless e viewports emulados; sem validação em dispositivo físico, leitor de tela ou medição completa de desempenho. A página inicial e seu vídeo de aquário foram preservados.
