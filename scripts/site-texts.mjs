import { readFile } from 'node:fs/promises';
import { createTextCatalog, mergeTextDocuments } from './text-catalog.mjs';
export async function loadSiteTexts(root) {
  const read = async (name) => {
    try {
      return JSON.parse(await readFile(new URL(name, root), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return { documents: [] };
      throw error;
    }
  };
  const [base, published] = await Promise.all([
    read('data/text-defaults.json'),
    read('data/texts.json'),
  ]);
  const documents = mergeTextDocuments(base.documents, published.documents);
  return { documents, catalog: createTextCatalog(documents) };
}
