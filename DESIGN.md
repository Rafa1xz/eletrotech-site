# Eletrotech — direção visual do site público

Direção escolhida pelo proprietário: organização equilibrada inspirada na clareza, tipografia, espaçamento e contenção de movimento de Apple.com. A aplicação é original e conserva a marca e o conteúdo da Eletrotech.

## Escopo

A página inicial usa `css/home.css`, carregado depois dos estilos compartilhados. As páginas internas usam `css/pages.css` e seguem a mesma base neutra, azul de ação e tipografia de sistema, com organização própria para catálogo, formulário e detalhes de produto. Não alterar o catálogo, as rotas ou a integração Sanity por consequência de uma mudança visual.

## Composição

- A abertura tem uma mensagem, uma frase de apoio e duas ações. O orçamento é a ação principal; conhecer serviços é secundária.
- O vídeo `videos/fundo_aquario.mp4` permanece como fundo da abertura, conforme pedido expresso. Uma camada escura assegura legibilidade. Não usar grade decorativa nem texto em gradiente.
- A abertura é seguida por atalhos compactos para as três áreas e pelos serviços. A fotografia de montagem e o histórico aparecem em seguida, sem adiar a apresentação do que a empresa oferece.
- Seguem equipamentos, OxiLife, quatro etapas de trabalho, portfólio e contato final. Preservar os fatos existentes; não criar comparativos, preços ou FAQ sem conteúdo real.
- Títulos conduzem as seções; evitar kickers e números decorativos. Os números das etapas permanecem porque indicam sequência.

## Tipografia e espaço

- Fonte de sistema, conforme instrução explícita: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- Títulos principais entre 40 e 72 px, ajustados no celular; títulos de seção entre 28 e 48 px. Texto de apoio com entrelinha 1.6.
- Contêiner de até 1120 px; escala de espaço 4/8/12/16/24/32/48/64 px. Seções da home usam 48 a 72 px de separação; páginas internas priorizam a tarefa, sem repetir a mesma abertura espaçosa em catálogo e contato.
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
- O WhatsApp flutuante começa compacto, inclusive com movimento reduzido. Os pontos de digitação aparecem brevemente no ícone; o texto expande somente por hover ou foco e recolhe ao sair. O controle não deve cobrir conteúdo automaticamente.

## Implementação

`css/home.css` limita suas regras a `.home-page`. `css/pages.css` é carregado somente nas páginas internas, inclusive pelo gerador de produtos e portfólio, para persistir a direção nas próximas publicações do Sanity. A gestão do conteúdo e a publicação automática permanecem no Sanity/GitHub Actions.

## Páginas internas

- Aberturas claras, breadcrumb legível e um título dominante; imagens reais com legendas secundárias.
- Catálogo: separar introdução e controles, com filtro ativo em azul e resultados em cartões neutros. Não substituir nem ocultar os estados de busca vazia ou filtros ativos.
- Serviços e processo: títulos claros, sequência numerada nas etapas e preparação do orçamento como conteúdo de apoio.
- Contato: formulário principal, alternativas de contato secundárias, campos de 48 px e mensagens de validação preservadas. No celular, o WhatsApp fica compacto enquanto um campo recebe foco.
- OxiLife: marca subordinada ao título, imagem real do painel e capacidades com suas ressalvas existentes.
- Produtos: galeria, título, disponibilidade e orçamento precedem informações técnicas e relacionados; imagens de equipamento não são recortadas pela galeria.
- Portfólio: fotos e títulos lideram; manter ampliação e legenda.

## Banner, navega??o e rodap? ? refer?ncia Adetur

A atualiza??o usa `css/reference-layout.css`, carregado ap?s home.css ou pages.css. Cabe?alho transparente sobre o v?deo na home, fundo petr?leo ao rolar, t?tulo alinhado ? esquerda, a??es amarelas e ondas em SVG no banner e no rodap?. P?ginas internas mant?m cabe?alho s?lido. O rodap? conserva os contatos e links da Eletrotech, com tr?s colunas no desktop e empilhamento no celular. Os controles de menu, busca e idioma continuam usando o JavaScript existente. O gerador de produtos inclui a nova folha de estilos. Esta atualiza??o substitui as orienta??es anteriores de apar?ncia para esses tr?s componentes.

