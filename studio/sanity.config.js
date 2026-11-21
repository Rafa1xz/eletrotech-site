import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes/index.js';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId)
  throw new Error(
    'Configure SANITY_STUDIO_PROJECT_ID em studio/.env.local para conectar o Studio.',
  );
const singletons = new Set(['sitePage', 'siteSettings', 'siteTexts']);

export default defineConfig({
  name: 'eletrotech',
  title: 'Eletrotech Marechal',
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Conteúdo')
          .items([
            S.listItem()
              .id('pages')
              .title('Páginas do site')
              .child(
                S.list()
                  .title('Páginas do site')
                  .items(
                    [
                      ['home', 'Início'],
                      ['catalog', 'Serviços e produtos'],
                      ['process', 'Como trabalhamos'],
                      ['oxilife', 'OxiLife Fish'],
                      ['contact', 'Contato'],
                      ['portfolio', 'Projetos e equipamentos'],
                    ].map(([id, title]) =>
                      S.listItem()
                        .id(id)
                        .title(title)
                        .child(
                          S.document()
                            .schemaType('sitePage')
                            .documentId('page-' + id),
                        ),
                    ),
                  ),
              ),
            S.listItem()
              .id('catalog')
              .title('Catálogo')
              .child(
                S.list()
                  .title('Catálogo')
                  .items([
                    S.documentTypeListItem('product').title('Produtos'),
                    S.documentTypeListItem('service').title('Serviços'),
                  ]),
              ),
            S.listItem()
              .id('texts')
              .title('Textos do site')
              .child(
                S.list()
                  .title('Textos compartilhados e mensagens')
                  .items(
                    [
                      ['navigation', 'Cabeçalho e navegação'],
                      ['footer', 'Rodapé e redes sociais'],
                      ['actions', 'Botões e chamadas'],
                      ['catalog', 'Busca e catálogo'],
                      ['forms', 'Formulários e WhatsApp'],
                      ['gallery', 'Galeria de imagens'],
                      ['products', 'Páginas de produtos'],
                      ['accessibility', 'Acessibilidade e idiomas'],
                    ].map(([id, title]) =>
                      S.listItem()
                        .id('texts-' + id)
                        .title(title)
                        .child(
                          S.document()
                            .schemaType('siteTexts')
                            .documentId('texts-' + id),
                        ),
                    ),
                  ),
              ),
            S.listItem()
              .title('Configurações do site')
              .child(S.document().schemaType('siteSettings').documentId('site-settings')),
          ]),
    }),
  ],
  document: {
    newDocumentOptions: (options) => options.filter((option) => !singletons.has(option.schemaType)),
    actions: (actions, context) =>
      singletons.has(context.schemaType)
        ? actions.filter((action) => !['delete', 'duplicate', 'unpublish'].includes(action.action))
        : actions,
  },
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((template) => !singletons.has(template.schemaType)),
  },
});
