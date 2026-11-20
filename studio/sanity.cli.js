import {defineCliConfig} from 'sanity/cli';

export default defineCliConfig({
  studioHost: 'eletrotech-marechal-painel',
  deployment: {appId: 'w59dh7jbjeg9hc8gfgvh9cci'},
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
});
