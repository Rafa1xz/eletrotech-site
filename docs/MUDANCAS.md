# Eletrotech Marechal — revisão completa de 13/10/2026

Abra `index.html` na raiz. O projeto continua usando exclusivamente HTML, CSS e JavaScript puro. Não exige instalação, framework, servidor, npm ou build para suas funcionalidades atuais.

## O que foi analisado

As seis páginas, o cabeçalho/rodapé compartilhados, imagens, ícones, estilos, tradução, aliases de links antigos, busca, filtros, menu, formulário e fundo de peixes foram examinados antes das alterações. Os backups antigos foram removidos após a reorganização solicitada.

## Melhorias por página

- **Início:** entrada com o fundo de peixes preservado, painel real em destaque e caminhos separados para elétrica/automação e OxiLife Fish. Chamadas mais claras e abertura mais compacta.
- **Serviços:** abertura com foto real, seção identificada, seis cards com ícones locais, identificação das aplicações e ações alinhadas. História e orientações de orçamento preservadas.
- **Produtos:** abertura específica, contagem por categoria, busca e filtros combinados, cartões com hierarquia correta, imagens proporcionais e características organizadas em detalhes expansíveis. No celular, a imagem secundária da abertura é ocultada para priorizar o catálogo.
- **Como trabalhamos:** processo em lista ordenada de quatro etapas e bloco com informações úteis para o primeiro contato. História e perguntas frequentes nativas preservadas.
- **OxiLife Fish:** identificação da página, identidade aquática integrada à marca, foto do painel sem recortar o equipamento e sequência de funcionamento em lista ordenada. Capacidades e condições técnicas existentes foram preservadas.
- **Contato:** formulário primeiro na ordem visual e de leitura, canais alternativos com ícones, obrigatoriedade visível, instruções, contagem de caracteres, erros associados aos campos e foco no primeiro erro.

## Padrão visual e acessibilidade

A paleta parte das cores predominantes da logo: azul `#2056AE` e laranja `#F37216`, combinados com azul profundo, superfícies claras e ciano/verde-azulado nas áreas de piscicultura. Fonte do sistema, títulos fluidos, variáveis de espaçamento, componentes compartilhados e imagens existentes mantêm consistência.

Botões têm estados de hover, foco, clique e desabilitado quando aplicável. Efeitos de hover são limitados a dispositivos com ponteiro. A animação de entrada é curta e não esconde conteúdo; movimento reduzido desativa as animações e transições desnecessárias.

O menu mobile mantém fechamento por Escape/toque fora e controle de foco. Sua área recebe semântica de diálogo durante a abertura, com o conteúdo de fundo temporariamente indisponível. O atalho do WhatsApp no cabeçalho tem nome acessível mesmo quando apenas o ícone está visível. Há rótulos nos campos, títulos em ordem lógica, links para o conteúdo e foco visível.

Os ícones são SVGs originais da Font Awesome Free 6.7.2, com arquivos e licença em `assets/icons/`. Não há dependência de CDN ou pacote de interface.

## Funcionalidades preservadas e corrigidas

- Português/espanhol, metadados e preferência de idioma com armazenamento protegido. O novo seletor compacto mostra globo, idioma atual e seta; ao abrir, apresenta os nomes dos idiomas e marca a opção ativa. Foi aplicado nas seis páginas, com áreas de toque de 44px, foco visível, fechamento por Escape/clique fora e retorno do foco após escolher.
- Busca do cabeçalho levando ao catálogo; categoria e texto na URL; palavras sem acento e fora de ordem; estado vazio e limpeza dos filtros.
- Busca expansível fecha por Escape ou clique fora, mantendo o foco e evitando cobrir o conteúdo após uma ação.
- Pesquisa nos textos dos dois idiomas, agora preparados uma vez na inicialização. Trocar de idioma não perde a consulta.
- Menu mobile, barra de atalhos, links antigos e consultas individuais de serviços/produtos.
- Formulário que prepara e abre a mensagem no WhatsApp, com link alternativo quando a nova janela é bloqueada. Os limites originais de nome, cidade e mensagem foram preservados.
- Espaços em branco não passam pela validação. Os erros indicam o campo, explicam a correção, mantêm os valores e são traduzidos.
- Ao editar os dados ou trocar o assunto, o link da mensagem antiga é retirado e a página pede uma nova preparação. A prévia não é confundida com envio concluído.
- Os dados do formulário não são armazenados no site. O usuário revisa e confirma o envio no WhatsApp.
- Conteúdo, catálogo, navegação e FAQ continuam disponíveis sem JavaScript. O formulário oferece o contato direto quando a preparação automática está indisponível.

