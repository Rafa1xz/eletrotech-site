import {defineCliConfig} from 'sanity/cli';

export default defineCliConfig({
  studioHost: 'eletrotech-marechal',
  deployment: {appId: 'ul3ilq8b2bd9079q8wxa1lj7'},
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
});
