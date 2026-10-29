# Auditoria e ajuste de hierarquia da página inicial

> Registro da revisão anterior. A direção visual foi posteriormente atualizada por solicitação do proprietário; consulte `DESIGN.md` e `css/home.css` para a versão atual, com superfícies neutras, azul de ação e vídeo de aquário na abertura.

Data: 28/10/2026. Escopo confirmado: página inicial da Eletrotech, mantendo conteúdo, identidade e funcionalidades. Implementação em `index.html` e regras restritas a `.home-page` em `css/industrial.css`.

## Resultado

O caminho principal continua sendo conhecer as soluções e solicitar um orçamento. O botão de orçamento tem prioridade sobre a navegação secundária; a escolha de solução ganhou um título visível; produtos e trabalhos passam a ocupar menos espaço no celular. Legendas dos produtos usam texto escuro sobre fundo branco, em vez de texto escuro sobre um gradiente escuro.

## Avaliação técnica do escopo observado

Pontuações qualitativas segundo o roteiro Impeccable; não representam certificação WCAG nem auditoria completa de desempenho.

| Dimensão | Pontos | Evidência e limite |
| --- | --- | --- |
| Acessibilidade | 3/4 | Um h1, títulos preservados, legendas com contraste claro, botões principais com pelo menos 44 px de altura, foco e Escape exercitados. Sem teste com leitor de tela. |
| Desempenho | 3/4 | Nenhuma dependência, imagem ou script de produção adicionado; imagens continuam com carregamento tardio e dimensões declaradas. Sem profiling de rede ou frames. |
| Temas e tokens | 2/4 | Cores existentes preservadas, com uso de tokens nas legendas. Permanecem valores literais e estilos sobrepostos no CSS legado; não foi criada uma nova arquitetura de temas. |
| Responsividade | 3/4 | Dez combinações de largura/idioma sem overflow; CTAs e densidade de mídia ajustados. Viewports emulados em Edge, sem teste físico de toque. |
| Integridade | 3/4 | Conteúdo e links do HTML comparados com o estado anterior. Busca, menu, idiomas e galeria exercitados; oito avisos estáticos de wrappers foram inspecionados e explicados abaixo. |
| **Total** | **14/20** | **Bom no escopo inspecionado, com pendências fora desta melhoria pontual.** |

## Achados tratados

### P1 — Legibilidade das categorias

Local: `.category-card > div` e títulos na seção de produtos. O gradiente escuro recebia texto escuro herdado, reduzindo a legibilidade do destino do link. A legenda agora ocupa uma superfície branca separada da imagem, com texto e cores já usados no site. Fotos e destinos foram preservados.

### P2 — Ações concorrentes na abertura

Local: `.hero-actions`. No celular, as duas ações usavam caixas de largura e peso semelhantes. O orçamento mantém o preenchimento de destaque; conhecer serviços passa a ser um link sublinhado, com área de toque de pelo menos 44 px e foco explícito. A informação complementar de histórico recebeu menos espaço e peso tipográfico.

### P2 — Grupo de navegação sem título visível

Local: `#solutions-title`. O título já existia para leitores de tela. Foi tornado visível para explicar o agrupamento das três soluções. Seu texto, nível semântico e identificação foram mantidos.

### P2 — Densidade das seções de apoio

Local: abertura, cabeçalhos de seção, categorias e projetos. Espaçamento, tamanho das imagens e agrupamento entre títulos e descrições foram ajustados apenas na home. A ordem do DOM e das ações não mudou.

| Região | Antes | Depois | Viewport |
| --- | --- | --- | --- |
| Abertura | 676 px | 572 px | 1440 px |
| Abertura | 880 px | 752 px | 390 px |
| Produtos | 1514 px | 1328 px | 390 px |
| Trabalhos realizados | 1429 px | 1214 px | 390 px |

Medições de altura das seções com o conteúdo em português. A seção de soluções ficou maior por expor seu título; a redução das demais regiões conserva o ritmo da página.

## Verificação

- Edge headless nas larguras 1440, 1024, 768, 390 e 320 px, em português e espanhol.
- Sem rolagem horizontal; um h1; título de soluções visível; CTAs da abertura com pelo menos 44 px de altura.
- Busca do cabeçalho, abertura do menu e fechamento por Escape, troca de idioma, abertura da galeria e fechamento por Escape.
- Preferência por movimento reduzido preservada; nenhum erro JavaScript observado.
- Comparação do HTML: a única alteração foi a classe que torna visível o título já existente. Textos, links, atributos de tradução e comportamentos foram mantidos.
- Revisão estática existente: 13 HTML e 554 referências locais e âncoras verificadas.
- Capturas de desktop e celular conferidas após carregar também as imagens abaixo da dobra. Espaços vazios de imagens lazy em capturas iniciais não foram classificados como defeitos do site.

## Detector e pendências

O detector de layout reportou oito avisos `cramped-padding` em wrappers de largura total: topbar, busca, abertura, faixa de setores, soluções, duas seções e OxiLife. O conteúdo dessas regiões é recuado pelos filhos `.wrap` e pelos espaçamentos internos; a ausência de padding no wrapper externo não demonstra texto encostado na borda. As capturas e a ausência de overflow foram verificadas. Não foram criadas regras de ignore nem alterada a configuração do hook.

Pendências fora do escopo: consolidar tokens e regras legadas, testar leitor de tela e toque físico, medir desempenho em dispositivo e conexão reais. Uma nova passagem de `$impeccable audit` pode ampliar essas verificações; `$impeccable polish` é o próximo passo para acabamento pontual, sem substituir a identidade existente.
