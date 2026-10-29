# Eletrotech — direção visual da página inicial

Direção escolhida pelo proprietário: organização equilibrada inspirada na clareza, tipografia, espaçamento e contenção de movimento de Apple.com. A aplicação é original e conserva a marca e o conteúdo da Eletrotech.

## Escopo

A página inicial usa `css/home.css`, carregado depois dos estilos compartilhados. As páginas internas conservam sua apresentação existente. Não alterar o catálogo, as rotas ou a integração Sanity por consequência de uma mudança visual.

## Composição

- A abertura tem uma mensagem, uma frase de apoio e duas ações. O orçamento é a ação principal; conhecer serviços é secundária.
- O vídeo `videos/fundo_aquario.mp4` permanece como fundo da abertura, conforme pedido expresso. Uma camada escura assegura legibilidade. Não usar grade decorativa nem texto em gradiente.
- Uma fotografia real de montagem e os dados existentes de histórico compõem a prova logo após a abertura.
- Seguem soluções, serviços, equipamentos, OxiLife, quatro etapas de trabalho, portfólio e contato final. Preservar os fatos existentes; não criar comparativos, preços ou FAQ sem conteúdo real.
- Títulos conduzem as seções; evitar kickers e números decorativos. Os números das etapas permanecem porque indicam sequência.

## Tipografia e espaço

- Fonte de sistema, conforme instrução explícita: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- Títulos principais entre 40 e 72 px, ajustados no celular; títulos de seção entre 28 e 48 px. Texto de apoio com entrelinha 1.6.
- Contêiner de até 1120 px; escala de espaço 4/8/12/16/24/32/48/64 px; seções com 64 a 120 px de separação.
- Em celular, a ordem de leitura permanece linear, com imagens, títulos e ações agrupados por assunto.

## Cores e materiais

- Branco, cinza `#f5f5f7`, texto `#1d1d1f` e texto secundário `#59595f`.
- Azul `#0f83fd` reservado para ação; azul `#0066cc` para links em fundo claro. CTAs azuis usam texto escuro para contraste.
- O vídeo é a exceção escura da composição. A logo e o verde de identificação dos controles de WhatsApp conservam as cores de marca existentes.
- Bordas finas só para separar informações; sombras discretas ou ausentes; raio padrão de 16 px. Fotos reais prevalecem sobre ícones e badges.

## Movimento e acesso

- Manter o conteúdo legível antes de qualquer animação.
- O comportamento existente do vídeo é uma passagem curta, silenciosa, com pausa fora de tela; em movimento reduzido e economia de dados, usar imagem estática. A implementação existente usa a imagem no celular.
- Manter foco visível, links reais, menu, busca, troca PT/ES, galeria e os contatos funcionando. Não adicionar biblioteca ou framework ao site público.

## Implementação

Tokens e regras estão limitados a `.home-page`. A gestão do conteúdo e a publicação automática permanecem no Sanity/GitHub Actions.
