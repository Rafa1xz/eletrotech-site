import {defineCliConfig} from 'sanity/cli';

export default defineCliConfig({
  studioHost: 'eletrotech-marechal-loja',
  deployment: {appId: 'amqfhe956pl78uv2063y3wx4'},
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
});
