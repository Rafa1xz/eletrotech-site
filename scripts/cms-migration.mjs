import { mergePage } from './cms-content.mjs';

// Only adds missing template fields. Existing edits, array order and drafts win.
export function missingPageFields(base, document) {
  const merged = mergePage(base, document),
    patch = {};
  if (document.menuOrder == null) patch.menuOrder = base.menuOrder;
  for (const [name, type] of Object.entries({
    images: 'pageImage',
    videos: 'pageVideo',
    links: 'pageLink',
    sections: 'pageSection',
  })) {
    const items = merged[name].map((item) => ({ ...item, _type: type }));
    if (items.length !== (document[name] || []).length) patch[name] = items;
  }
  return patch;
}