Ajuste de cores: navbar branca em todas as p?ginas e estados (inclusive menu m?vel), textos azul-escuro e rodap? azul-marinho `#102c4d`, em harmonia com a marca Eletrotech. Substitui o cabe?alho transparente e o petr?leo da refer?ncia.

Navega??o revisada: na home, fundo transparente no topo e branco ao rolar, com transi??o de 350 ms; menu ou busca abertos recebem fundo branco. Links e controles claros sobre o banner e escuros sobre branco. No celular, controles compactos, logo flex?vel e altura do menu baseada no viewport. Validado no Edge headless entre 320 e 1440 px, incluindo abertura/fechamento do menu e mudan?a de fundo ao rolar.

Rodap? atualizado: fundo cinza-azulado claro `#f1f5f9`, t?tulos e links `#102c4d`, texto secund?rio `#475569` e divis?rias `#cbd5e1`. Mant?m ondas e detalhes amarelos, com foco e ?cones azuis para contraste sobre fundo claro.

Cor final do rodap?: laranja claro `#fff1e6`, mantendo t?tulos e links azul-marinho. Substitui o fundo cinza-azulado anterior.

Rodap?: laranja forte da identidade existente `#f37216` (brand-orange), com textos e detalhes azul-marinho `#102c4d`, substituindo o laranja claro.

Revers?o solicitada: restaurado rodap? laranja claro `#fff1e6`, textos secund?rios `#475569`, divis?rias claras e detalhes amarelos, como antes do laranja forte.

Rodap?: fundo branco `#ffffff`, conforme ?ltima solicita??o; mant?m textos azul-marinho e secund?rios escuros.

Banner da home ampliado: m?nimo de 780 px/90svh no desktop, 700 px/85svh no tablet e 680 px/90svh no celular. V?deo `videos/Fundo_Peixes.mp4` e imagem alternativa `images/fundo-peixes-poster.jpg`, substituindo o aqu?rio. Mant?m as prefer?ncias de movimento e economia de dados existentes.

Banner centralizado: t?tulo com pesos 650/750, descri??o central de at? 610 px, bot?es alinhados ao centro com a??o secund?ria contornada e camada escura vertical equilibrada sobre os peixes. Preserva v?deo, altura ampliada e textos PT/ES.

Refino do banner: primeira frase do t?tulo com peso 500 e segunda com 750; descri??o em duas frases separadas com tradu??es PT/ES. Bot?es em c?psula de 56 px, or?amento em laranja com degrad? discreto, borda e sombra suave. A??o secund?ria contornada.

Servi?os da home: atalhos com ?cones e fundo neutro, se??o home-services com t?tulo central e detalhe laranja, tr?s cart?es brancos sobre fundo suave, ?cones azuis, categorias discretas e links de or?amento alinhados na base. Uma coluna at? 760 px.

Implementada proposta de servi?os com fotos: pain?is existentes nos dois primeiros cart?es; imagem ilustrativa gerada para residencial, identificada no alt. Cabe?alho em duas colunas, detalhes laranja e bot?o principal azul-marinho. Imagem: images/servico-residencial-ilustrativo.png; ferramenta imagegen integrada; prompt: foto editorial de m?os de eletricista com luvas em quadro residencial branco, ferramenta com detalhe laranja, sem rosto, texto ou marca.

Equipamentos da home: implementada proposta em home-equipment, com fotos reais preservadas, cabe?alho em duas colunas, descri??es e a??es por categoria, detalhes laranja, t?tulos azul-marinho e CTA de cat?logo escuro. Tradu??es PT/ES e rotas de produtos preservadas. Cart?es empilhados at? 760 px.

OxiLife em destaque: painel navy amplo com fundo de piscicultura ilustrativo, marca branca/turquesa, CTA laranja e recursos na base; no celular a imagem precede o texto. Etapas com numera??o laranja. Asset gerado com imagegen: images/oxilife-destaque-ilustrativo.png. Prompt: viveiro brasileiro ao amanhecer, aerador na ?gua e quadro fechado ? direita, sem marcas, texto ou dados; cena ilustrativa, n?o registro de instala??o real.

OxiLife: fundo externo azul da marca `#174686`, com legenda clara `#e4edf8`; painel e se??o de etapas preservados.

OxiLife: restaurado fundo externo azul-claro `#edf5f7`, como na representa??o aprovada, e legenda azul-marinho.

