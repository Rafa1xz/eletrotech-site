import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './schemaTypes/index.js';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId) throw new Error('Configure SANITY_STUDIO_PROJECT_ID em studio/.env.local para conectar o Studio.');

export default defineConfig({
  name: 'eletrotech',
  title: 'Eletrotech Marechal',
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({structure: S => S.list().title('Conteúdo').items([
    S.documentTypeListItem('product').title('Produtos'),
    S.listItem().title('Configurações do site').child(S.document().schemaType('siteSettings').documentId('site-settings')),
  ])})],
  schema: {types: schemaTypes},
});
