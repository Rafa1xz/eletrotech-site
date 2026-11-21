import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT } from './paths.mjs';
const read = async (name) => JSON.parse(await readFile(resolve(ROOT, 'data', name), 'utf8'));
const [{ products }, { pages }, { services }, settings, { documents: texts }] = await Promise.all(
  ['products.json', 'pages.json', 'services.json', 'site.json', 'texts.json'].map(read),
);
const types = {
  texts: 'pageText',
  images: 'pageImage',
  videos: 'pageVideo',
  links: 'pageLink',
  sections: 'pageSection',
};
const documents = [
  ...products.map((product) => ({
    ...product,
    _id: product.id,
    _type: 'product',
    slug: { _type: 'slug', current: product.slug },
    specifications: product.specifications.map((spec, index) => ({
      ...spec,
      _type: 'specification',
      _key: `spec-${index}`,
    })),
  })),
  { ...settings, _id: 'site-settings', _type: 'siteSettings' },
  ...pages.map((page) => ({
    ...page,
    ...Object.fromEntries(
      Object.entries(types).map(([field, type]) => [
        field,
        (page[field] || []).map((item) => ({ ...item, _type: type })),
      ]),
    ),
  })),
  ...services,
  ...texts,
];
await mkdir(resolve(ROOT, '.cache'), { recursive: true });
await writeFile(
  resolve(ROOT, '.cache/cms-import.ndjson'),
  documents.map((document) => JSON.stringify(document)).join('\n') + '\n',
);
console.log(
  `Exportados ${documents.length} documentos em .cache/cms-import.ndjson. Nenhum dado remoto foi alterado.`,
);
