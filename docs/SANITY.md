# Edição da loja no Sanity

Painel atual: https://eletrotech-marechal-painel.sanity.studio/.
Projeto do código: `zr5fcto8`, dataset `production`.

## Acesso do lojista

Crie uma conta no Sanity com o e-mail do lojista. Um administrador do projeto
`zr5fcto8` precisa convidar esse e-mail em Members, nas configurações do projeto:
https://www.sanity.io/manage/project/zr5fcto8.
Use uma função com permissão de editar e publicar conteúdo. Depois de aceitar
o convite, entre no Studio com a mesma conta. Não compartilhe senhas nem tokens.
Criar uma conta ou outro projeto não concede acesso ao conteúdo existente.

## Onde editar

| Conteúdo | Local no painel |
| --- | --- |
| Títulos, parágrafos e SEO de cada página em PT/ES | Páginas do site → página → Textos e SEO |
| Fotos, fundos e vídeos | Páginas do site → página → Imagens e vídeos |
| Exibir, ocultar e ordenar seções existentes | Páginas do site → página → Geral |
| Nome em PT/ES, posição e visibilidade no menu | Páginas do site → página → Geral |
| Destinos de botões e assuntos de WhatsApp | Páginas do site → página → Links e botões |
| Produtos, fotos, galeria, preços, estoque e especificações | Catálogo → Produtos |
| Serviços, fotos, ordem e presença na home | Catálogo → Serviços |
| Menu, rodapé, botões, busca, formulário e mensagens | Textos do site → grupo correspondente |
| Empresa, contatos, logo, atendimento e cores do rodapé | Configurações do site |

Os textos específicos das páginas têm prioridade sobre os compartilhados.
No menu, um nome personalizado na página tem prioridade sobre o texto compartilhado.
O espanhol pode ser alterado independentemente do nome em português.
Esconder uma página no menu mantém seu endereço funcionando. As seções podem ser
reordenadas e ocultadas; criar novos modelos de seção ainda exige código.
Os desenhos dos ícones e a estrutura visual continuam no código.

Para trocar uma foto ou vídeo, use o campo de upload, que tem prioridade sobre
o caminho do arquivo atual. Imagens: PNG, JPEG, WebP ou SVG, até 20 MB.
Vídeos de banner: MP4 ou WebM, até 80 MB; ajuste também a imagem alternativa.
O fundo do convite da página OxiLife fica na lista de imagens da própria página.

Não altere identificadores ou endereços de produtos já publicados.
Para retirar um produto, desative “Disponível no catálogo”: o endereço permanece
com uma mensagem de indisponibilidade. Preço e estoque vazios significam
“não informado”; estoque zero é um valor real. Preserve marcadores como `{name}`
e `{count}` nos textos de mensagens.

## Publicação

Clique em **Publish** em cada documento alterado. Rascunhos não entram no site.
O site é estático: o GitHub Actions consulta o conteúdo publicado aproximadamente
a cada cinco minutos. O agendamento do GitHub pode atrasar ou ficar desativado
após um período de inatividade do repositório público. Nesse caso, reative o workflow.
Para antecipar a atualização, execute **Publicar site** em Actions:
https://github.com/Rafa1xz/eletrotech-site/actions/workflows/publish.yml.

O workflow precisa das variáveis `SANITY_PROJECT_ID=zr5fcto8` e
`SANITY_DATASET=production`. Dataset público permite leitura sem token.
Em dataset privado, configure o segredo `SANITY_API_READ_TOKEN` com acesso de
leitura. Nunca coloque tokens no código ou em variáveis `SANITY_STUDIO_*`.
Uma falha na sincronização ou validação interrompe a nova publicação.

## Desenvolvimento e manutenção

Use Node.js 24 ou superior. No Windows, use `npm.cmd` se o PowerShell bloquear `npm.ps1`.

```powershell
npm.cmd ci
npm.cmd ci --prefix studio
Copy-Item .env.example .env
Copy-Item studio/.env.example studio/.env.local
```

Defina `SANITY_PROJECT_ID=zr5fcto8` em `.env` e
`SANITY_STUDIO_PROJECT_ID=zr5fcto8` em `studio/.env.local`.
Os dois arquivos são ignorados pelo Git. Não substitua arquivos já configurados.

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run dev
npm.cmd run studio
```

Site local: http://127.0.0.1:5500. Studio local: http://localhost:3333.
`npm.cmd run build` busca o conteúdo remoto; mantenha alterações permanentes nos
templates e schemas, pois os HTML e JSON sincronizados são gerados novamente.

Após uma atualização do código, um administrador autenticado no projeto correto
pode adicionar os novos campos sem substituir edições existentes:

```powershell
npm.cmd run cms:layout:bootstrap
npm.cmd run cms:texts:bootstrap
npm.cmd run studio:build
npm.cmd --prefix studio run deploy
```

A migração de layout preserva edições publicadas, rascunhos, uploads e ordem dos
itens; uma segunda execução não altera os mesmos dados novamente. Ela não
cria páginas em um projeto vazio. Para um projeto novo, inicialize primeiro
com `npm.cmd run cms:bootstrap`, depois inicialize os textos.

O projeto `zr5fcto8` também contém produtos Eletrotech, mas não é o projeto
configurado neste código e, na verificação de 20/11/2026, não tinha as seis páginas.
Confirme o Project ID antes de migrar ou publicar o Studio. Não importe por
substituição sobre conteúdo já editado pelo lojista.