## Fundo de peixes

O vídeo original `videos/Fundo_Peixes.mp4` continua atrás da foto do painel, sem áudio e sem botão de pausa, conforme a preferência registrada. No desktop, faz uma passagem lenta de até 4,5 segundos e para. Pausa ao sair da tela ou ocultar a aba.

No celular, com movimento reduzido, economia de dados, JavaScript desativado ou reprodução bloqueada, usa `images/fundo-peixes-poster.jpg`. A fonte MP4 não é conectada nos modos estáticos. Os demais vídeos originais permanecem no projeto, mas não entram no pacote.

## Organização para apresentação

- `*.html`: páginas, semântica e textos traduzíveis na raiz.
- `css/styles.css`: base visual, componentes, layouts e regras responsivas.
- `js/script.js`: funções de inicialização por componente; comentários explicam decisões relevantes.
- `js/i18n.js`: aplicação do idioma e preferência opcional.
- `assets/`: favicon, ícones e respectivas licenças.
- `docs/APRESENTACAO.md`: roteiro curto para explicar o projeto na faculdade.
- `qa/`: scripts, capturas e resultados de verificação separados por tipo.

Os cabeçalhos e rodapés têm o mesmo padrão, mantidos em HTML para funcionar sem JavaScript. Os estilos e comportamentos ficam nos arquivos compartilhados. Ao editar informação comum, atualize as seis páginas.

## Verificações realizadas

- **65 verificações de regressão:** seis páginas nas larguras 320, 390, 768, 1024, 1040, 1280 e 1440px; tradução, imagens, filtros, busca, URL, estado vazio, menu, foco, paisagem, formulário, movimento reduzido, uso sem JS, armazenamento bloqueado e links antigos.
- **78 verificações adicionais:** hierarquia de títulos, referências ARIA, atalho do cabeçalho, layouts, semântica modal, fechamento da busca por clique fora, erros e foco do formulário, espaços em branco, tradução, invalidação de mensagem antiga, caracteres, assunto, texto com marcação, FAQ com Enter e salto ao conteúdo.
- **18 combinações de página/largura para ícones:** geometria e viewBox comparados aos SVGs originais, preenchimento e atributos decorativos conferidos.
- **67 verificações do novo seletor de idioma:** seis páginas em 320, 390 e 1440px; indicação e persistência do idioma, posição das opções, Enter, Espaço, setas, Escape, saída por foco, integração com o menu mobile, toque simulado e movimento reduzido. Relatório em `qa/results/resultado-idiomas.json`.
- **Fundo de peixes:** reprodução, parada automática, pausa fora da tela, retomada, imagem fixa no celular, movimento reduzido, economia de dados, reprodução bloqueada, ausência do botão e uso sem JS.
- **194 referências locais e âncoras:** arquivos e destinos existentes, HTML balanceado e imagens CSS localizadas.
- Contraste verificado em pares de texto principal (**14,07:1**), secundário (**6,02:1**), azul de ação (**6,99:1**), erro (**7,46:1**) e borda do campo sobre o painel branco (**3,38:1**).

Os testes usaram Microsoft Edge headless com perfil isolado. Não foram detectados erros JavaScript, imagens quebradas ou rolagem horizontal nas combinações revisadas. Não foi enviada nenhuma mensagem externa.

Relatórios: `qa/results/resultado.json`, `qa/results/revisao-completa.json` e `qa/results/resultado-peixes.json`. Capturas estão em `qa/screenshots/`, incluindo início, serviços, processo, catálogo, formulário, rodapé e navegação mobile.

## Limites e informações preservadas

A revisão usa larguras simuladas. Não houve teste em aparelhos físicos, auditoria com leitor de tela, medição Lighthouse ou envio real no WhatsApp. O comportamento do teclado virtual em aparelhos e a validade comercial do contato não foram confirmados.

O telefone original é `554599241306` / `+55 45 9924-1306`; o e-mail é `eletrotekc@outlook.com`. Endereço, horários, preços, disponibilidade, certificações e depoimentos não foram inventados. As capacidades técnicas do OxiLife continuam conforme o conteúdo original e dependem da configuração apresentada.

O arquivo `images/alarme-piscicultura.jpeg` mostra um oxímetro portátil. Os cards de alarme continuam usando o SVG explicitamente identificado como ilustração.

## Entrega

`eletrotech-site.zip` contém as seis páginas, entrada da raiz, documentação, CSS, JavaScript, imagens, ícones/licença e somente o vídeo utilizado. Exclui backups e arquivos de QA. Preserve a estrutura das pastas ao abrir ou hospedar. Esta revisão foi aplicada no projeto local; não houve publicação externa.
