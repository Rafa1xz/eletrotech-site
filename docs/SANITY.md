# Sanity — instalação e publicação

O painel de rascunhos foi removido. O Studio está instalado e conectado ao projeto **Eletrotech Marechal** (`zr5fcto8`), organização `oqf4kpjsl`, dataset público `production`. Os seis produtos e o documento de configurações foram importados. A sincronização real, a geração do site, os quatro testes e a compilação do Studio passaram.

O site público permanece em HTML/CSS/JS. React é usado somente pelo Studio separado.

## Conectar em outra máquina

Com Node.js 24 instalado, na raiz:

```powershell
npm install --prefix studio
cd studio
npx sanity login
cd ..
```

O login ocorre no navegador. Use a conta que tem acesso ao projeto existente; não é necessário criar outro projeto.

Copie `.env.example` para `.env` e `studio/.env.example` para `studio/.env.local`. Preencha `zr5fcto8` nos campos de Project ID e use o dataset `production`. Nesta máquina os arquivos já estão configurados. Não envie tokens pelo chat nem os coloque em arquivos versionados.

## Importação inicial já realizada

Os comandos abaixo são referência para migração para outro dataset vazio. Não repita a importação no dataset atual para substituir edições.

```powershell
npm run sanity:seed
cd studio
npx sanity dataset import ../data/sanity-import.ndjson --dataset production
cd ..
npm run studio
```

A exportação contém seis produtos e o documento `site-settings`, com IDs e slugs originais. O comando de importação envia esses dados ao dataset. Importe uma vez; não use `--replace` para sobrescrever edições posteriores.

As fotos locais continuam válidas. Para substituir uma foto, use o upload no Studio. O build baixa as imagens publicadas do CDN do Sanity para o site estático.

## Editar e publicar

1. Abra https://eletrotech-marechal.sanity.studio/ e entre com sua conta.
2. Edite o produto e clique em Publish. Rascunhos não entram no site.
3. O GitHub Actions confere o conteúdo publicado a cada cinco minutos e publica o site quando encontra mudanças.
4. Para antecipar a atualização, execute `Publicar site` em Actions. Para gerar uma cópia local, execute `npm run build`.

As variáveis `SANITY_PROJECT_ID=zr5fcto8` e `SANITY_DATASET=production` estão configuradas no repositório `Rafa1xz/eletrotech-site`. Dataset público não exige token de leitura. Para dataset privado, adicione o secret `SANITY_API_READ_TOKEN` com permissão de leitura.

O Studio está hospedado em https://eletrotech-marechal.sanity.studio/ e exige login para editar. Para atualizar o código do Studio hospedado, execute `npm run deploy` dentro de `studio/` após o login. O ID da aplicação e o hostname estão registrados em `sanity.cli.js`.

A automação consulta somente conteúdo publicado, sem expor tokens no navegador nem exigir computador ligado. O agendamento do GitHub pode atrasar: cinco minutos é a frequência de verificação, não uma garantia de prazo. O GitHub desativa agendamentos de repositórios públicos após 60 dias sem atividade no repositório; se isso acontecer, reative o workflow em Actions. A execução manual continua disponível.

O workflow compara os JSON publicados antes de gerar o site. Sem mudanças, encerra sem deploy. O registro de URLs já publicado é recuperado em cada execução, preservando também os endereços dos produtos criados e removidos exclusivamente pelo Sanity.

## Escopo

- Produtos: cadastro, imagens, traduções PT/ES, SEO, preço, promoção, estoque, variações e especificações.
- Configurações: nome, URL, WhatsApp e e-mail usados pelo gerador e scripts de contato. Textos fixos nos HTML institucionais continuam nos arquivos.
- Rotas existentes: o gerador bloqueia alteração/reutilização de slugs registrados. Use IDs únicos e preserve IDs e endereços publicados.
- `active: false` mantém a página de indisponibilidade e retira o produto do catálogo e sitemap.
- Novas URLs são preservadas no manifesto público e recuperadas antes de cada geração. Para builds locais, execute `node scripts/check-publication.mjs` antes do gerador para recuperar esse registro.
- Catálogo vazio inesperado interrompe a sincronização. Para esvaziar intencionalmente, defina `SANITY_ALLOW_EMPTY=true`.
- Falhas de API, mídia ou validação interrompem o workflow; a versão publicada permanece disponível.
- Login, criação, importação, leitura real e hospedagem do Studio foram concluídos. O fluxo de upload de novas fotos ainda não foi exercitado na conta.

Referências oficiais: [instalação](https://www.sanity.io/docs/studio/installation), [login](https://www.sanity.io/docs/cli-reference/login), [inicialização](https://www.sanity.io/docs/cli-reference/init), [variáveis](https://www.sanity.io/docs/studio/environment-variables) e [consulta](https://www.sanity.io/docs/http-reference/query).
