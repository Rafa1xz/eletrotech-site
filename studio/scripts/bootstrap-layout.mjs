// Run after reviewing the configured project; never replaces existing content.
import { getCliClient } from 'sanity/cli';
import { readFile } from 'node:fs/promises';
import { missingPageFields } from '../../scripts/cms-migration.mjs';
const client = getCliClient({ apiVersion: '2026-10-28' }).withConfig({ useCdn: false });
const { pages } = JSON.parse(
  await readFile(new URL('../../data/cms-defaults.json', import.meta.url), 'utf8'),
);
let updated = 0;
for (const base of pages) {
  const versions = await client.fetch(
    '*[_id in $ids]',
    { ids: [base._id, 'drafts.' + base._id] },
    { perspective: 'raw' },
  );
  for (const document of versions) {
    const patch = missingPageFields(base, document);
    if (Object.keys(patch).length) {
      await client.patch(document._id).ifRevisionId(document._rev).set(patch).commit();
      updated++;
    }
  }
}
console.log(
  `Campos de layout inicializados: ${updated} documentos atualizados. Edições e rascunhos preservados.`,
);
