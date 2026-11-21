# Conteúdo e Sanity

Painel: https://eletrotech-marechal-painel.sanity.studio/.
Projeto ativo: `zr5fcto8`. Dataset: `production`.

## Acesso do lojista

Entre com uma conta que tenha acesso ao projeto. Um administrador pode convidar
outros usuários em [Members](https://www.sanity.io/manage/project/zr5fcto8), com
permissão de editar e publicar conteúdo. Após aceitar o convite, use a mesma conta no painel.

## Onde editar

| Conteúdo                                               | Local no painel                             |
| ------------------------------------------------------ | ------------------------------------------- |
| Títulos, parágrafos e SEO em português e espanhol      | Páginas do site → página → Textos e SEO     |
| Fotos, imagens de fundo e vídeos                       | Páginas do site → página → Imagens e vídeos |
| Exibir, ocultar e ordenar seções                       | Páginas do site → página → Geral            |
| Nome, tradução, ordem e visibilidade no menu           | Páginas do site → página → Geral            |
| Destinos de links e assuntos do WhatsApp               | Páginas do site → página → Links e botões   |
| Produtos, galerias, preços, estoque e especificações   | Catálogo → Produtos                         |
| Serviços, imagens e presença na home                   | Catálogo → Serviços                         |
| Textos compartilhados, busca e mensagens               | Textos do site → grupo correspondente       |
| Empresa, contatos, logo, atendimento e cores do rodapé | Configurações do site                       |

Os textos específicos de uma página têm prioridade sobre os compartilhados.
Um nome de menu personalizado na página também tem prioridade sobre o texto compartilhado.
O nome em espanhol pode ser alterado independentemente do português.

Ocultar uma página no menu mantém seu endereço acessível. As seções existentes podem
ser reordenadas ou ocultadas. Novas estruturas de seção e alterações gerais no desenho
do site continuam sendo feitas no código.

## Fotos, vídeos e produtos

Use os campos de upload para substituir imagens e vídeos. Um upload tem prioridade
sobre o caminho do arquivo existente. O limite é de 20 MB por imagem e 80 MB por vídeo.
São aceitos PNG, JPEG, WebP e SVG; vídeos de banner usam MP4 ou WebM.
Ao trocar o vídeo, ajuste também a imagem alternativa e as descrições acessíveis das fotos.

Mantenha os identificadores e endereços dos produtos já publicados. Para retirar um produto,
desative **Disponível no catálogo**: o endereço continua funcionando com uma mensagem
de indisponibilidade. Preço e estoque vazios significam “não informado”; zero é um valor real.

Mensagens podem conter marcadores como `{product}` ou `{count}`. Preserve esses marcadores
ao editar suas traduções.

## Publicar alterações

Clique em **Publish** em cada documento alterado. Rascunhos não aparecem no site.
O GitHub Actions consulta o conteúdo publicado aproximadamente a cada cinco minutos.
O agendamento pode atrasar ou ser desativado pelo GitHub após inatividade prolongada.
Para antecipar ou reativar a atualização, abra o workflow
[Publicar site](https://github.com/Rafa1xz/eletrotech-site/actions/workflows/publish.yml).

## Configuração técnica

O build lê `.env` na raiz:

```dotenv
SANITY_PROJECT_ID=zr5fcto8
SANITY_DATASET=production
```

O Studio lê `studio/.env.local`:

```dotenv
SANITY_STUDIO_PROJECT_ID=zr5fcto8
SANITY_STUDIO_DATASET=production
```

O dataset público permite leitura sem token. Para um dataset privado, configure
`SANITY_API_READ_TOKEN` no ambiente do build. Credenciais não devem usar o prefixo
`SANITY_STUDIO_`, pois essas variáveis são incorporadas ao painel público.

O workflow usa as variáveis de repositório `SANITY_PROJECT_ID` e `SANITY_DATASET`.
Em datasets privados, o token de leitura deve ser um segredo do GitHub Actions.

## Manutenção dos campos

Após modificar os bindings dos templates:

```sh
npm run cms:texts:inventory
npm run format
npm run cms:texts:bootstrap
npm run cms:layout:bootstrap
npm run studio:build
npm run studio:deploy
```

Os comandos de bootstrap exigem uma sessão Sanity autenticada. Eles preservam os valores
existentes e os rascunhos, usando controle de revisão para detectar alterações concorrentes.
O inventário de textos retira do painel os campos cujos blocos foram removidos dos templates.

`npm run cms:export` prepara `.cache/cms-import.ndjson` com os documentos locais.
Para inicializar um projeto vazio, configure o Project ID e execute `npm run cms:bootstrap`.
Documentos existentes não são substituídos. Arquivos de mídia exclusivos de outro projeto
precisam ser enviados ao projeto de destino; exportar os documentos não transfere esses arquivos.
