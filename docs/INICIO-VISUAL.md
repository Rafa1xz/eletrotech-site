# Página inicial — atualização visual

Direção aprovada: apresentação equilibrada com tipografia de sistema, superfícies neutras, azul `#0f83fd` para ações e espaço generoso. A referência fornecida foi aplicada à organização e aos componentes da Eletrotech; as demais páginas conservam seus estilos.

A abertura contém título, apoio e duas ações. O arquivo `videos/fundo_aquario.mp4` é seu fundo, conforme pedido expresso. Uma imagem extraída desse mesmo vídeo (`images/fundo-aquario-poster.jpg`) mantém a composição nos estados de fallback. O comportamento de reprodução existente foi preservado: silencioso, breve e pausado fora da tela; celular, movimento reduzido e economia de dados usam a imagem estática.

A montagem real e o histórico ficam numa seção de prova após a abertura. Serviços, produtos, OxiLife, processo com quatro etapas, trabalhos e contatos permanecem acessíveis. Foram removidos rótulos de seção e números exclusivamente decorativos; não foram criados preços, comparações, métricas ou respostas de FAQ.

`css/home.css` contém tokens e regras limitados a `.home-page`. A fonte de sistema, o uso do vídeo e a cor de ação seguem as preferências explícitas do proprietário. A logo e os controles de WhatsApp preservam sua identificação de marca.

## Verificações

- Edge em 1440, 1024, 768, 390 e 320 px, em português e espanhol; sem overflow horizontal.
- Todos os links anteriores e sua ordem preservados, com comparação automatizada do HTML.
- Busca, menu, Escape, troca de idioma, galeria e preferência por movimento reduzido exercitados.
- Vídeo de aquário carregado, decodificado e reproduzido em servidor local; fallback extraído do próprio vídeo.
- Capturas de desktop e celular inspecionadas, incluindo imagens abaixo da dobra.
- Revisão estática: 13 HTML e 555 referências locais e âncoras verificadas.
- Cores de ação e texto secundário conferidas por cálculo de contraste. Sem teste físico de dispositivos nem auditoria com leitor de tela.

As integrações Sanity e GitHub Actions permanecem iguais.
