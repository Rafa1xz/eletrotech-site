# Sanity — gerenciamento e publicação

Projeto atual: **Eletrotech Marechal**, `mdb824ut`, organização `o9sh4d25p`, dataset público `production`. Criado na conta Google escolhida pelo usuário porque as contas autenticadas não tinham acesso ao projeto anterior. O projeto anterior não foi alterado.

Painel: https://eletrotech-marechal-loja.sanity.studio/

Foram importados seis produtos, seis serviços, seis páginas e as configurações atuais. O site público permanece em HTML/CSS/JS; React é usado somente pelo Studio separado.

## Gerenciamento pelo lojista

- Produtos: cadastrar, enviar fotos, editar traduções, preços, estoque, especificações e SEO. Preserve IDs e slugs já publicados; prefira desativar em vez de excluir.
- Serviços: cadastrar, editar fotos e textos, definir ordem, ativar/desativar e escolher os destaques da home.
- Páginas: textos PT/ES, títulos e descrições de busca, imagens e links dos modelos existentes. As seções podem ser reordenadas e ocultadas.
- Banner da home: enviar vídeo MP4/WebM e imagem de capa, configurar repetição, velocidade e ativação. O vídeo respeita as preferências de movimento reduzido do visitante.
- Configurações: logo, nome, WhatsApp, telefone, e-mail, Instagram, horários, texto e cores do rodapé.

O painel edita os modelos existentes. Novos tipos de layout, funcionalidades e páginas adicionais exigem alteração no código.

## Editar e publicar

1. Entre no painel com a conta que possui acesso ao novo projeto.
2. Escolha Produtos, Serviços, uma página ou Configurações.
3. Faça a alteração e clique em **Publish**. Rascunhos não aparecem no site.
4. O GitHub Actions verifica o conteúdo publicado a cada cinco minutos e gera o site quando encontra mudanças. O agendamento pode atrasar. Para antecipar, execute **Publicar site** em Actions.

As variáveis do repositório `Rafa1xz/eletrotech-site` foram atualizadas para `SANITY_PROJECT_ID=mdb824ut` e `SANITY_DATASET=production`. O dataset público dispensa token de leitura. Credenciais de edição não são incluídas no site.

## Desenvolvimento

Use Node.js 24. Na raiz:

```powershell
npm ci
npm ci --prefix studio
```

Configure `.env` com `SANITY_PROJECT_ID=mdb824ut` e `SANITY_DATASET=production`. Configure `studio/.env.local` com `SANITY_STUDIO_PROJECT_ID=mdb824ut` e `SANITY_STUDIO_DATASET=production`. Ambos são ignorados pelo Git.

```powershell
npm run dev
npm run studio
npm run build
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File qa/scripts/static-review.ps1
```

O build lê o Sanity, baixa mídia, renderiza páginas e serviços e gera produtos, sitemap e o pacote `_site/`. Templates ficam em `templates/pages/`. Faça alterações estruturais nesses templates; mudanças diretas nos HTML gerados serão substituídas pelo próximo build.

Para atualizar o Studio hospedado:

```powershell
cd studio
npx sanity login --provider google
npm run deploy -- --yes --schema-required
```

## Inicialização e verificações

`npm run cms:bootstrap` cria páginas e serviços ausentes com `createIfNotExists` e preenche configurações ausentes, preservando documentos existentes. Exportações NDJSON são ignoradas pelo Git e excluídas do pacote público. Não importe produtos com substituição para atualizar o site.

Foram verificados nove testes automatizados, geração com leitura real do novo projeto, validação dos links locais, compilação e publicação do Studio. Também foram exercitados criação, edição e exclusão de um cadastro temporário de teste, upload de imagem e download pelo CDN. O teste não publicou produto no catálogo.

As URLs dos produtos são preservadas pelo manifesto de rotas. Falhas de API, mídia ou validação interrompem a publicação e mantêm a versão anterior online. O catálogo vazio inesperado interrompe o build; para esvaziar intencionalmente, use `SANITY_ALLOW_EMPTY=true`.

O GitHub pode desativar agendamentos de repositórios públicos após 60 dias sem atividade; reative em Actions se necessário. A execução manual continua disponível.
