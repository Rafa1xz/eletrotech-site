# Como explicar o projeto na faculdade

## Objetivo

O site apresenta soluções de elétrica, automação e piscicultura. O visitante pode conhecer serviços, consultar equipamentos, entender o processo e preparar uma mensagem para a equipe. A interface diferencia as duas áreas sem perder a identidade da Eletrotech.

## Três partes da implementação

**HTML:** organiza conteúdo e navegação em seis páginas. Usa landmarks, títulos, listas ordenadas para as etapas, artigos para os cards, labels nos campos e `details`/`summary` nas perguntas e características. O conteúdo existe antes de qualquer script executar.

**CSS:** controla aparência e layout. A paleta usa o azul e o laranja da logo, com ciano para piscicultura. Variáveis mantêm cores e espaços consistentes. Flexbox organiza ações lineares; Grid organiza cards, aberturas e formulário. Media queries adaptam a composição quando falta espaço. Não há framework ou compilação.

**JavaScript:** adiciona interações. O arquivo `js/script.js` possui funções separadas para contatos, vídeo, navegação, barra mobile, catálogo e formulário. Cada função procura seus elementos; se o componente não existir na página, ela não executa.

## Exemplo de fluxo: catálogo

1. O visitante digita ou escolhe uma categoria.
2. O evento chama a função de atualização.
3. O script lê o termo e a categoria e compara com os dados dos cards.
4. A propriedade `hidden` controla quais cards aparecem.
5. A contagem e o estado vazio são atualizados; a URL conserva os filtros.

Os textos dos dois idiomas são preparados uma vez. A pesquisa normaliza acentos e compara cada palavra, permitindo buscar sem acentuação e continuar a consulta após trocar o idioma.

O seletor do cabeçalho mostra apenas o idioma atual. `i18n.js` controla a visibilidade das opções com `hidden` e informa esse estado com `aria-expanded`. Ao escolher Português ou Español, atualiza os textos, a indicação ativa e a preferência no navegador. Botões nativos permitem usar teclado e toque; Escape fecha as opções e devolve o foco ao seletor.

## Exemplo de fluxo: formulário

1. O visitante informa nome, cidade, assunto e necessidade.
2. Ao preparar a mensagem, o script verifica obrigatoriedade, limites e espaços em branco.
3. Se houver erro, aparece uma mensagem associada ao campo e o foco vai para o primeiro problema.
4. Com os dados válidos, o texto é codificado em um link do WhatsApp.
5. A página abre o link e oferece uma alternativa caso a nova janela seja bloqueada.
6. Se o visitante editar os dados, a mensagem precisa ser preparada novamente.

O site **prepara** a mensagem; o envio acontece quando o usuário confirma no WhatsApp. Não há backend ou armazenamento dos dados do formulário. A preferência de idioma é o único dado desse fluxo salvo opcionalmente no navegador.

## Decisões de acessibilidade

- Links navegam; botões executam ações.
- Foco visível, nomes acessíveis, rótulos e ajuda nos campos.
- Erros usam texto e associação ao campo, além da cor.
- O menu mobile sobreposto restringe o foco enquanto aberto, fecha com Escape e devolve o foco ao acionador.
- FAQ funciona com controles nativos do navegador.
- Movimento reduzido elimina efeitos não essenciais; o vídeo tem alternativa estática e não é carregado no celular.

## O que demonstrar

Abra `index.html`, visite as seis páginas e redimensione a janela. Mostre a busca, um resultado vazio, a limpeza dos filtros, a troca de idioma, o menu com teclado e um formulário inválido. Para demonstrar o fluxo válido sem enviar uma mensagem, explique o link preparado e revise seu conteúdo; não é necessário confirmar o envio.

Os testes automáticos usaram Edge em larguras simuladas entre 320 e 1440px. Os resultados e limites estão em `MUDANCAS.md`. Esses testes não substituem uma auditoria completa nem validação em aparelhos físicos.
