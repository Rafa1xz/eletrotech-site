// Local export only: importing into Sanity remains an explicit CLI operation.
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const {products} = await read('data/products.json');
const site = await read('data/site.json');
const documents = products.map(product => ({
  ...product, _id: product.id, _type: 'product',
  slug: {_type: 'slug', current: product.slug},
  specifications: product.specifications.map((spec, index) => ({...spec, _type: 'specification', _key: `spec-${index}`})),
}));
documents.push({...site, _id: 'site-settings', _type: 'siteSettings'});
await writeFile(resolve(root, 'data/sanity-import.ndjson'), documents.map(doc => JSON.stringify(doc)).join('\n') + '\n');
console.log(`Exportados ${products.length} produtos e configurações em data/sanity-import.ndjson. Nenhum dado foi enviado ao Sanity.`);