OxiLife revisado para primeira proposta: fundo azul-profundo em toda se??o, duas colunas, recursos junto ao texto, CTA laranja, imagem existente preservada com moldura laranja discreta. No celular, colunas empilhadas.

Processo e contato: timeline com quatro ?cones SVG conectados, n?meros laranja e cabe?alho em duas colunas. CTA em banner navy com textura de circuito SVG e bot?o laranja para WhatsApp. Layout em duas colunas no tablet e uma no celular; mant?m descri??es e tradu??es existentes.

Logo atualizada: images/logo-eletrotech-transparente.png, vers?o em alta resolu??o com alpha gerada por imagegen a partir da logo HD. Originais preservados. Prompt: remover fundo branco, preservar nome, raio, propor??es e cores azul/laranja, limpar bordas para uso web. Aplicada na navbar e rodap? em todas as p?ginas.

P?gina de servi?os reformulada: hero em duas colunas com foto real e CTA laranja, atalhos por categoria, seis servi?os existentes preservados com fotos, destaque OxiLife, processo com ?cones Lucide e banner de WhatsApp. Orienta??es para or?amento mantidas. Rodap? copiado integralmente da home. Estilos isolados em services-page; cart?es em 3/2/1 colunas.

Servi?os e produtos unificados em produtos.html (services-page combined-page), com menu ?nico, servi?os, cat?logo funcional e rodap? da home. servicos.html redireciona preservando query e ?ncoras. Gerador continua atualizando a grade de produtos e retira classes da p?gina unificada ao gerar detalhes. Busca do cabe?alho aponta para #catalogo.

P?gina unificada refinada conforme representa??o: hero ?O servi?o certo. O equipamento ideal.?, dois atalhos principais com indica??o por rolagem, servi?os compactos em fundo azul-claro e cat?logo branco separado. Cat?logo completo preservado; processo e orienta??es acess?veis em details. Faixa OxiLife e CTA compactos; rodap? e logo oficial mantidos.

Nova representa??o da p?gina unificada implementada em css/combined.css: hero com cena de oficina ilustrativa gerada por imagegen (images/servicos-produtos-oficina-ilustrativa.png; prompt: quadro aberto e motores azuis em oficina, sem marcas/textos), servi?os brancos e produtos horizontais com imagens contidas. Mantidos dados, pre?os, filtros, seis servi?os e seis produtos, logo e rodap? oficiais. Sem restaurar blocos removidos.

P?gina Como trabalhamos: proposta implementada em css/process.css, abertura com foto ilustrativa de planejamento, timeline vertical com SVGs Lucide, quadro de prepara??o ao lado e contato navy/laranja. Hist?rico e FAQ preservados em bloco expans?vel. Logo oficial e rodap? da home mantidos. Imagem images/processo-planejamento-ilustrativo.png gerada por imagegen; prompt: m?os de t?cnico revisando planta el?trica em bancada com disjuntores e ferramentas, sem rosto/marca, cena ilustrativa.

Rodap? atualizado: mesmo degrad? da abertura de servi?os/produtos, linear-gradient(105deg,#e4f1ff,#f4f9ff), em todas as p?ginas, mantendo textos azul-marinho. Substitui o fundo branco anterior.

P?gina OxiLife Fish redesenhada em css/oxilife.css: hero navy com cena ilustrativa existente e painel aberto, tr?s etapas com ?cones Lucide, hist?rico preservado como nota, configura??o em campo antes dos equipamentos, tr?s produtos reais e CTA. Mantidas capacidades 3/4 com ressalva de configura??o, requisitos de conex?o, calibra??o e energia. Rodap? id?ntico ao da home, degrad? claro e borda reta.

Contato redesenhado em css/contact.css: hero azul-claro com SVG Lucide decorativo, formul?rio ? esquerda e canais diretos ? direita, prepara??o em cart?o claro e links de explora??o. IDs, nomes, limites, valida??o e fluxo WhatsApp mantidos. Logo e rodap? da home preservados. Telefone/e-mail reais; sem promessas de prazo.

V?deo da home: removido o limite antigo de 4,5 segundos e o estado finished. Fundo_Peixes.mp4 agora repete continuamente (autoplay/loop, mudo), pausa fora do banner/aba e retoma ao voltar; tenta novamente em foco, pageshow, retorno da conex?o e intera??o. Preservados movimento reduzido, economia de dados e imagem est?tica no celular.
