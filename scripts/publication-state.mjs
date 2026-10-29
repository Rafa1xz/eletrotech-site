export function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

export function mergeRoutes(local, published) {
  const result = {...local};
  for (const [id, slug] of Object.entries(published || {})) {
    if (!/^[a-z0-9-]+$/.test(id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Registro de URL publicada inválido.');
    if (result[id] && result[id] !== slug) throw Error('Conflito com URL já publicada: ' + id);
    if (Object.entries(result).some(([otherId, otherSlug]) => otherId !== id && otherSlug === slug)) throw Error('URL publicada já reservada: ' + slug);
    result[id] = slug;
  }
  return result;
}
