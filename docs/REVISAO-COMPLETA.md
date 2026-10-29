# Revisão estrutural e correções do site

## Diagnóstico

Foram feitas duas análises independentes: uma de composição e hierarquia, outra de implementação e comportamento real. A revisão visual identificou repetição de seções e excesso de espaço antes de tarefas úteis; a análise funcional usou cliques e teclado reais via CDP para não depender somente de chamadas `element.click()`.

A orientação do proprietário foi analisar o site inteiro, sem uma lista de reproduções fornecida. Não foram inventados defeitos em caminhos que funcionaram nos testes.

## Problemas confirmados e corrigidos

1. **WhatsApp cobria conteúdo com movimento reduzido.** O JavaScript expandia o botão automaticamente e o CSS fixava a largura de 184/205 px; sair com o mouse não o recolhia nesse modo. O estado inicial agora é compacto e o texto só abre por hover/foco. O recolhimento funciona também com movimento reduzido. O efeito solicitado permanece como pontos de digitação no ícone e texto digitado na interação.
2. **Seta da página atual invisível no menu mobile.** O tema claro recebeu uma seta branca herdada. A seta agora herda a cor do próprio link.
3. **Cabeçalho desalinhado em larguras acima de 1280 px.** A soma da marca, navegação e ações ultrapassava seu contêiner em aproximadamente 18 px, embora não causasse rolagem horizontal. Dimensões e altura do cabeçalho foram ajustadas; os limites reais do contêiner foram verificados.

## Alterações de estrutura e apresentação

- Home: atalhos compactos substituem um segundo bloco de apresentação; serviços aparecem antes da seção de prova. A foto real e o histórico foram preservados. Abertura, imagens e espaçamentos ficaram mais compactos; títulos das seções alinham com o conteúdo.
- Catálogo: abertura compacta, sem imagem repetida antes dos filtros. A busca, os filtros e os resultados aparecem mais cedo.
- Contato: menos espaço antes do formulário e alternativas de contato com menor peso. Todos os campos, rótulos e mensagens permanecem.
- Cabeçalho: mais compacto; a faixa superior repetida é retirada no celular, com os canais de contato ainda disponíveis no rodapé.
- Demais páginas: ritmo vertical mais compacto, mantendo hierarquia, galerias, especificações e estados do catálogo.
- O vídeo de aquário permanece na abertura com seu comportamento silencioso e breve já existente. A pausa após 4,5 segundos é uma regra anterior, não uma falha de carregamento.

## Verificações

- Cinco testes automatizados de publicação e Sanity.
- Treze páginas em cinco larguras e dois idiomas: 130 estados verificados, sem overflow, h1 duplicado, IDs duplicados ou imagens iniciais quebradas.
- Filtros, resultado vazio, limpeza, formulário inválido/válido, mensagem preparada, edição posterior e tradução da URL preparada exercitados.
- Cliques reais de menu, pesquisa, idioma, produto e galeria; teclado real no formulário; abertura externa interceptada, sem envio de mensagens.
- Novo teste permanente `qa/scripts/review-navigation.mjs`: limites do cabeçalho, menu mobile, seta ativa e estados compacto/expandido do WhatsApp em movimento normal e reduzido.
- Revisão estática de 13 HTML e 567 referências locais/âncoras.
- Capturas de desktop e celular inspecionadas. Viewports emulados não equivalem a teste em aparelho físico; não se afirma ausência absoluta de bugs.

O detector de layout continua sinalizando wrappers cujos recuos vêm de filhos `.wrap`. Esses avisos foram confrontados com renderização e limites geométricos, sem ocultá-los por regras de ignore. As alterações da revisão são de estrutura, navegação e estados reais, não uma nova troca de paleta.

## Executar a regressão de navegação

No Windows, com Node.js 24 e Edge instalado:

```powershell
node qa/scripts/review-navigation.mjs
```

Use `BROWSER_PATH` caso o Edge esteja em outro local. Não há dependências adicionais de teste.
